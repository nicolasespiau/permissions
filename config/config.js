'use strict'

const nconf = require("nconf");

nconf.env().argv();
nconf.file(nconf.any("CONFIG_FILE", "config"));

module.exports = {
    getAppSettings() {
        return {
            "port": nconf.get("PORT"),
            "logLevel": nconf.get("LOG_LEVEL") || "error",
            "logFormat": nconf.get("LOG_FORMAT") || "splat,simple"
        }
    },
    getRedisConf() {
        return {
            "host": nconf.get("REDIS_HOST"),
            "port": nconf.get("REDIS_PORT"),
            "db": nconf.get("REDIS_DBINDEX"),
            "connectTimeout": 1000
        }
    },
    getMongoConf() {
        return {
            "db": nconf.get("MONGO_DB"),
            "host": nconf.get("MONGO_HOST")+":"+nconf.get("MONGO_PORT"),
            "user": nconf.get("MONGO_USER"),
            "password": nconf.get("MONGO_PASSWD"),
            "replicaSet": nconf.get("MONGO_REPLSET")
        }
    }
}