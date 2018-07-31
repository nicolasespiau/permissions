'use strict';

const koa = require('koa');
const koaBody = require('koa-body');
const morgan = require('koa-morgan');
const AppError = require('@bonjourjohn/app-error');
const appSettings = require('./config/app.conf');
const ObjectUtils = require('@bonjourjohn/utils').Objects;

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

    if (err.errno >= 500) {
      ctx.raven.captureException(err);
    }
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

/** install logger **/
// if (process.env.NODE_ENV !== "development") {
app.use(morgan(':req[X-Forwarded-For] - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ":req[X-Access-Token]"'));
// }

const mongoConnection = require('./lib/mongoClient');
const cacheClient = require('./lib/cacheClient');

app.use(async (c, n) => {
  //load mongoConnection and mongoClient into context
  [app.context.DB, app.context.mongoClient] = await mongoConnection.init();
  app.context.cacheClient = cacheClient;

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

let hostname = require('os').hostname();

let server = app.listen(appSettings.port);
server.on('listening', async () => {
  const [DB, mongoClient] = await mongoConnection.init().catch((e) => {
    console.log("ERR", e);
    mongoConnection.close();
    process.exit();
  });

  if (cacheClient.status === "ready") {
    server.emit("ready");
  }
  cacheClient.once('ready', () => {
    server.emit("ready");
  });

  console.log('PERMISSIONS-SERVICE running on', hostname, 'port', appSettings.port);
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
