const express = require('express');
const { ParseServer } = require('parse-server');
const ParseDashboard = require('parse-dashboard');

const masterKey = process.env.MASTER_KEY;
const appId = process.env.APP_ID;
const mongoDSN = process.env.MONGO_DSN;
const redisDSN = process.env.REDIS_DSN;
const port = process.env.PORT;
const serverURL = process.env.PARSE_SERVER_URL || `http://localhost:${port}/parse`;
const facebookAppId = process.env.FACEBOOK_APP_ID;

const api = new ParseServer({
  databaseURI: mongoDSN, // Connection string for your MongoDB database
  cloud: './cloud/main.js', // Absolute path to your Cloud Code
  allowClientClassCreation: false,
  appId,
  masterKey,
  logsFolder: null,
  verbose: false,
  silent: false,
  serverURL, // Don't forget to change to https if needed
  liveQuery: {
    classNames: ['RecyclingPoint'],
    redisURL: redisDSN,
  },
  auth: {
    facebook: {
      appIds: facebookAppId,
    },
  },
  // protectedFields: {
  //   Device: {
  //     "*": ["key"],
  //   }
  // }
});

const options = { allowInsecureHTTP: Boolean(process.env.ALLOW_INSECURE_HTTP) || false };

const dashboard = new ParseDashboard({
  apps: [
    {
      appName: 'Colmena Core Api',
      serverURL,
      appId,
      masterKey,
    },
  ],
  users: [
    {
      user: 'admin',
      pass: process.env.CORE_DASHBOARD_PASS,
    },
  ],
  useEncryptedPasswords: true,
}, options);

const app = express();


// make the Parse Server available at /parse
app.use('/parse', api);
// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

// TODO: REMOVE THIS LINE BELOW
// app.use(express.static('client-example'));


const httpServer = require('http').createServer(app);

httpServer.listen(port, () => console.log(`Server running on ${serverURL}`));
ParseServer.createLiveQueryServer(httpServer, { });
