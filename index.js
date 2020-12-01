module.exports = () => function utLoadTest() {
    return {
        config: require('./config'),
        adapter: () => [
            require('./port')
        ],
        test: () => require('./test/jobs')
    };
};
