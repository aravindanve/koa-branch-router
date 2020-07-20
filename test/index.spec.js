const chai = require('chai');
const Router = require('../lib/router');
const RouteFragment = require('../lib/route-fragment');

describe('index', () => {
  it('exports Router', () => {
    const exp = require('../lib');
    chai.expect(exp).to.be.eq(Router);
  });
  it('exports RouteFragment', () => {
    const exp = require('../lib');
    chai.expect(exp.Fragment).to.be.eq(RouteFragment);
  });
});
