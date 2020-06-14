'use strict'

const nconf = require("nconf");

nconf.env().argv();
nconf.file(nconf.any("CONFIG_FILE", "config"));

module.exports = {
    getAppSettings() {
        return {
            "port": nconf.get("PORT")
        }
    },
    getRedisConf() {
        return {
            "host": nconf.get("REDIS_HOST"),
            "port": nconf.get("REDIS_PORT"),
            "db": nconf.get("REDIS_DB")
        }
    },
    getMongoConf() {
        return {
            "db": nconf.get("MONGO_DB"),
            "host": nconf.get("MONGO_HOST"),
            "user": nconf.get("MONGO_USER"),
            "password": nconf.get("MONGO_PASSWD"),
            "port": nconf.get("MONGO_PORT")
        }
    }
}