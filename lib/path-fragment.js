const debug = require('debug')('koa-branch-router:path-fragment');
const Type = require('./type');

class PathFragment {
  constructor({ path, stack, caseSensitive = false }) {
    this.type = Type.pathFragment;
    this.path = path;
    this.stack = stack;
    this.caseSensitive = caseSensitive;

    debug('initialized with fragment "%s"', path);
  }

  layers(method, path, params) {
    const match = this.caseSensitive
      ? path.startsWith(this.path)
      : path.toLowerCase().startsWith(this.path.toLowerCase());

    if (match) {
      const childPath = path.slice(0, this.path.length);
      const childParams = { ...params };

      return this.stack.flatMap((layer) =>
        layer.layers(method, childPath, childParams),
      );
    } else {
      return [];
    }
  }
}

module.exports = PathFragment;
