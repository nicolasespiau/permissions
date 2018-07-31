'use strict';

const Collection = require('@bonjourjohn/dbhelper').Collection;

module.exports = class UsersCollection extends Collection {
  constructor(dbInstance, cacheClient) {
    super(dbInstance, 'users', cacheClient);
  }
};
