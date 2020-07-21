'use strict';

const { title, now, print, operations } = require('../utils');
const Router = require('../../lib/router');
const router = new Router();

title('koa-branch-router benchmark');

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
  router.lookup('GET', '/user');
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/user/comments');
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/user/lookup/username/john');
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/event/abcd1234/comments');
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/very/deeply/nested/route/hello/there');
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/static/index.html');
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.lookup('GET', '/user');
  router.lookup('GET', '/user/comments');
  router.lookup('GET', '/user/lookup/username/john');
  router.lookup('GET', '/event/abcd1234/comments');
  router.lookup('GET', '/very/deeply/nested/route/hello/there');
  router.lookup('GET', '/static/index.html');
}
print('all together:', time);
