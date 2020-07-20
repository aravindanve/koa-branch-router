const chai = require('chai');
const Type = require('../lib/type');

describe('Type', () => {
  it('defines values for layer types', () => {
    chai.expect(Type.layer).to.be.a('number');
    chai.expect(Type.pathFragment).to.be.a('number');
    chai.expect(Type.captureAllFragment).to.be.a('number');
    chai.expect(Type.captureParamFragment).to.be.a('number');
    chai.expect(Type.router).to.be.a('number');
    chai.expect(Type.routeFragment).to.be.a('number');
  });
});
