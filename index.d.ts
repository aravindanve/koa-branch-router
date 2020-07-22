import * as Koa from 'koa';

declare namespace Router {
  export type RouteHandle = Middleware | RouteFragment | Router;
  export type RouteLookup = Middleware | undefined;
  export type RouteParams = Record<string, string | undefined>;

  export type Context = Koa.ParameterizedContext<
    Koa.DefaultState,
    RouterContext & Koa.DefaultContext
  >;

  export type Middleware = Koa.Middleware<
    Koa.DefaultState,
    RouterContext & Koa.DefaultContext
  >;

  export type RoutingOptions = {
    prefix?: string;
    caseSensitive?: boolean;
    strict?: boolean;
  };

  export type RouterContext = {
    params: RouteParams;
  };

  export interface RegisterHandle {
    (...middleware: RouteHandle[]): Router;
    (path: string, ...middlewares: RouteHandle[]): Router;
  }

  export { RouteFragment as Fragment };
}

declare class RouteFragment {
  readonly type: number;
  readonly chain: unknown[];
  readonly prefix: string;
  readonly caseSensitive: boolean;
  readonly strict: boolean;
  constructor(options?: Router.RoutingOptions);
  add(method: string, ...args: Parameters<Router.RegisterHandle>): this;
  use: Router.RegisterHandle;
  all: Router.RegisterHandle;
  get: Router.RegisterHandle;
  post: Router.RegisterHandle;
  patch: Router.RegisterHandle;
  put: Router.RegisterHandle;
  delete: Router.RegisterHandle;
  del: Router.RegisterHandle;
}

declare class Router extends RouteFragment {
  lookup(
    method: string,
    path: string,
    params?: Router.RouteParams,
  ): Router.RouteLookup;
  handle(ctx: Koa.ParameterizedContext, next: Koa.Next): ReturnType<Koa.Next>;
  routes(): Router.Middleware;
}

export = Router;
