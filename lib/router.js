const debug = require('debug')('koa-branch-router:router');
const compose = require('koa-compose');
const assert = require('assert');
const Type = require('./type');
const PathFragment = require('./path-fragment');
const utils = require('./utils');
const Layer = require('./layer');
const CaptureAllFragment = require('./capture-all-fragment');
const CaptureParamFragment = require('./capture-param-fragment');

class Router extends PathFragment {
  constructor({ path }) {
    super({ path });
    this.type = Type.router;
    this.stack = [];
  }

  add(methods, ...args) {
    let path = typeof args[0] === 'string' ? args.shift() : '';
    let stack = args.map((handle) => new Layer({ methods, handle }));

    assert(stack.length, 'You must provide at least one middleware');

    debug('adding methods %s at path "%s" handlers %s', methods, stack.length);

    // handle wildcard `*`
    const wildcardStartIndex = path.indexOf('*');
    if (wildcardStartIndex !== -1) {
      const capture = path.slice(wildcardStartIndex + 1);

      debug('creating wildcard capture fragment "*%s"', capture);

      stack = [new CaptureAllFragment({ capture, stack })];
      path = path.slice(0, wildcardStartIndex);

      debug('remaining sliced path "%s"', path);
    }

    // handle params rtl `:`
    let paramStartIndex = path.lastIndexOf(':');
    while (paramStartIndex !== -1) {
      const slashIndex = path.indexOf('/', paramEndIndex);
      const paramEndIndex = slashIndex !== -1 ? slashIndex : path.length;
      const suffix = path.slice(paramEndIndex);
      const capture = path.slice(paramStartIndex + 1, paramEndIndex);

      if (suffix) {
        debug('creating path fragment "%s"', suffix);
        stack = [new PathFragment({ path: suffix, stack })];
      }

      debug('creating param capture fragment ":%s"', capture);

      stack = [new CaptureParamFragment({ capture, stack })];
      path = path.slice(0, paramStartIndex);
      paramStartIndex = path.lastIndexOf(':');

      debug('remaining sliced path "%s"', path);
    }

    // handle static path
    if (path) {
      debug('creating path fragment "%s"', path);
      stack = [new PathFragment({ path, stack })];
      path = '';
    }

    // pop last layer to merge
    const last = this.stack.pop();

    // push compact stack
    this.stack.push(...utils.compactStack(last ? [last, ...stack] : stack));

    return this;
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
    return (ctx, next) => {
      const method = ctx.method.toLowerCase();
      const path = ctx.path.replace(/\/+/g, '/');
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
