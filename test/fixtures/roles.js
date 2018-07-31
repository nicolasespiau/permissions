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
    },
    {
      "_id": roleIds[1],
      "name": "student",
      "code": "std"
    },
    {
      "_id": roleIds[2],
      "name": "parent",
      "code": "prt"
    },
    {
      "_id": roleIds[3],
      "name": "teacher",
      "code": "tch"
    },
    {
      "_id": roleIds[4],
      "name": "lesson_trainee",
      "code": "lst"
    },
    {
      "_id": roleIds[5],
      "name": "admin",
      "code": "adm"
    },
    {
      "_id": roleIds[6],
      "name": "operator",
      "code": "ope"
    },
    {
      "_id": roleIds[7],
      "name": "partner",
      "code": "ptn"
    }
  ]
};