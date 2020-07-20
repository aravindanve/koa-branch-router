const debug = require('debug')('koa-branch-router:route-fragment');
const assert = require('assert');
const Type = require('./type');
const utils = require('./utils');
const Layer = require('./layer');
const PathFragment = require('./path-fragment');
const CaptureAllFragment = require('./capture-all-fragment');
const CaptureParamFragment = require('./capture-param-fragment');
const methods = require('./methods');

class RouteFragment extends PathFragment {
  constructor({ prefix = '', caseSensitive = false, strict = false } = {}) {
    super({ path: '', stack: [] });
    this.type = Type.routeFragment;
    this.prefix = prefix;
    this.caseSensitive = caseSensitive;
    this.strict = strict;

    debug('initialized with options %o', { prefix, caseSensitive, strict });
  }

  add(methods, ...args) {
    let path = typeof args[0] === 'string' ? args.shift() : '';
    let stack = args.map((handle) => new Layer({ methods, handle }));

    assert(stack.length, 'You must provide at least one middleware');

    // apply prefix
    path = this.prefix + path;

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
      const slashIndex = path.indexOf('/', paramStartIndex);
      const paramEndIndex = slashIndex !== -1 ? slashIndex : path.length;
      const suffix = path.slice(paramEndIndex + 1);
      const capture = path.slice(paramStartIndex + 1, paramEndIndex);

      if (suffix) {
        debug('creating path fragment "%s"', suffix);
        stack = [
          new PathFragment({
            path: suffix,
            stack,
            caseSensitive: this.caseSensitive,
          }),
        ];
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
      stack = [
        new PathFragment({ path, stack, caseSensitive: this.caseSensitive }),
      ];
      path = '';
    }

    // pop last layer to merge
    const last = this.stack.pop();

    // push compact stack
    this.stack.push(...utils.compactStack(last ? [last, ...stack] : stack));

    return this;
  }

  use(...args) {
    return this.add([], ...args);
  }

  all(...args) {
    return this.add(methods, ...args);
  }

  del(...args) {
    return this.delete(...args);
  }
}

// add http verbs
['get', 'put', 'post', 'patch', 'delete'].map((verb) => {
  RouteFragment.prototype[verb] = function (...args) {
    return this.add([verb.toUpperCase()], ...args);
  };
});

module.exports = RouteFragment;
