'use strict';
let ObjectId = require('mongodb').ObjectId;
const roleIds = require('./commonIds').roles;

module.exports = {
  collection: "roles",
  objects: [
    {
      "_id": roleIds[0],
      "name": "visitor",
      "code": "vst"
    }
  ]
};