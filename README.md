# UT LoadTest

Uses autocannon to send many requests in parallel to a backend and
measures metrics like latency, requests per second, bytes per second.

## Usage

```text
ut-xxx
└── test
    ├── jobs
    |   ├── index.js
    |   └── test.xxx.load.js
    ├── server
    |   ├── index.js
    |   └── unit.js
    └── xxx.load.js
```

- `test/jobs/test.xxx.load.js`

   ```js
   // load tests function names start with 'load'
   module.exports = function load() {
       return {
           executePush: function(test, bus, run) {
               return run(test, bus, [
                   'Generate admin user',
                   'Login admin user',
                   'Create access token',
                   // other steps
                   {
                       method: 'loadtest/xxx',
                       name: '...',
                       params: ({
                           loginToken,
                       }) => ({
                           autocannon: {
                               auth: loginToken
                           },
                           // other parameters
                       }),
                       result: function(result, assert) {
                           // result contains metrics
                       }
                   }
               ]);
           }
       };
   };
   ```

- `test/server/index.js`

   ```js
   module.exports = [
       'ut-telemetry',
       'ut-db',
       // ... other modules
       'ut-user',
       'ut-login',
       'ut-loadtest',
       // ... other modules
   ].map(item => [{
       main: require.resolve(item),
       pkg: require.resolve(item + '/package.json')
   }]);
   ```

- `test/server/unit.js`

   ```js
   module.exports = {
       implementation: 'xxx',
       utLoadTest: true,
       // ... other configuration
   }
   ```

- `test/server/xxx.load.js`

   ```js
   require('ut-run').run({
       method: 'unit',
       params: {
           cluster: { // this activates load tests
               workers: 4
           }
       },
       version: require('../package.json').version,
       root: __dirname,
       resolve: require.resolve
   });
   ```
