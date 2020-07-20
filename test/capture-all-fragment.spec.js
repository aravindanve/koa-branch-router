const chai = require('chai');
const chaiSpies = require('chai-spies');
const CaptureAllFragment = require('../lib/capture-all-fragment');
const Type = require('../lib/type');

chai.use(chaiSpies);

describe('CaptureAllFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new CaptureAllFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(CaptureAllFragment);
  });

  it('exposes the correct type', () => {
    const fragment = new CaptureAllFragment({ capture: '', stack: [] });
    chai.expect(fragment.type).to.eq(Type.captureAllFragment);
  });

  it('.layers() returns a flat array of all layers', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new CaptureAllFragment({
      capture: '',
      stack: [layer, layer],
    });

    chai.expect(fragment.layers('GET', '/blah', {})).to.deep.eq([1, 1]);
    chai.expect(layer.layers).to.have.been.called.exactly(2);
  });

  it('.layers() captures the provided url', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureAllFragment({
      capture: 'name',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', '/foo', {}))
      .to.deep.eq([{ params: { name: '/foo' } }, { params: { name: '/foo' } }]);

    chai
      .expect(fragment.layers('GET', '/foo/', {}))
      .to.deep.eq([
        { params: { name: '/foo/' } },
        { params: { name: '/foo/' } },
      ]);

    chai
      .expect(fragment.layers('GET', '/fiona/bar', {}))
      .to.deep.eq([
        { params: { name: '/fiona/bar' } },
        { params: { name: '/fiona/bar' } },
      ]);
  });

  it('.layers() does not capture if capture key is empty', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureAllFragment({
      capture: '',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', '/foo', {}))
      .to.deep.eq([{ params: {} }, { params: {} }]);

    chai
      .expect(fragment.layers('GET', '/foo/', {}))
      .to.deep.eq([{ params: {} }, { params: {} }]);

    chai
      .expect(fragment.layers('GET', '/fiona/bar', {}))
      .to.deep.eq([{ params: {} }, { params: {} }]);
  });

  it('.layers() does not mutate params', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureAllFragment({
      capture: 'name',
      stack: [layer, layer],
    });
    const params1 = {};
    const params2 = fragment.layers('GET', '/foo', params1).pop().params;

    chai.expect(params1).to.deep.eq({});
    chai.expect(params2).to.deep.eq({ name: '/foo' });
  });
});
