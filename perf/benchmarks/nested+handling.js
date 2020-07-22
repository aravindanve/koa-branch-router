'use strict';

const { title, now, print, operations } = require('../utils');
const Router = require('../../lib/router');
const router = new Router();

title('koa-branch-router nested benchmark (WARNING: includes handling)');

router
  .use(
    '/user',
    new Router()
      .get('/', noop)
      .get('/comments', noop)
      .get('/avatar', noop)
      .use(
        new Router({
          prefix: '/lookup',
        })
          .get('/username/:username', noop)
          .get('/email/:address', noop),
      ),
  )
  .use(
    '/event',
    new Router()
      .get('/:id', noop)
      .get('/:id/comments', noop)
      .post('/:id/comment', noop),
  )
  .use(
    new Router()
      .get('/map/:location/events', noop)
      .get('/status', noop)
      .get('/very/deeply/nested/route/hello/there', noop)
      .get('/static/*', noop),
  );

function noop() {}
var i = 0;
var time = 0;

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user' });
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user/comments' });
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user/lookup/username/john' });
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/event/abcd1234/comments' });
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({
    method: 'GET',
    path: '/very/deeply/nested/route/hello/there',
  });
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/static/index.html' });
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user' });
  router.handle({ method: 'GET', path: '/user/comments' });
  router.handle({ method: 'GET', path: '/user/lookup/username/john' });
  router.handle({ method: 'GET', path: '/event/abcd1234/comments' });
  router.handle({
    method: 'GET',
    path: '/very/deeply/nested/route/hello/there',
  });
  router.handle({ method: 'GET', path: '/static/index.html' });
}
print('all together:', time);
