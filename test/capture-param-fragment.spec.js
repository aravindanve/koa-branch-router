const chai = require('chai');
const chaiSpies = require('chai-spies');
const CaptureParamFragment = require('../lib/capture-param-fragment');
const Type = require('../lib/type');

chai.use(chaiSpies);

describe('CaptureParamFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new CaptureParamFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(CaptureParamFragment);
  });

  it('exposes the correct type', () => {
    const fragment = new CaptureParamFragment({ capture: '', stack: [] });
    chai.expect(fragment.type).to.eq(Type.captureParamFragment);
  });

  it('.layers() returns a flat array of all layers', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new CaptureParamFragment({
      capture: '',
      stack: [layer, layer],
    });

    chai.expect(fragment.layers('GET', '/blah', {})).to.deep.eq([1, 1]);
    chai.expect(layer.layers).to.have.been.called.exactly(2);
  });

  it('.layers() captures params in the provided url', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: 'name',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', 'foo', {}))
      .to.deep.eq([{ params: { name: 'foo' } }, { params: { name: 'foo' } }]);

    chai.expect(layer.layers).to.have.been.with('GET', '', { name: 'foo' });
  });

  it('.layers() captures empty param if the url begins with a slash', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: 'name',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', '/foo', {}))
      .to.deep.eq([{ params: { name: '' } }, { params: { name: '' } }]);

    chai.expect(layer.layers).to.have.been.with('GET', 'foo', { name: '' });
  });

  it('.layers() captures params and gobbles exactly one slash', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: 'name',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', 'foo/', {}))
      .to.deep.eq([{ params: { name: 'foo' } }, { params: { name: 'foo' } }]);

    chai.expect(layer.layers).to.have.been.with('GET', '', { name: 'foo' });

    chai
      .expect(fragment.layers('GET', 'foo//', {}))
      .to.deep.eq([{ params: { name: 'foo' } }, { params: { name: 'foo' } }]);

    chai.expect(layer.layers).to.have.been.with('GET', '/', { name: 'foo' });
  });

  it('.layers() captures params and passes down the rest of the path', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: 'name',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', 'fiona/bar/43', {}))
      .to.deep.eq([
        { params: { name: 'fiona' } },
        { params: { name: 'fiona' } },
      ]);

    chai
      .expect(layer.layers)
      .to.have.been.with('GET', 'bar/43', { name: 'fiona' });
  });

  it('.layers() does not capture if capture key is empty', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: '',
      stack: [layer, layer],
    });

    chai
      .expect(fragment.layers('GET', 'foo', {}))
      .to.deep.eq([{ params: {} }, { params: {} }]);
  });

  it('.layers() does not mutate params', () => {
    const layer = { layers: chai.spy((method, path, params) => [{ params }]) };
    const fragment = new CaptureParamFragment({
      capture: 'name',
      stack: [layer, layer],
    });
    const params1 = {};
    const params2 = fragment.layers('GET', 'foo', params1).pop().params;

    chai.expect(params1).to.deep.eq({});
    chai.expect(params2).to.deep.eq({ name: 'foo' });
  });
});
