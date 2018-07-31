'use strict';

const Collection = require('@bonjourjohn/dbhelper').Collection;

module.exports = class RolesCollection extends Collection {
  constructor(dbInstance, cacheClient) {
    super(dbInstance, 'roles', cacheClient);
  }
};
