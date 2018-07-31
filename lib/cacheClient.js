'use strict';

const cacheOpts = require('../config/app.conf').redis;
const cacheClient = require('@bonjourjohn/dbhelper').Cache(cacheOpts);

module.exports = cacheClient;
