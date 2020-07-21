const supertest = require('supertest');
const Koa = require('koa');
const Router = require('../..');

describe('Routing modules', () => {
  let app;
  beforeEach(() => {
    const callback = (id) => (ctx, next) => {
      ctx.body = ctx.body ? ctx.body + ',' : '';
      ctx.body += id;
      return next();
    };

    const playlistRouter = new Router()
      .use(
        new Router()
          .use(callback('playlistReadScope'))
          .get('/', callback('listPlaylists'))
          .get('/:playlistId', callback('getPlaylist')),
      )
      .use(
        new Router()
          .use(callback('playlistEditScope'))
          .post('/', callback('createPlaylist'))
          .put('/:playlistId', callback('updatePlaylist'))
          .del('/:playlistId', callback('deletePlaylist')),
      );

    const playlistSongRouter = new Router()
      .use(
        new Router()
          .use(callback('songReadScope'))
          .get('/', callback('listSongs'))
          .get('/:songId', callback('getSong')),
      )
      .use(
        new Router()
          .use(callback('songEditScope'))
          .post('/', callback('createSong'))
          .put('/:songId', callback('updateSong'))
          .del('/:songId', callback('deleteSong')),
      );

    const router = new Router()
      .use(callback('auth'))
      .use('/playlists', playlistRouter)
      .use('/playlists/:playlistId/songs', playlistSongRouter);

    app = new Koa().use(router.routes());
    app = app.callback();
  });

  it('must GET /playlists', (done) => {
    supertest(app)
      .get('/playlists')
      .expect(200, 'auth,playlistReadScope,listPlaylists', done);
  });

  it('must GET /playlists/42', (done) => {
    supertest(app)
      .get('/playlists/42')
      .expect(200, 'auth,playlistReadScope,getPlaylist', done);
  });

  it('must POST /playlists', (done) => {
    supertest(app)
      .post('/playlists')
      .expect(200, 'auth,playlistEditScope,createPlaylist', done);
  });

  it('must PUT /playlists/42', (done) => {
    supertest(app)
      .put('/playlists/42')
      .expect(200, 'auth,playlistEditScope,updatePlaylist', done);
  });

  it('must DELETE /playlists/42', (done) => {
    supertest(app)
      .delete('/playlists/42')
      .expect(200, 'auth,playlistEditScope,deletePlaylist', done);
  });

  it('must GET /playlists/42/songs', (done) => {
    supertest(app)
      .get('/playlists/42/songs')
      .expect(200, 'auth,songReadScope,listSongs', done);
  });

  it('must GET /playlists/42/songs/16', (done) => {
    supertest(app)
      .get('/playlists/42/songs/16')
      .expect(200, 'auth,songReadScope,getSong', done);
  });

  it('must POST /playlists/42/songs', (done) => {
    supertest(app)
      .post('/playlists/42/songs')
      .expect(200, 'auth,songEditScope,createSong', done);
  });

  it('must PUT /playlists/42/songs/16', (done) => {
    supertest(app)
      .put('/playlists/42/songs/16')
      .expect(200, 'auth,songEditScope,updateSong', done);
  });

  it('must DELETE /playlists/42/songs/16', (done) => {
    supertest(app)
      .delete('/playlists/42/songs/16')
      .expect(200, 'auth,songEditScope,deleteSong', done);
  });

  it('must fail with 404 for GET /songs', (done) => {
    supertest(app).get('/songs').expect(404, 'Not Found', done);
  });
});
