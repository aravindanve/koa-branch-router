const chai = require('chai');
const chaiSpies = require('chai-spies');
const Router = require('../lib/router');

chai.use(chaiSpies);

describe('Router', () => {
  it('can be initialized', () => {
    chai
      .expect(new Router({ capture: '', stack: [] }))
      .to.be.an.instanceof(Router);
  });

  it('.layers() returns only matched handles', () => {
    const router = new Router()
      .use('/foobar', () => 1)
      .use('/foo', () => 2)
      .use('/foobaz', () => 3)
      .get('/foobar', () => 4)
      .post('/foobar', () => 5);

    const layers = router.layers('POST', '/foobar', {});

    chai.expect(layers.map(({ handle, ...rest }) => rest)).to.deep.eq([
      { params: {}, methods: [] },
      { params: {}, methods: [] },
      { params: {}, methods: ['POST'] },
    ]);

    chai.expect(layers.map((layer) => layer.handle())).to.deep.eq([1, 2, 5]);
  });

  it('.layers() returns only layers until the last matched handler', () => {
    const router = new Router()
      .use('/foobar', () => 1)
      .use('/foo', () => 2)
      .use('/foobaz', () => 3)
      .get('/foobar', () => 4)
      .post('/foobar', () => 5)
      .use('/foo', () => 6); // <-- should not be returned

    const layers = router.layers('POST', '/foobar', {});

    chai.expect(layers.map(({ handle, ...rest }) => rest)).to.deep.eq([
      { params: {}, methods: [] },
      { params: {}, methods: [] },
      { params: {}, methods: ['POST'] },
    ]);

    chai.expect(layers.map((layer) => layer.handle())).to.deep.eq([1, 2, 5]);
  });

  it('.layers() returns empty array if no handlers matched', () => {
    const router = new Router()
      .use('/foobar', () => 1)
      .use('/foo', () => 2)
      .use('/foobaz', () => 3)
      .get('/foobar', () => 4)
      .post('/foobar1', () => 5)
      .use('/foo', () => 6);

    const layers = router.layers('POST', '/foobar', {});

    chai.expect(layers).to.deep.eq([]);
  });

  it('.routes() returns a dispatcher', () => {
    const wrong = chai.spy((ctx, next) => next());
    const right = chai.spy((ctx, next) => next());
    const next = chai.spy();
    const dispatch = new Router()
      .use('/foobar', right)
      .use('/foo', right)
      .use('/foobaz', wrong)
      .get('/foobar', wrong)
      .post('/foobar', right)
      .use('/foo', wrong)
      .routes();

    dispatch({ method: 'POST', path: '/foobar' }, next);
    dispatch({ method: 'POST', path: '/foobar1' }, next);

    chai.expect(right).to.have.been.called(3);
    chai.expect(wrong).to.not.have.been.called();
    chai.expect(next).to.have.been.called(2);
  });
});
