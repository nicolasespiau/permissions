'use strict';

const ObjectId = require("mongodb").ObjectId;

module.exports = {
  "users": [
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId()
  ],
  "roles": [
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId()
  ],
  "degrees": [
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId()
  ],
  "schools": [
    ObjectId(),
    ObjectId(),
    ObjectId(),
    ObjectId()
  ]
};