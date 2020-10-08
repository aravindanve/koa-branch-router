const chai = require('chai');
const chaiSpies = require('chai-spies');
const tree = require('../lib/tree');
const Router = require('../lib/router');

chai.use(chaiSpies);

const noop = () => {};

describe('Router', () => {
  it('can be initialized', () => {
    chai
      .expect(new Router({ capture: '', stack: [] }))
      .to.be.an.instanceof(Router);
  });

  it('exposes correct node type', () => {
    const router = new Router();
    chai.expect(router.type).to.eq(tree.TYPE.FRAGMENT_NODE);
    chai.expect(router.isBoundary).to.eq(true);
  });

  it('exposes .verb()s, .all() and .use()', () => {
    const router = new Router();

    chai.expect(router.get).to.be.a('function');
    chai.expect(router.put).to.be.a('function');
    chai.expect(router.post).to.be.a('function');
    chai.expect(router.patch).to.be.a('function');
    chai.expect(router.delete).to.be.a('function');
    chai.expect(router.del).to.be.a('function');
    chai.expect(router.all).to.be.a('function');
    chai.expect(router.use).to.be.a('function');
  });

  it('exposes .lookup(), .handle() and .routes()', () => {
    const router = new Router();

    chai.expect(router.lookup).to.be.a('function');
    chai.expect(router.handle).to.be.a('function');
    chai.expect(router.routes).to.be.a('function');
  });

  it('.lookup() looks up GET', () => {
    const router = new Router();
    router.get('/hello', noop);

    chai.expect(router.lookup('GET', '/hello')).to.be.a('function');
    chai.expect(router.lookup('GET', '/')).to.be.undefined;
    chai.expect(router.lookup('POST', '/hello')).to.be.undefined;
  });

  it('.lookup() looks up POST', () => {
    const router = new Router();
    router.post('/hello', noop);

    chai.expect(router.lookup('POST', '/hello')).to.be.a('function');
    chai.expect(router.lookup('POST', '/')).to.be.undefined;
    chai.expect(router.lookup('GET', '/hello')).to.be.undefined;
  });

  it('.lookup() looks up PATCH', () => {
    const router = new Router();
    router.patch('/hello', noop);

    chai.expect(router.lookup('PATCH', '/hello')).to.be.a('function');
    chai.expect(router.lookup('PATCH', '/')).to.be.undefined;
    chai.expect(router.lookup('POST', '/hello')).to.be.undefined;
  });

  it('.lookup() looks up PUT', () => {
    const router = new Router();
    router.put('/hello', noop);

    chai.expect(router.lookup('PUT', '/hello')).to.be.a('function');
    chai.expect(router.lookup('PUT', '/')).to.be.undefined;
    chai.expect(router.lookup('POST', '/hello')).to.be.undefined;
  });

  it('.lookup() looks up DELETE', () => {
    const router = new Router();
    router.del('/hello', noop);

    chai.expect(router.lookup('DELETE', '/hello')).to.be.a('function');
    chai.expect(router.lookup('DELETE', '/')).to.be.undefined;
    chai.expect(router.lookup('POST', '/hello')).to.be.undefined;
  });

  it('.lookup() looks up middleware', () => {
    const router = new Router();
    const middleware = chai.spy((ctx, next) => next());
    const handler = chai.spy();

    router.use('/hello', middleware);
    router.get('/hello', handler);
    router.lookup('GET', '/hello')({}, noop);

    chai.expect(middleware).to.have.been.called(1);
    chai.expect(handler).to.have.been.called(1);
  });

  it('.lookup() does not match middleware if no handlers matched', () => {
    const router = new Router();

    router.use('/hello', noop);
    router.get('/hellow', noop);

    chai.expect(router.lookup('GET', '/hello')).to.be.undefined;
  });

  it('.lookup() handles case sensitivity correctly', () => {
    const router = new Router({ caseSensitive: true });

    router.get('/Hello', noop);

    chai.expect(router.lookup('GET', '/hello')).to.be.undefined;
    chai.expect(router.lookup('GET', '/Hello')).to.be.a('function');
  });

  it('.lookup() handles case sensitivity correctly with nesting', () => {
    const router = new Router().use(
      '/Hello',
      new Router({ caseSensitive: true }).use(
        '/World',
        new Router().get('/What', noop),
        new Router({ caseSensitive: false }).get('/Why', noop),
      ),
    );

    chai.expect(router.lookup('GET', '/hello/world/what')).to.be.undefined;
    chai.expect(router.lookup('GET', '/hello/World/what')).to.be.undefined;
    chai.expect(router.lookup('GET', '/hello/World/What')).to.be.a('function');
    chai.expect(router.lookup('GET', '/hello/World/why')).to.be.a('function');
    chai.expect(router.lookup('GET', '/hello/World/Why')).to.be.a('function');
  });

  it('.lookup() handles strict routing correctly', () => {
    const router1 = new Router({ strict: true }).get('/hello', noop);
    const router2 = new Router({ strict: true }).get('/hello/', noop);

    chai.expect(router1.lookup('GET', '/hello')).to.be.a('function');
    chai.expect(router1.lookup('GET', '/hello/')).to.be.undefined;
    chai.expect(router2.lookup('GET', '/hello')).to.be.undefined;
    chai.expect(router2.lookup('GET', '/hello/')).to.be.a('function');
  });

  it('.lookup() handles strict routing with params correctly', () => {
    const router1 = new Router({ strict: true }).get('/hello/:id', noop);
    const router2 = new Router({ strict: true }).get('/hello/:id/', noop);

    chai.expect(router1.lookup('GET', '/hello/1')).to.be.a('function');
    chai.expect(router1.lookup('GET', '/hello/1/')).to.be.undefined;
    chai.expect(router2.lookup('GET', '/hello/1')).to.be.undefined;
    chai.expect(router2.lookup('GET', '/hello/1/')).to.be.a('function');
  });

  it('.lookup() handles strict routing correctly with nesting', () => {
    const router = new Router().use(
      '/hello',
      new Router({ strict: true })
        .use(
          '/world',
          new Router()
            .get('/what', noop)
            .use(new Router({ strict: false }).get('/why', noop)),
        )
        .get('/', noop),
    );

    chai.expect(router.lookup('GET', '/hello')).to.be.undefined;
    chai.expect(router.lookup('GET', '/hello/')).to.be.a('function');
    chai.expect(router.lookup('GET', '/hello/world/what')).to.be.a('function');
    chai.expect(router.lookup('GET', '/hello/world/what/')).to.be.undefined;
    chai.expect(router.lookup('GET', '/hello/world/why')).to.be.a('function');
    chai.expect(router.lookup('GET', '/hello/world/why/')).to.be.a('function');
  });

  it('.lookup() does not match middleware if no handlers matched', () => {
    const router = new Router();

    router.use('/hello', noop);
    router.get('/hellow', noop);

    chai.expect(router.lookup('GET', '/hello')).to.be.undefined;
  });

  it('.handle() calls the matched handlers and middleware', () => {
    const router = new Router();
    const middleware = chai.spy((ctx, next) => next());
    const handler1 = chai.spy();
    const handler2 = chai.spy();

    router.use('/hello', middleware);
    router.get('/hello', handler1);
    router.get('/hellow', handler2);
    router.handle({ method: 'GET', path: '/hello' }, noop);

    chai.expect(middleware).to.have.been.called(1);
    chai.expect(handler1).to.have.been.called(1);
    chai.expect(handler2).to.not.have.been.called();
  });

  it('.handle() calls next when no routes matched', () => {
    const router = new Router();
    const handler = chai.spy();
    const next = chai.spy();

    router.get('/hellow', handler);
    router.handle({ method: 'GET', path: '/hello' }, next);

    chai.expect(next).to.have.been.called(1);
    chai.expect(handler).to.not.have.been.called();
  });

  it('.routes() returns a dispatcher for the router', () => {
    const router = new Router();
    const middleware = chai.spy((ctx, next) => next());
    const right = chai.spy();
    const wrong = chai.spy();

    router.use('/', middleware).get('/hellow', wrong).get('/hello', right);

    router.routes()({ method: 'GET', path: '/hello' }, noop);

    chai.expect(middleware).to.have.been.called(1);
    chai.expect(right).to.have.been.called(1);
    chai.expect(wrong).to.not.have.been.called();
  });
});
