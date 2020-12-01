module.exports = {
    implementation: 'loadtest',
    utLoadTest: {
        port: {
            report: '.lint/load',
            namespace: ['loadtest/health']
        },
        test: true
    }
};
