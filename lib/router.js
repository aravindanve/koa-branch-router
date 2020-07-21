const debug = require('debug')('koa-branch-router:router');
const compose = require('koa-compose');
const RouteFragment = require('./route-fragment');
const tree = require('./tree');
const utils = require('./utils');

class Router extends RouteFragment {
  constructor({ prefix = '', caseSensitive = false, strict = false } = {}) {
    super({ prefix, caseSensitive, strict });
    this.type = tree.TYPE.BOUNDARY_NODE;
  }

  lookup(method, path, params = {}) {
    const chain = tree.lookup(this, method, path, params);

    debug('lookup %s "%s" matched %s layers', method, path, chain.length);

    const handles = [];
    for (const node of chain) {
      handles.push(utils.bindParams(node.params, node.handle));
    }

    return handles.length ? compose(handles) : undefined;
  }

  handle(ctx, next) {
    const handle = this.lookup(ctx.method, ctx.path, ctx.params);
    return handle ? handle(ctx, next) : next();
  }

  routes() {
    return (ctx, next) => this.handle(ctx, next);
  }
}

module.exports = Router;
