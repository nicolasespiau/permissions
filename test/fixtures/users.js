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
      "roles": [commonIds.roles[1]]
    },
    {
      "_id": commonIds.users[1],
      "credentials": {
        "username": "otherstudent"
      },
      "email": "otherstudent@domain.fr",
      "roles": [commonIds.roles[1]]
    },
    {
      "_id": commonIds.users[2],
      "credentials": {
        "username": "otherotherstudent"
      },
      "email": "otherotherstudent@domain.fr",
      "roles": [commonIds.roles[1]]
    },
    {
      "_id": commonIds.users[3],
      "credentials": {
        "username": "admin"
      },
      "email": "admin@domain.fr",
      "roles": [commonIds.roles[5]]
    },
    {
      "_id": commonIds.users[4],
      "credentials": {
        "username": "admin"
      },
      "email": "admin@domain.fr",
      "roles": [commonIds.roles[5]]
    },
    {
      "_id": commonIds.users[5],
      "credentials": {
        "username": "operator"
      },
      "email": "operator@domain.fr",
      "roles": [commonIds.roles[6]]
    }
  ]
};
