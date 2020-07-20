const chai = require('chai');
const Router = require('../lib/router');

describe('Router', () => {
  it('can be initialized', () => {
    chai
      .expect(new Router({ capture: '', stack: [] }))
      .to.be.an.instanceof(Router);
  });
});
