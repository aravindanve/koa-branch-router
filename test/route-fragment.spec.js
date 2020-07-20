const chai = require('chai');
const RouteFragment = require('../lib/route-fragment');

describe('RouteFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new RouteFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(RouteFragment);
  });
});
