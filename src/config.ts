import { nullParser } from "./cloud/utils";
const SimpleSendGridAdapter = require('./adapters/SendGridAdapter');

const masterKey = process.env.MASTER_KEY;
const readOnlyMasterKey = process.env.READ_ONLY_MASTER_KEY;
const appId = process.env.APP_ID;
const mongoDSN = process.env.MONGO_DSN;
const redisDSN = process.env.REDIS_DSN;
const port = process.env.PORT || 80;
const serverURL = process.env.PARSE_SERVER_URL || `http://localhost:${port}/parse`;
const facebookAppId = process.env.FACEBOOK_APP_ID;
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const publicServerURL = process.env.PUBLIC_SERVER_URL;

export default {
  port,
  databaseURI: mongoDSN, // Connection string for your MongoDB database
  cloud: `${__dirname}/cloud/main.ts`, // Absolute path to your Cloud Code
  allowClientClassCreation: false,
  enableSingleSchemaCache: true,
  preserveFileName: false,
  appId,
  masterKey,
  readOnlyMasterKey,
  jsonLogs: false,
  logLevel: process.env.PARSE_SERVER_LOGS_LEVEL,
  logsFolder: nullParser(process.env.PARSE_SERVER_LOGS_FOLDER),
  verbose: true,
  silent: false,
  serverURL, // Don't forget to change to https if needed
  liveQuery: {
    classNames: ['RecyclingPoint'],
    redisURL: redisDSN,
  },
  push: {
    android: {
      apiKey: process.env.FCM_SERVER_KEY,
    },
  },
  auth: {
    facebook: {
      appIds: facebookAppId,
    },
  },
  appName: 'Colmena',
  publicServerURL,
  emailAdapter: SimpleSendGridAdapter({
    apiKey: sendgridApiKey,
    fromAddress: 'notifications@colmenaapp.com',
  }),
  verifyUserEmails: true,
  emailVerifyTokenValidityDuration: 21600,
  preventLoginWithUnverifiedEmail: true,
};
