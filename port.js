const request = require('request');
const [httpGet] = [request.get].map(require('util').promisify);
const gateway = require('ut-bus/gateway');
const jose = require('ut-bus/jose');
const run = require('autocannon');
const errorsJson = require('./errors.json');
const fs = require('fs-plus');
const {join, basename} = require('path');

module.exports = ({
    utPort,
    registerErrors
}) => class port extends utPort {
    get defaults() {
        return {
            type: 'loadtest',
            imports: [/\.loadtest$/],
            mle: {},
            autocannon: {
                idReplacement: true,
                duration: 15,
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                }
            }
        };
    }

    async init() {
        const result = super.init(...arguments);
        this.bytesSent = this.counter && this.counter('counter', 'bs', 'Bytes sent', 300);
        this.bytesReceived = this.counter && this.counter('counter', 'br', 'Bytes received', 300);
        const errors = registerErrors(errorsJson);
        const get = async url => {
            return (await httpGet(url)).body;
        };
        this.gateway = gateway({
            serverInfo: () => '',
            mleClient: await jose(this.config.mle || {}),
            errors,
            get
        });
        return result;
    }

    async start() {
        const result = await super.start(...arguments);
        if (this.config.report) fs.makeTreeSync(this.config.report);
        this.pull(this.exec);
        return result;
    }

    async exec({autocannon: {auth, filename, path, name, ...autocannon} = {}, ...params}, {method}) {
        const login = await this.bus.discoverService('login');
        const {hostname, protocol, port} = login;
        const codec = await this.gateway({
            hostname,
            protocol,
            port,
            method,
            auth: auth || this.config.auth
        });
        const {headers} = codec.encode(params);
        const {hostname: methodHostname, protocol: methodProtocol, port: methodPort} = await this.bus.discoverService(method.split('.', 2)[0]);
        const report = ['timeStamp,elapsed,label,responseCode,responseMessage,threadName,dataType,success,bytes,sentBytes'];

        const result = run({
            ...this.config.autocannon,
            ...autocannon,
            url: `${methodProtocol}://${methodHostname}:${methodPort}${path || codec.requestParams.path}`,
            headers: {
                ...this.config.autocannon.headers,
                ...headers
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: '<id>',
                method,
                params
            })
        });
        result.on('tick', ({counter, bytes}) => {
            this.bytesReceived(bytes);
            this.msgReceived(counter);
        });
        if (this.config.report && filename !== false) {
            result.on('response', (client, statusCode, bytes, time) => {
                const success = statusCode >= 200 && statusCode < 300;
                this.portLatency(time, 1);
                name = name || `${client.opts.method} ${client.opts.path}`;
                report.push(`${Date.now()},${Math.round(time)},${name},${statusCode},${client.parser.info.statusMessage},ut,application/json,${success},${bytes},${client.opts.requests[0].requestBuffer.length}`);
            });
            result.on('done', results => {
                fs.writeFileSync(join(this.config.report, basename(filename || method.replace(/\//g, '-')) + '.csv'), report.join('\n'));
                const {
                    requests: {
                        average: tps,
                        sent: count
                    },
                    latency: {
                        average: latency
                    },
                    throughput: {
                        average: bps
                    }
                } = results;
                this.log?.warn?.({tps, count, latency, bps, $meta: {mtid: 'request', method}});
            });
        }

        return result;
    }
};
