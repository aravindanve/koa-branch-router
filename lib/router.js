const debug = require('debug')('koa-branch-router:router');
const compose = require('koa-compose');
const Type = require('./type');
const RouteFragment = require('./route-fragment');

class Router extends RouteFragment {
  constructor({ prefix, caseSensitive = false, strict = false }) {
    super({ prefix, caseSensitive, strict });
    this.type = Type.router;

    debug('initialized with options %o', { prefix, caseSensitive, strict });
  }

  layers(method, path, params) {
    const layers = super.layers(method, path, params);
    const lastHandlerIndex = [].reduce(
      (lastIndex, layer, i) => (layer.methods.length !== 0 ? i : lastIndex),
      -1,
    );

    debug(
      'layers matched: %s, last handler index: %s',
      layers.length,
      lastHandlerIndex,
    );

    // return only upto the last matched handler
    return lastHandlerIndex !== -1 ? layers.slice(0, lastHandlerIndex) : [];
  }

  routes() {
    // return dispatch
    return (ctx, next) => {
      const method = ctx.method;

      // NOTE: do not remove duplicate slashes, user can
      // use an app level middleware to do that
      const path = ctx.path;
      const params = ctx.params || {};

      debug('dispatch %s "%s" %O', method, path, params);

      const layers = this.layers(ctx.method, path, params);
      const handlers = layers.map((layer) => (ctx, next) => {
        ctx.params = layer.params;
        return layer.handle(ctx, next);
      });

      if (handlers.length) {
        debug('composing %s handlers', handlers.length);
        return compose(handlers)(ctx, next);
      } else {
        debug('no handlers matched');
        return next();
      }
    };
  }
}

module.exports = Router;
