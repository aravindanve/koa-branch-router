const chai = require('chai');
const http = require('http');
const methods = require('../lib/methods');

describe('methods', () => {
  it('contains all http methods', () => {
    chai.expect(methods).to.deep.equal(http.METHODS);
  });
});
