'use strict';

const ObjectId = require("mongodb").ObjectId;
const commonIds = require('./commonIds');

module.exports = {
  "collection": "permissions",
  "objects": [
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "foo",
      "method":  "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "foo",
      "method":  "POST",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "foo",
      "method":  "PUT",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "foo",
      "method":  "DELETE",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "bar",
      "method":  "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "bar",
      "method":  "POST",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[0],
      "object": "baz",
      "method":  "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[0],
      "object": "boz",
      "method":  "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[0],
      "object": "baz",
      "method":  "GET",
      "allowed": false
    }
  ]
};