# Trie

### 1.0.2

```js
Router {
  type: 5,
  chain: [
    RouteFragment {
      type: 5,
      chain: [
        {
          type: 2,
          path: '/play',
          lowerCasePath: '/play',
          chain: [
            {
              type: 1,
              methods: [],
              isMiddleware: true,
              endsWithSlash: false,
              handle: [Function: noop]
            }
          ]
        }
      ],
      prefix: undefined,
      isBoundary: false,
      caseSensitive: undefined,
      strict: undefined
    },
    Router {
      type: 5,
      chain: [
        {
          type: 2,
          path: '/playlist',
          lowerCasePath: '/playlist',
          chain: [
            {
              type: 1,
              methods: [],
              isMiddleware: true,
              endsWithSlash: false,
              handle: [Function: noop]
            },
            {
              type: 2,
              path: '/',
              lowerCasePath: '/',
              chain: [
                {
                  type: 3,
                  capture: 'playlistId',
                  chain: [
                    {
                      type: 1,
                      methods: [ 'GET' ],
                      isMiddleware: false,
                      endsWithSlash: false,
                      handle: [Function: noop]
                    },
                    {
                      type: 2,
                      path: 'songs',
                      lowerCasePath: 'songs',
                      chain: [
                        {
                          type: 1,
                          methods: [ 'GET' ],
                          isMiddleware: false,
                          endsWithSlash: false,
                          handle: [Function: noop]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 1,
          methods: [],
          isMiddleware: true,
          endsWithSlash: false,
          handle: [Function: noop]
        }
      ],
      prefix: undefined,
      isBoundary: true,
      caseSensitive: undefined,
      strict: undefined
    },
    Router {
      type: 5,
      chain: [
        {
          type: 2,
          path: '/playlist',
          lowerCasePath: '/playlist',
          chain: [
            {
              type: 1,
              methods: [],
              isMiddleware: true,
              endsWithSlash: false,
              handle: [Function: noop]
            },
            {
              type: 4,
              capture: '',
              chain: [
                {
                  type: 1,
                  methods: [
                    'ACL',         'BIND',       'CHECKOUT',
                    'CONNECT',     'COPY',       'DELETE',
                    'GET',         'HEAD',       'LINK',
                    'LOCK',        'M-SEARCH',   'MERGE',
                    'MKACTIVITY',  'MKCALENDAR', 'MKCOL',
                    'MOVE',        'NOTIFY',     'OPTIONS',
                    'PATCH',       'POST',       'PROPFIND',
                    'PROPPATCH',   'PURGE',      'PUT',
                    'REBIND',      'REPORT',     'SEARCH',
                    'SOURCE',      'SUBSCRIBE',  'TRACE',
                    'UNBIND',      'UNLINK',     'UNLOCK',
                    'UNSUBSCRIBE'
                  ],
                  isMiddleware: false,
                  endsWithSlash: false,
                  handle: [Function: noop]
                }
              ]
            },
            {
              type: 2,
              path: '/',
              lowerCasePath: '/',
              chain: [
                {
                  type: 3,
                  capture: 'playlistId',
                  chain: [
                    {
                      type: 2,
                      path: 'songs',
                      lowerCasePath: 'songs',
                      chain: [
                        {
                          type: 1,
                          methods: [ 'GET' ],
                          isMiddleware: false,
                          endsWithSlash: false,
                          handle: [Function: noop]
                        },
                        {
                          type: 2,
                          path: '/',
                          lowerCasePath: '/',
                          chain: [
                            {
                              type: 3,
                              capture: 'songId',
                              chain: [
                                {
                                  type: 1,
                                  methods: [ 'GET' ],
                                  isMiddleware: false,
                                  endsWithSlash: false,
                                  handle: [Function: noop]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 1,
          methods: [],
          isMiddleware: true,
          endsWithSlash: false,
          handle: [Function: noop]
        }
      ],
      prefix: undefined,
      isBoundary: true,
      caseSensitive: true,
      strict: true
    }
  ],
  prefix: undefined,
  isBoundary: true,
  caseSensitive: undefined,
  strict: undefined
}
```
