const chai = require('chai');
const chaiSpies = require('chai-spies');
const PathFragment = require('../lib/path-fragment');

chai.use(chaiSpies);

describe('PathFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new PathFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(PathFragment);
  });

  it('.layers() returns an empty array if paths dont match', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new PathFragment({
      path: '/hello',
      stack: [layer, layer],
    });

    chai.expect(fragment.layers('GET', '/blah', {})).to.deep.eq([]);
    chai.expect(fragment.layers('GET', '/hell', {})).to.deep.eq([]);
    chai.expect(layer.layers).to.have.been.called.exactly(0);
  });

  it('.layers() returns a flat array of all layers if prefix matches', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new PathFragment({
      path: '/hello',
      stack: [layer, layer],
    });

    chai.expect(fragment.layers('GET', '/hellow', {})).to.deep.eq([1, 1]);
    chai.expect(layer.layers).to.have.been.called.exactly(2);
  });

  it('.layers() passes down the rest of the path', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new PathFragment({
      path: 'fiona/bar',
      stack: [layer, layer],
    });

    chai.expect(fragment.layers('GET', 'fiona/bar/43', {})).to.deep.eq([1, 1]);
    chai.expect(layer.layers).to.have.been.called.with('GET', '/43', {});
  });

  it('works correctly when case sensitivity is on', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new PathFragment({
      path: 'fiona/bar',
      stack: [layer, layer],
      caseSensitive: true,
    });

    chai.expect(fragment.layers('GET', 'fiona/Bar/43', {})).to.deep.eq([]);
    chai.expect(fragment.layers('GET', 'fiona/bar/43', {})).to.deep.eq([1, 1]);
  });

  it('works correctly when case sensitivity is off', () => {
    const layer = { layers: chai.spy(() => [1]) };
    const fragment = new PathFragment({
      path: 'fiona/bar',
      stack: [layer, layer],
      caseSensitive: false,
    });

    chai.expect(fragment.layers('GET', 'fiona/Bar/43', {})).to.deep.eq([1, 1]);
    chai.expect(fragment.layers('GET', 'fiona/bar/43', {})).to.deep.eq([1, 1]);
  });
});
