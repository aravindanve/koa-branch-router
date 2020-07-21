'use strict';

const { title, now, print, operations } = require('../utils');
const Router = require('../../lib/router');
const router = new Router();

title('koa-branch-router benchmark (WARNING: includes handling)');

const routes = [
  { method: 'GET', url: '/user' },
  { method: 'GET', url: '/user/comments' },
  { method: 'GET', url: '/user/avatar' },
  { method: 'GET', url: '/user/lookup/username/:username' },
  { method: 'GET', url: '/user/lookup/email/:address' },
  { method: 'GET', url: '/event/:id' },
  { method: 'GET', url: '/event/:id/comments' },
  { method: 'POST', url: '/event/:id/comment' },
  { method: 'GET', url: '/map/:location/events' },
  { method: 'GET', url: '/status' },
  { method: 'GET', url: '/very/deeply/nested/route/hello/there' },
  { method: 'GET', url: '/static/*' },
];

function noop() {}
var i = 0;
var time = 0;

routes.forEach((route) => {
  if (route.method === 'GET') {
    router.get(route.url, noop);
  } else {
    router.post(route.url, noop);
  }
});

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user' }, noop);
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user/comments' }, noop);
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user/lookup/username/john' }, noop);
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/event/abcd1234/comments' }, noop);
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(
    { method: 'GET', path: '/very/deeply/nested/route/hello/there' },
    noop,
  );
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/static/index.html' }, noop);
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle({ method: 'GET', path: '/user' }, noop);
  router.handle({ method: 'GET', path: '/user/comments' }, noop);
  router.handle({ method: 'GET', path: '/user/lookup/username/john' }, noop);
  router.handle({ method: 'GET', path: '/event/abcd1234/comments' }, noop);
  router.handle(
    { method: 'GET', path: '/very/deeply/nested/route/hello/there' },
    noop,
  );
  router.handle({ method: 'GET', path: '/static/index.html' }, noop);
}
print('all together:', time);
