'use strict';

const cacheOpts = require('../config/config').getRedisConf();
const cacheClient = require('@bonjourjohn/dbhelper').Cache(cacheOpts);

module.exports = cacheClient;
