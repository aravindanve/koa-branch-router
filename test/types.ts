import * as Koa from 'koa';
import * as Router from '..';

const app = new Koa();
const noop = () => {};
const router = new Router({
  prefix: '',
  caseSensitive: false,
  strict: true,
});

router.use((ctx) => {
  ctx.params.name; // string | undefined
});

router
  .use(noop)
  .use(new Router.Fragment().use(noop))
  .use(
    new Router.Fragment({
      prefix: '/test',
      caseSensitive: false,
      strict: true,
    }).use(noop),
  )
  .use(new Router().use(noop))
  .use(
    new Router()
      .use(noop)
      .use('/path', noop)
      .use(noop, noop)
      .use('/path', noop, noop)
      .get(noop)
      .get('/path', noop)
      .get(noop, noop)
      .get('/path', noop, noop)
      .post(noop)
      .post('/path', noop)
      .post(noop, noop)
      .post('/path', noop, noop)
      .patch(noop)
      .patch('/path', noop)
      .patch(noop, noop)
      .patch('/path', noop, noop)
      .put(noop)
      .put('/path', noop)
      .put(noop, noop)
      .put('/path', noop, noop)
      .delete(noop)
      .delete('/path', noop)
      .delete(noop, noop)
      .delete('/path', noop, noop)
      .del(noop)
      .del('/path', noop)
      .del(noop, noop)
      .del('/path', noop, noop)
      .all(noop)
      .all('/path', noop)
      .all(noop, noop)
      .all('/path', noop, noop),
  );

app.use(router.routes());
app.listen();
