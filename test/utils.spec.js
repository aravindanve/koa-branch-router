const chai = require('chai');
const chaiSpies = require('chai-spies');
const utils = require('../lib/utils');

chai.use(chaiSpies);

const noop = () => {};

describe('safeDecode', () => {
  it('decodes url encoded strings', () => {
    chai.expect(utils.safeDecode('%20')).to.eq(' ');
  });
  it('does not throw when encoded string is malformed', () => {
    chai.expect(utils.safeDecode('%')).to.eq('%');
  });
});

describe('findPrefixEnd', () => {
  it('finds the prefix end index for two strings', () => {
    chai.expect(utils.findPrefixEnd('hello', 'helloworld')).to.eq(5);
    chai.expect(utils.findPrefixEnd('hellow', 'helloworld')).to.eq(6);
    chai.expect(utils.findPrefixEnd('hell', 'helloworld')).to.eq(4);
    chai.expect(utils.findPrefixEnd('helloworld', 'wut')).to.eq(0);
  });
});

describe('bindParams', () => {
  it('sets params in ctx before passing it to the handle', () => {
    const handle = chai.spy();
    const boundHandle = utils.bindParams({ name: 'anyong' }, handle);

    boundHandle({}, noop);

    chai.expect(handle).to.have.been.called.with({
      params: {
        name: 'anyong',
      },
    });
  });
});
