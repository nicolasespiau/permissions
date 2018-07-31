'use strict';

const ObjectId = require("mongodb").ObjectId;
const commonIds = require('./commonIds');

module.exports = {
  "collection": "permissions",
  "objects": [
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "method": "GET",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "method": "GET",
      "object": "degrees",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "method": "GET",
      "object": "subjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "method": "GET",
      "object": "degreesubjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[0],
      "method": "GET",
      "object": "users",
      "allowed": false,
      "except": [commonIds.users[0]]
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[0],
      "method": "PUT",
      "object": "users",
      "allowed": false,
      "except": [commonIds.users[0]]
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[1],
      "method": "POST",
      "object": "subscriptions",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[1],
      "method": "PUT",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[1],
      "method": "DELETE",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[1],
      "method": "POST",
      "object": "subscriptions",
      "allowed": false
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[2],
      "method": "GET",
      "object": "subscriptions",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "GET",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "POST",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "PUT",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "DELETE",
      "object": "schools",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "GET",
      "object": "degrees",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "POST",
      "object": "degrees",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "PUT",
      "object": "degrees",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "DELETE",
      "object": "degrees",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "GET",
      "object": "subjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "POST",
      "object": "subjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "PUT",
      "object": "subjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "roleId": commonIds.roles[5],
      "method": "DELETE",
      "object": "subjects",
      "allowed": true
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[3],
      "method": "PUT",
      "object": "degrees",
      "allowed": false,
      "except": [commonIds.degrees[0]]
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[3],
      "method": "DELETE",
      "object": "degrees",
      "allowed": false,
      "except": [commonIds.degrees[0]]
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[3],
      "method": "GET",
      "object": "degrees",
      "allowed": false,
      "except": [commonIds.degrees[0]]
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[4],
      "method": "PUT",
      "object": "degrees",
      "allowed": false
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[4],
      "method": "DELETE",
      "object": "degrees",
      "allowed": false
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[4],
      "method": "GET",
      "object": "degrees",
      "allowed": false
    },
    {
      "_id": ObjectId(),
      "userId": commonIds.users[4],
      "method": "GET",
      "object": "schools",
      "allowed": true,
      "except": [commonIds.schools[0]]
    }
  ]
};