'use strict';

const ObjectId = require("mongodb").ObjectId;
const commonIds = require('./commonIds');

module.exports = {
  "collection": "permissions",
  "objects": [
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "foo",
      "method": "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "foo",
      "method": "POST",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "bar",
      "method": "GET",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "bar",
      "method": "POST",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "bar",
      "method": "PUT",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "bar",
      "method": "DELETE",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "object": "baz",
      "method": "GET",
      "allowed": true
    }
  ]
};