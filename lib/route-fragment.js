const debug = require('debug')('koa-branch-router:route-fragment');
const assert = require('assert');
const tree = require('./tree');

class RouteFragment {
  constructor({ prefix = '', caseSensitive = false, strict = false } = {}) {
    this.type = tree.FRAGMENT_NODE;
    this.chain = [];
    this.prefix = prefix;
    this.caseSensitive = caseSensitive;
    this.strict = strict;
  }

  add(methods, ...args) {
    let path = typeof args[0] === 'string' ? args.shift() : '';

    assert(args.length, 'You must provide at least one middleware');

    if (this.prefix) {
      path = this.prefix + path;
    }

    tree.insert(this, methods, path, args, {
      caseSensitive: this.caseSensitive,
      strict: this.strict,
    });
    return this;
  }

  use(...args) {
    debug('use()', args);
    return this.add([], ...args);
  }

  all(...args) {
    debug('all()', args);
    return this.add(tree.METHODS, ...args);
  }

  del(...args) {
    return this.delete(...args);
  }
}

// add http verbs
['get', 'put', 'post', 'patch', 'delete'].map((verb) => {
  RouteFragment.prototype[verb] = function (...args) {
    debug('%s()', verb, args);
    return this.add([verb.toUpperCase()], ...args);
  };
});

module.exports = RouteFragment;
