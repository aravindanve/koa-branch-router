const debug = require('debug')('koa-branch-router:path-fragment');
const Type = require('./type');

class PathFragment {
  constructor({ path, stack }) {
    this.type = Type.pathFragment;
    this.path = path;
    this.stack = stack;

    debug('initialized with fragment "%s"', path);
  }

  layers(method, path, params) {
    if (path.beginsWith(this.path)) {
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
