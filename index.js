'use strict';

const koa = require('koa');
const koaBody = require('koa-body');
const morgan = require('koa-morgan');
const AppError = require('@bonjourjohn/app-error');
const appSettings = require('./config/config').getAppSettings();
const ObjectUtils = require('@bonjourjohn/utils').Objects;
const winston = require("winston");

const app = new koa();

//custom error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    //if caught error is not AppError, lets convert it
    if (!err.name || err.name !== "AppError") {
      err = AppError.fromError(err);
    }

    console.log(err);
    // will only respond with JSON
    ctx.status = err.errno;
    ctx.body = {
      errno: err.errno,
      error: err.error
    };
  }
});

//force all responses to be json
app.use(async (c, n) => {
  c.response.type = "application/json";
  await n();
});

//creates a ctx.query based on ctx.request.querystring
app.use(async (c, n) => {
  const query = c.request.querystring;

  if (ObjectUtils.isEmpty(query)) {
    return n();
  }

  const pieces = query.split("&");
  c.query = {};

  await Promise.all(pieces.map((keyval) => {
    const [key, val] = keyval.split("=");
    c.query[key] = val;
  }));

  await n();
});

app.use(koaBody({
  jsonLimit: '1kb'
}));

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, x-access-token, Content-length, X-Requested-With, x-app-token');

  if (!ctx.req.headers['x-app-token']) {
    ctx.throw(401, "Client app must be identified");
  }

  if ('OPTIONS' === ctx.method) {
    ctx.status = 200;
  }

  await next();
});

/** install loggers **/
app.use(morgan(':req[X-Forwarded-For] - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ":req[X-Access-Token]"'));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'permission-service' },
  transports: [
    new winston.transports.Console()
  ],
});
app.use(async(c,n) => {
  app.context.logger = logger;
  await n();
});

app.on('close', async () => {
  console.log("closing app");
  try {
    await Promise.all([
      app.context.mongoClient.close(),
      app.context.cacheClient.quit()
    ]);
  } catch (e) {
    console.log("Err when closing app:", e);
  }
});

//load routes
const router = require('./routing/router');
app.use(router.routes());


const mongoConnection = require('./lib/mongoClient');
const cacheClient = require('./lib/cacheClient');

let hostname = require('os').hostname();

let server = app.listen(appSettings.port);
server.on('listening', async () => {
  [app.context.DB, app.context.mongoClient] = await mongoConnection.init().catch((e) => {
    console.log("ERR", e);
    mongoConnection.close();
    process.exit();
  });
  app.context.DB.on('connect', () => {
    console.log("Connected to DB");
  });
  app.context.DB.on('close', () => {
    console.log("Connection to DB close");
  });
  app.context.DB.on('error', (err) => {
    console.log("Connection to DB encountered an error", err);
  });
  app.context.DB.on('reconnect', () => {
    console.log("RE-connected to DB");
  });
  app.context.DB.on('commandStarted', () => {
    console.log("DB command started");
  });

  if (cacheClient.status === "ready") {
    server.emit("ready");
    app.context.cacheClient = cacheClient;
  }
  cacheClient.on('ready', () => {
    console.log("Cache ready")
    app.context.cacheClient = cacheClient;
    server.emit("ready");
  });

  console.log('PERMISSIONS-SERVICE running on', hostname, 'port', appSettings.port);
});
server.on('ready', async() => {
  console.log("Server is fully ready.");
});
server.on('close', async () => {
  try {
    mongoConnection.close();
    cacheClient.end();
  } catch (e) {
    console.log("Err when closing app:", e);
  }
});

module.exports = server;
