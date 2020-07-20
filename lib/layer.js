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
    if (
      this.methods.length === 0 || // aka middleware
      (!path && // match only empty paths for handlers
        (this.methods === methods || // aka includes all methods
          this.methods.includes(method)))
    ) {
      return [
        {
          params,
          methods: this.methods,
          handle: this.handle,
        },
      ];
    }
    return [];
  }
}

module.exports = Layer;
