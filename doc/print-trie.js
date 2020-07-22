const util = require('util');
const Router = require('..');

const noop = () => {};
const router = new Router()
  .use(new Router.Fragment().use('/play', noop))
  .use(
    new Router()
      .use('/playlist', noop)
      .get('/playlist/:playlistId', noop)
      .get('/playlist/:playlistId/songs', noop)
      .use(noop),
  )
  .use(
    new Router({
      caseSensitive: true,
      strict: true,
    })
      .use('/playlist', noop)
      .all('/playlist*', noop)
      .get('/playlist/:playlistId/songs', noop)
      .get('/playlist/:playlistId/songs/:songId', noop)
      .use(noop),
  );

console.log(util.inspect(router, { depth: Infinity }));
