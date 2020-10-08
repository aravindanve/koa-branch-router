const supertest = require('supertest');
const Koa = require('koa');
const Router = require('../..');

describe('Issue #001: Named params cause issue with nested routers', () => {
  let app;
  beforeEach(() => {
    const router = new Router().use(
      '/test/:id',
      new Router()
        .get('/', async (ctx) => {
          ctx.body = 'slash';
        })
        .get('/nested', async (ctx) => {
          ctx.body = 'slash-nested';
        })
        .get('/:param/nested', async (ctx) => {
          ctx.body = `slash-${ctx.params.param}-nested`;
        }),
    );

    app = new Koa().use(router.routes());
    app = app.callback();
  });

  it('must route /test/1 correctly', (done) => {
    supertest(app).get('/test/1').expect(200, 'slash', done);
  });

  it('must route /test/1/nested correctly', (done) => {
    supertest(app).get('/test/1/nested').expect(200, 'slash-nested', done);
  });

  it('must route /test/1/2/nested correctly', (done) => {
    supertest(app).get('/test/1/2/nested').expect(200, 'slash-2-nested', done);
  });
});
