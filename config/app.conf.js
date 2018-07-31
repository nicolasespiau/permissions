'use strict';

module.exports = {
  "port": process.env.PORT,
  "sentry_url": process.env.SENTRY_URL,
  "redis": {
    "host": process.env.REDIS_HOST,
    "port": process.env.REDIS_PORT,
    "db": process.env.REDIS_DBINDEX,
    reconnectOnError: function (err) {
      const targetError = 'READONLY';
      if (err.message.slice(0, targetError.length) === targetError) {
        // Only reconnect when the error starts with "READONLY"
        return 2;
      }
    }
  }
};