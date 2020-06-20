'use strict';

const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server;
const ReplSetServers = require('mongodb').ReplSet;
const mongoSettings = require('../config/config').getMongoConf();
const AppError = require('@bonjourjohn/app-error');

//the MongoDB connection
let replStat;
let servers = [];

function buildConUrl(options) {
  let conString = "mongodb://";
  if (options.user && options.password) {
    conString += options.user+":"+escape(options.password)+"@";
  }
  conString += options.host+"/"+options.db;
  if (options.replicaSet) {
    conString += "?replicaSet=".options.replicaSet;
  }
  return conString;
}

module.exports = {
  connectionInstance: null,
  dbClient: null,
  async init(ctx) {
    //if already we have a connection, don't connect to database again
    if (this.connectionInstance) {
      return [this.connectionInstance, this.dbClient];
    }

    const conString = buildConUrl(mongoSettings);

    let connectOptions = {
      "authSource": mongoSettings.authenticationDatabase || "admin",
      "useUnifiedTopology": true
    };
    if (mongoSettings.replicaSet) {
      connectOptions.replicaSet = mongoSettings.replicaSet
    }

    this.dbClient = await new MongoClient(
      conString,
      connectOptions
    ).connect();
    this.connectionInstance = this.dbClient.db(mongoSettings.db);

    return [this.connectionInstance, this.dbClient];
  },

  async close() {
    if (!client) {
      throw new AppError(500, "There is no client to close.");
    }
    await client.close();
    this.connectionInstance = false;
    servers = [];
  },

  db() {
    return this.connectionInstance;
  },

  client() {
    return client;
  }
};
