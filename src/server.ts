import express from 'express';
import http from 'http';
import ParseServerOptions from './config';

const { ParseServer } = require('parse-server');
const ParseDashboard = require('parse-dashboard');

const {
  port, liveQuery, serverURL, appId, masterKey, readOnlyMasterKey,
} = ParseServerOptions;

const api = new ParseServer(ParseServerOptions);
const dashboard = new ParseDashboard(
  {
    apps: [
      {
        appName: 'Colmena Core Api',
        serverURL,
        appId,
        masterKey,
        readOnlyMasterKey,
      },
    ],
    users: [
      {
        user: 'admin',
        pass: process.env.DASHBOARD_PASS,
      },
      {
        user: 'test',
        pass: process.env.DASHBOARD_TEST_PASS,
        readOnly: true,
      },
    ],
    useEncryptedPasswords: true,
  },
  {
    trustProxy: 1,
    allowInsecureHTTP: !!process.env.ALLOW_INSECURE_HTTP || false,
  },
);

const app = express();

// make the Parse Server available at /parse
app.use('/parse', api);
// make the Parse Dashboard available at /dashboard
app.use('/', dashboard);

// TODO: REMOVE THIS LINE BELOW
// app.use(express.static('client-example'));

const httpServer = http.createServer(app);

// eslint-disable-next-line no-console
httpServer.listen(port, () => console.log(`Server running on ${serverURL}`));
ParseServer.createLiveQueryServer(httpServer, {
  redisURL: liveQuery.redisURL,
});
