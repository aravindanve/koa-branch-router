const chai = require('chai');
const PathFragment = require('../lib/path-fragment');

describe('PathFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new PathFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(PathFragment);
  });
});
