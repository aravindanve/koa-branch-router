const http = require('http');
const methods = http.METHODS.map((it) => it.toLowerCase());

module.exports = methods;
