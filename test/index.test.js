require('ut-run').run({
    method: 'unit',
    params: {
        cluster: {
            workers: 4
        }
    },
    version: require('../package.json').version,
    root: __dirname,
    resolve: require.resolve
});
