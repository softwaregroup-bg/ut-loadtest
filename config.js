const test = {
    port: {
        report: '.lint/load'
    }
};

module.exports = () => ({
    // environments
    dev: {
    },
    test,
    jenkins: test,
    uat: {
    },
    // test types
    load: {
        adapter: true
    },
    validation: ({joi}) => joi.object({
        port: joi.object(),
        adapter: joi.boolean(),
        test: joi.boolean()
    })
});
