const chai = require('chai');
const chaiSpies = require('chai-spies');
const Layer = require('../lib/layer');
const Type = require('../lib/type');
const methods = require('../lib/methods');

chai.use(chaiSpies);

describe('Layer', () => {
  it('can be initialized', () => {
    chai
      .expect(new Layer({ methods: [], handle: () => null }))
      .to.be.an.instanceof(Layer);
  });

  it('exposes the correct type', () => {
    const layer = new Layer({ methods: [], handle: () => null });
    chai.expect(layer.type).to.eq(Type.layer);
  });

  it('.layers() returns an array containing layer handle for empty methods', () => {
    const methods = [];
    const handle = () => null;
    const layer = new Layer({
      methods,
      handle,
    });

    chai
      .expect(layer.layers('GET', '', {}))
      .to.deep.eq([{ params: {}, methods: [], handle }]);

    chai
      .expect(layer.layers('GET', '/hello', {}))
      .to.deep.eq([{ params: {}, methods: [], handle }]);
  });

  it('.layers() returns an array containing layer handle for all methods', () => {
    const handle = () => null;
    const layer = new Layer({
      methods,
      handle,
    });

    const layers = layer.layers('GET', '', {});

    chai.expect(layers).to.deep.eq([{ params: {}, methods, handle }]);

    chai.expect(layers[0].methods).to.eq(methods);
    chai.expect(layers[0].handle).to.eq(handle);
  });

  it('.layers() returns an array containing layer handle for matched methods', () => {
    const methods = ['GET', 'POST'];
    const handle = () => null;
    const layer = new Layer({
      methods,
      handle,
    });

    const layers = layer.layers('POST', '', {});

    chai.expect(layers).to.deep.eq([{ params: {}, methods, handle }]);

    chai.expect(layers[0].methods).to.eq(methods);
    chai.expect(layers[0].handle).to.eq(handle);
  });

  it('.layers() returns an empty array if it does not include method', () => {
    const methods = ['GET', 'POST'];
    const handle = () => null;
    const layer = new Layer({
      methods,
      handle,
    });

    const layers = layer.layers('PUT', '', {});

    chai.expect(layers).to.deep.eq([]);
  });

  it('.layers() returns an empty array if path not empty', () => {
    const methods = ['GET'];
    const handle = () => null;
    const layer = new Layer({
      methods,
      handle,
    });

    const layers = layer.layers('GET', '/blah', {});

    chai.expect(layers).to.deep.eq([]);
  });
});
