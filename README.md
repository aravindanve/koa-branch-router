# Koa branch router

[![Coverage Status](https://coveralls.io/repos/aravindanve/koa-branch-router/badge.svg?branch=master)](https://coveralls.io/r/aravindanve/koa-branch-router?branch=master)

Koa branch router is a simple radix tree (-ish) router for koa.

## Why?

- There seem to be no radix tree routers with nested router support (at the time of writing).
- Popular routers handle middlewares in an inconvenient way. See [Middleware Routing](#middleware-routing).

## Features

- Express-style routing using verbs like `router.get`, `router.put`, `router.post`, etc.
- Nested routes and middlewares.
- Path params and wildcard capturing.

## Usage

```js
const Koa = require('koa');
const Router = require('koa-branch-router');

const app = new Koa();
const router = new Router();

router.get('/', (ctx) => {
  ctx.body = 'Hello World!';
});

app.use(router.routes());
app.listen(9000);
```

## Middleware Routing

Middlewares are only called if a handler registered after the middleware __in the same router__ matches agaist the path.

#### Note

Middlewares and Handlers are essentially the same except:

```js
// treated as a middleware if added using .use()
router.use('/', middleware)

// treated as a handler if added using .all() or .get(), .post() etc
router.all('/', handler)
```

#### Routing Example

```js
// the path `/users/42/images`

router
  .use('/users', new Router()
    .use(userMiddleware) // <-- not called
    .get('/', listUsers)
    .get('/:userId', getUser)

  .use('/users/:userId/images', new Router()
    .use(imageMiddleware) // <-- called
    .get('/', listImages) // <-- called
    .get('/:imageId', getImage);
```

If you dont want this behaviour, you should use a route fragment.


```js
// the path `/users/42/images`

router
  .use('/users')
    .use(new Router.Fragment()
      use(userMiddleware)) // <-- called

      // fragments don't add a routing boundary and
      // behave like a middleware registered on the
      // parent router.

  .use('/users', new Router()
    .use(userMiddleware) // <-- not called
    .get('/', listUsers)
    .get('/:userId', getUser)

  .use('/users/:userId/images', new Router()
    .use(imageMiddleware) // <-- called
    .get('/', listImages) // <-- called
    .get('/:imageId', getImage);
```

## Nested Routers

You may nest routers.

```js

const userRouter = new Router()
  .use('/', listUsers) // becomes `/users/`
  .use('/:id', getUser); // becomes `/users/:id`

const tokenRouter = new Router({ prefix: '/token' })
  .use('/', listUsers) // becomes `/auth/tokens/`
  .use('/:id', getUser); // becomes `/auth/tokens/:id`

const fileRouter = new Router()
  .use('/files', listFiles) // remains `/files/`
  .use('/files/:id', getFile)); // remains `/files/:id`

const rootRouter = router
  .use('/users', userRouter)
  .use('/auth', tokenRouter)
  .use(fileRouter);
```

## Path Matching

### Static

```js
router.all('/users', ...)
```

| Path        | Match |
| ----------- | ----- |
| `/users`    | true  |
| `/users/42` | false |

### Named Parameters

Named parameters like `:name` match a single path segment delimited by `/`

```js
router.all('/users/:name', ...)
```

| Path                  | Match | Captured Params       |
| --------------------- | ----- | --------------------- |
| `/users`              | false |                       |
| `/users/gwen`         | true  | `{ name: 'gwen' }`    |
| `/users/profile`      | true  | `{ name: 'profile' }` |
| `/users/gwen/profile` | false |                       |

### Wildcard

Catches paths starting with the provided path, and captures the rest until the end.

```js
router.all('/users/*path', ...)
```

| Path                  | Match | Captured Params             |
| --------------------- | ----- | --------------------------- |
| `/users`              | false |                             |
| `/users/gwen`         | true  | `{ path: 'gwen' }`          |
| `/users/profile`      | true  | `{ path: 'profile' }`       |
| `/users/gwen/profile` | true  | `{ path: 'gwen/profile' }`  |

Wildcards can be used without capturing as well.

```js
router.all('/users/*', ...)
```

## Quirks

- Captured parameters are decoded using `decodeURIComponent`, whereas wildcard captures are not.
- Named parameters assume trailing slash `:userId` => `:userId/`

## Roadmap

- Support for `405 method not allowed`

## API

### new Router([options])

Initialize a new router.

#### Options

| Option                   | Default  | Description                         |
| ------------------------ | -------- | ----------------------------------- |
| `options.prefix`         | `''`     | Router prefix                       |
| `options.caseSensitive`  | `false`  | Case sensitive paths                |
| `options.strict`         | `false`  | Treat `/foo` and `/foo/` as different urls |

### router.verb()

Registers handlers for path. Supported verbs are:

```js
router
  .get(path, ctx => ...)
  .post(path, ctx => ...)
  .patch(path, ctx => ...)
  .put(path, ctx => ...)
  .delete(path, ctx => ...)
  .del(path, ctx => ...) // alias for `.delete()`
  .all(path, ctx => ...); // matches all methods
```

You may pass multiple handlers.

```js
router.get(
  path,
  (ctx, next) => ...,
  (ctx) => ...);
```

### router.use()

Registers middleware for path

```js
router
  .use(parseToken)
  .use(authorize);
```
```js
// or multiple
router.use(parseToken, authorize);
```

```js
// or with path
router.use('/users', authUser);
```

### router.routes()
Returns router middleware.

```js
app.use(router.routes());
```

### new Router.Fragment([options])

Initialize a new route fragment. Fragments don't add a routing boundary and behave like a middleware registered on the parent router. See [Middleware Routing](#middleware-routing).

Accepts the same options as a router. See [Router Options](#options)

The API is again similar to the router except that there is no `.routes()` method. Only routers can be mounted on apps.


### ctx.params
This object contains key-value pairs of named route parameters.

```js
// GET /user/42
router.get('/user/:name', (ctx) => {
  ctx.params.name // => '42'
});
```
