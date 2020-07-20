const debug = require('debug')('koa-branch-router:capture-param-fragment');
const Type = require('./type');
const utils = require('./utils');

class CaptureParamFragment {
  constructor({ capture, stack }) {
    this.type = Type.captureParamFragment;
    this.capture = capture;
    this.stack = stack;

    debug('initialized with capture ":%s"', capture);
  }

  layers(method, path, params) {
    const slashIndex = path.indexOf('/');
    const captureEnd = slashIndex === -1 ? path.length : slashIndex;
    const childPath = path.slice(captureEnd + 1);
    const childParams = {
      ...params,
      ...(this.capture && {
        [this.capture]: utils.safeDecode(path.slice(0, captureEnd)),
      }),
    };

    return this.stack.flatMap((layer) =>
      layer.layers(method, childPath, childParams),
    );
  }
}

module.exports = CaptureParamFragment;
