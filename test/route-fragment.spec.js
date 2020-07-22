const chai = require('chai');
const chaiSpies = require('chai-spies');
const chaiSamSam = require('chai-samsam');
const RouteFragment = require('../lib/route-fragment');
const tree = require('../lib/tree');

chai.use(chaiSamSam);

chai.use(chaiSpies);
chai.use(chaiSamSam);

const noop = () => {};

describe('RouteFragment', () => {
  it('can be initialized', () => {
    chai.expect(new RouteFragment()).to.be.an.instanceof(RouteFragment);
  });

  it('exposes correct node type', () => {
    const fragment = new RouteFragment();
    chai.expect(fragment.type).to.eq(tree.TYPE.FRAGMENT_NODE);
    chai.expect(fragment.isBoundary).to.eq(false);
  });

  it('exposes .verb()s, .all() and .use()', () => {
    const fragment = new RouteFragment();

    chai.expect(fragment.get).to.be.a('function');
    chai.expect(fragment.put).to.be.a('function');
    chai.expect(fragment.post).to.be.a('function');
    chai.expect(fragment.patch).to.be.a('function');
    chai.expect(fragment.delete).to.be.a('function');
    chai.expect(fragment.del).to.be.a('function');
    chai.expect(fragment.all).to.be.a('function');
    chai.expect(fragment.use).to.be.a('function');
  });

  it('supports .get()', () => {
    const fragment = new RouteFragment();

    fragment.get('/hey', noop);
    fragment.get(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['GET'] }] },
        { methods: ['GET'] },
      ]);
  });

  it('supports .post()', () => {
    const fragment = new RouteFragment();

    fragment.post('/hey', noop);
    fragment.post(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['POST'] }] },
        { methods: ['POST'] },
      ]);
  });

  it('supports .patch()', () => {
    const fragment = new RouteFragment();

    fragment.patch('/hey', noop);
    fragment.patch(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['PATCH'] }] },
        { methods: ['PATCH'] },
      ]);
  });

  it('supports .put()', () => {
    const fragment = new RouteFragment();

    fragment.put('/hey', noop);
    fragment.put(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['PUT'] }] },
        { methods: ['PUT'] },
      ]);
  });

  it('supports .delete()', () => {
    const fragment = new RouteFragment();

    fragment.delete('/hey', noop);
    fragment.delete(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['DELETE'] }] },
        { methods: ['DELETE'] },
      ]);
  });

  it('supports .del()', () => {
    const fragment = new RouteFragment();

    fragment.del('/hey', noop);
    fragment.del(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: ['DELETE'] }] },
        { methods: ['DELETE'] },
      ]);
  });

  it('supports .all()', () => {
    const fragment = new RouteFragment();

    fragment.all('/hey', noop);
    fragment.all(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ methods: tree.METHODS }] },
        { methods: tree.METHODS },
      ]);
  });

  it('supports .use()', () => {
    const fragment = new RouteFragment();

    fragment.use('/hey', noop);
    fragment.use(noop);

    chai
      .expect(fragment.chain)
      .to.deep.match([
        { path: '/hey', chain: [{ isMiddleware: true }] },
        { isMiddleware: true },
      ]);
  });

  it('supports nested fragments', () => {
    const fragment = new RouteFragment();

    fragment.use('/hey', new RouteFragment().use(noop).get('/there', noop));

    chai.expect(fragment.chain).to.deep.match([
      {
        path: '/hey',
        chain: [
          {
            chain: [
              { isMiddleware: true },
              { path: '/there', chain: [{ methods: ['GET'] }] },
            ],
          },
        ],
      },
    ]);
  });

  it('prefixes all the paths', () => {
    const fragment = new RouteFragment({ prefix: '/pre' });

    fragment.del('/hey', noop);
    fragment.del(noop);

    chai.expect(fragment.chain).to.deep.match([
      {
        path: '/pre',
        chain: [
          { path: '/hey', chain: [{ methods: ['DELETE'] }] },
          { methods: ['DELETE'] },
        ],
      },
    ]);
  });
});
