'use strict';

const ObjectId = require("mongodb").ObjectId;
const commonIds = require('./commonIds');

module.exports = {
  "collection": "users",
  "objects": [
    {
      "_id": commonIds.users[0],
      "credentials": {
        "username": "student"
      },
      "email": "student@domain.fr",
      "roles": [commonIds.roles[0]]
    }
  ]
};
