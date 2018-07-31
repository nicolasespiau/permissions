'use strict';

const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server;
const ReplSetServers = require('mongodb').ReplSet;
const mongoSettings = require('../config/db.conf');
const AppError = require('@bonjourjohn/app-error');

//the MongoDB connection
let replStat;
let servers = [];

// let connectionInstance;
let client;

module.exports = {
  connectionInstance: null,
  async init() {
    //if already we have a connection, don't connect to database again
    if (this.connectionInstance) {
      return [this.connectionInstance, client];
    }

    mongoSettings.host.split(',').forEach((host) => {
      servers.push(new Server(host, parseInt(mongoSettings.port)));
    });
    if (servers.length > 1) {
      replStat = new ReplSetServers(servers);
    } else {
      replStat = servers[0];
    }

    client = await new MongoClient(
      replStat,
      {
        user: mongoSettings.user
        , password: mongoSettings.password
      }
    ).connect();
    this.connectionInstance = client.db(mongoSettings.db);

    return [this.connectionInstance, client];
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
