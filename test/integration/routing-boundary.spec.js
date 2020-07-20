const supertest = require('supertest');
const Koa = require('koa');
const Router = require('../..');

describe('Routing Boundary', () => {
  let app;
  beforeEach(() => {
    const callback = (id) => (ctx, next) => {
      ctx.body = ctx.body ? ctx.body + ',' : '';
      ctx.body += id;
      return next();
    };
    const router = new Router()
      .use(new Router.Fragment().use('/use', callback('0.0')))
      .use(
        new Router()
          .use('/user', callback('1.0'))
          .get('/user/:userId', callback('1.1'))
          .get('/user/:userId/items', callback('1.2')),
      )
      .use(
        new Router()
          .use('/user', callback('2.0'))
          .all('/user*', callback('2.1'))
          .get('/user/:userId/items', callback('2.2'))
          .get('/user/:userId/items/:itemId', callback('2.3')),
      );

    app = new Koa().use(router.routes());
    app = app.callback();
  });

  it('must route /user correctly', (done) => {
    supertest(app).get('/user').expect(200, '0.0,2.0,2.1', done);
  });

  it('must route /user/42 correctly', (done) => {
    supertest(app).get('/user/42').expect(200, '0.0,1.0,1.1,2.0,2.1', done);
  });

  it('must route /user/42/items correctly', (done) => {
    supertest(app)
      .get('/user/42/items')
      .expect(200, '0.0,1.0,1.2,2.0,2.1,2.2', done);
  });

  it('must route /user/42/items/16 correctly', (done) => {
    supertest(app)
      .get('/user/42/items/16')
      .expect(200, '0.0,2.0,2.1,2.3', done);
  });

  it('must route /user/42/items/16/a correctly', (done) => {
    supertest(app).get('/user/42/items/16/a').expect(200, '0.0,2.0,2.1', done);
  });

  it('must route /used correctly', (done) => {
    supertest(app).get('/used').expect(404, 'Not Found', done);
  });
});
