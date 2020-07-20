const debug = require('debug')('koa-branch-router:layer');
const Type = require('./type');
const methods = require('./methods');

class Layer {
  constructor({ methods, handle }) {
    this.type = Type.layer;
    this.methods = methods;
    this.handle = handle;

    debug('initialized with methods %s', methods);
  }

  layers(method, path, params) {
    if (path) return []; // skip if path not empty
    if (
      this.methods.length === 0 || // no methods aka middleware
      this.methods === methods || // all methods
      this.methods.includes(method)
    ) {
      return [
        {
          params,
          methods: this.methods,
          handle: this.handle,
        },
      ];
    } else {
      return [];
    }
  }
}

module.exports = Layer;
