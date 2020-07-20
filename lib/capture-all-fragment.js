const debug = require('debug')('koa-branch-router:capture-all-fragment');
const Type = require('./type');

class CaptureAllFragment {
  constructor({ capture, stack }) {
    this.type = Type.captureAllFragment;
    this.capture = capture;
    this.stack = stack;

    debug('initialized with capture "*%s"', capture);
  }

  layers(method, path, params) {
    const childPath = '';
    const childParams = {
      ...params,
      ...(this.capture && {
        [this.capture]: path,
      }),
    };

    return this.stack.flatMap((layer) =>
      layer.layers(method, childPath, childParams),
    );
  }
}

module.exports = CaptureAllFragment;
