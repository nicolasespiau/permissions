'use strict'

const {createLogger, format, transports} = require("winston");

module.exports = {
    logger: null,
    createLogger(winstonOptions) {
        if (winstonOptions.format) {
            const combineArgs = winstonOptions.format.split(",").map(singleformat => {
                return format[singleformat]();
            });
            winstonOptions.format = format.combine(...combineArgs);
        }
        if (winstonOptions.transports) {
            const logtransports = winstonOptions.transports.map(transportName => {
                return new transports[transportName]();
            })
            winstonOptions.transports = logtransports;
        }
        if (this.logger == null) {
            this.logger = createLogger(winstonOptions);
        }
        return this.logger;
    }
};