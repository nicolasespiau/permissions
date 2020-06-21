'use strict';

const cacheOpts = require('../config/config').getRedisConf();
const cacheClient = require('@bonjourjohn/dbhelper').Cache(cacheOpts);
const logger = require("./logger").logger;
const sprintf = require("util").format;

if (logger != null) {
    logger.log('info', sprintf("Cache options: %s", cacheOpts));
}

module.exports = cacheClient;
