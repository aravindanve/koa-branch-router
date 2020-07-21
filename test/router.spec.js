const chai = require('chai');
const chaiSpies = require('chai-spies');
const Router = require('../lib/router');

chai.use(chaiSpies);

const push = (it) => (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(it);
  return next();
};

describe('Router', () => {
  it('can be initialized', () => {
    chai
      .expect(new Router({ capture: '', stack: [] }))
      .to.be.an.instanceof(Router);
  });

  it('.lookup() returns only matched handles', (done) => {
    const router = new Router()
      .use('/foobar', push(1))
      .use('/foo', push(2))
      .use('/foobaz', push(3))
      .get('/foobar', push(4))
      .post('/foobar', push(5));

    const handle = router.lookup('POST', '/foobar');

    chai.expect(handle).to.be.a('function');

    handle({}, ({ body }) => {
      chai.expect(body).to.deep.eq([1, 2, 5]);
      done();
    });
  });

  it('.lookup() matches all middleware if a handler matches', (done) => {
    const router = new Router()
      .use('/foobar', push(1))
      .use('/foo', push(2))
      .use('/foobaz', push(3))
      .get('/foobar', push(4))
      .post('/foobar', push(5))
      .use('/foo', push(6)); // <-- should also match

    const handle = router.lookup('POST', '/foobar');

    chai.expect(handle).to.be.a('function');

    handle({}, ({ body }) => {
      chai.expect(body).to.deep.eq([1, 2, 5, 6]);
      done();
    });
  });

  it('.lookup() returns undefined if no handlers matched', () => {
    const router = new Router()
      .use('/foobar', push(1))
      .use('/foo', push(2))
      .use('/foobaz', push(3))
      .get('/foobar', push(4))
      .post('/foobar1', push(5))
      .use('/foo', push(6));

    const handle = router.lookup('POST', '/foobar');

    chai.expect(handle).to.be.undefined;
  });

  it('.routes() returns a middleware', () => {
    const wrong = chai.spy((ctx, next) => next());
    const right = chai.spy((ctx, next) => next());
    const next = chai.spy();
    const dispatch = new Router()
      .use('/foobar', right)
      .use('/foo', right)
      .use('/foobaz', wrong)
      .get('/foobar', wrong)
      .post('/foobar', right)
      .use('/foo', right)
      .routes();

    dispatch({ method: 'POST', path: '/foobar' }, next);
    dispatch({ method: 'POST', path: '/foobar1' }, next);

    chai.expect(right).to.have.been.called(4);
    chai.expect(wrong).to.not.have.been.called();
    chai.expect(next).to.have.been.called(2);
  });

  it('works with nested routers and fragments', () => {
    const wrong = chai.spy((ctx, next) => next());
    const right = chai.spy((ctx, next) => next());
    const next = chai.spy();

    const dispatch = new Router()
      .use(new Router.Fragment().use('/foobar', right))
      .use(new Router().use('/foobar', wrong))
      .use(
        new Router()
          .use('/foobar', right)
          .use('/foo', right)
          .get('/foobar', wrong)
          .post('/foobar', right),
      )
      .use('/foobar', new Router().post(right).use(new Router().post(right)))
      .routes();

    dispatch({ method: 'POST', path: '/foobar' }, next);
    dispatch({ method: 'POST', path: '/foobar1' }, next);

    chai.expect(right).to.have.been.called(6);
    chai.expect(wrong).to.not.have.been.called();
    chai.expect(next).to.have.been.called(2);
  });
});
