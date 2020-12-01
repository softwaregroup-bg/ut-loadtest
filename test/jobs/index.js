module.exports = [function load() {
    return {
        execute: function(test, bus, run) {
            return run(test, bus, [{
                method: 'loadtest/transferFlow.push.execute',
                name: 'transfer using simulator',
                params: () => ({
                    autocannon: {
                        method: 'GET',
                        path: '/healthz',
                        duration: 5
                    }
                }),
                result: function({
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
                }, assert) {
                    assert.comment(JSON.stringify({tps, latency, bps, count}, false, 2));
                }
            }]);
        }
    };
}];
