const chai = require('chai');
const tree = require('../lib/tree');
const Router = require('../lib');
const RouteFragment = require('../lib/route-fragment');

const noop = () => {};

describe('tree.insert()', () => {
  it('inserts static paths correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.LAYER,
            methods: ['POST'],
            isMiddleware: false,
            handle: noop,
          },
        ],
      },
    ]);
  });

  it('inserts empty paths correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.LAYER,
        methods: ['POST'],
        isMiddleware: false,
        handle: noop,
      },
    ]);
  });

  it('inserts nested Router and RouteFragments correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, [], '/hello', [new Router(), new RouteFragment()]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [new Router(), new RouteFragment()],
      },
    ]);
  });

  it('asserts middleware is one of function, Router or RouteFragment', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/hello', [1]))
      .to.throw('must be a function, RouteFragment or Router');
  });

  it('asserts Router and RouteFragment are not added with methods', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/hello', [new Router()]))
      .to.throw('cannot be added with methods');
    chai
      .expect(() => tree.insert(root, ['GET'], '/hello', [new RouteFragment()]))
      .to.throw('cannot be added with methods');
  });

  it('inserts paths with wildcard correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello*', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.WILDCARD_NODE,
            capture: '',
            chain: [
              {
                type: tree.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                handle: noop,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('inserts paths with capturing wildcard correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello*name', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.WILDCARD_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                handle: noop,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('asserts there are no paramater captures after `*`', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/hello*:name', [noop]))
      .to.throw('parameter capture after wildcard');
  });

  it('inserts paths with parameters correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello:', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: '',
            chain: [
              {
                type: tree.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                handle: noop,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('inserts paths with capturing parameter correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello:name', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                handle: noop,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('inserts paths with multiple parameters correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['GET'], '/:lastName/:firstName/profile', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'lastName',
            chain: [
              {
                type: tree.PARAMETER_NODE,
                capture: 'firstName',
                chain: [
                  {
                    type: tree.STATIC_NODE,
                    path: 'profile',
                    chain: [
                      {
                        type: tree.LAYER,
                        methods: ['GET'],
                        isMiddleware: false,
                        handle: noop,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('asserts each parameter capture is separated by a `/`', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/:hello:name', [noop]))
      .to.throw('multiple parameter captures');
  });
});

describe('tree.concat()', () => {
  it('merges two wildcard nodes', () => {
    const leftChain = [
      { type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.WILDCARD_NODE, capture: 'rest', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai
      .expect(leftChain)
      .to.deep.eq([
        { type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2, 3, 4] },
      ]);
  });

  it('does not merge two wildcard nodes with different names', () => {
    const leftChain = [
      { type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.WILDCARD_NODE, capture: 'everyhting', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
      { type: tree.WILDCARD_NODE, capture: 'everyhting', chain: [3, 4] },
    ]);
  });

  it('merges two parameter nodes', () => {
    const leftChain = [
      { type: tree.PARAMETER_NODE, capture: 'userId', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.PARAMETER_NODE, capture: 'userId', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai
      .expect(leftChain)
      .to.deep.eq([
        { type: tree.PARAMETER_NODE, capture: 'userId', chain: [1, 2, 3, 4] },
      ]);
  });

  it('merges two parameter nodes recursively', () => {
    const leftChain = [
      {
        type: tree.PARAMETER_NODE,
        capture: 'userId',
        chain: [{ type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2] }],
      },
    ];
    const rightChain = [
      {
        type: tree.PARAMETER_NODE,
        capture: 'userId',
        chain: [{ type: tree.WILDCARD_NODE, capture: 'rest', chain: [3, 4] }],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.PARAMETER_NODE,
        capture: 'userId',
        chain: [
          { type: tree.WILDCARD_NODE, capture: 'rest', chain: [1, 2, 3, 4] },
        ],
      },
    ]);
  });

  it('merges two static nodes with empty paths', () => {
    const leftChain = [{ type: tree.STATIC_NODE, path: '', chain: [1, 2] }];
    const rightChain = [{ type: tree.STATIC_NODE, path: '', chain: [3, 4] }];

    tree.concat(leftChain, rightChain);

    chai
      .expect(leftChain)
      .to.deep.eq([{ type: tree.STATIC_NODE, path: '', chain: [1, 2, 3, 4] }]);
  });

  it('merges two static nodes with the same path', () => {
    const leftChain = [
      { type: tree.STATIC_NODE, path: '/hello', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.STATIC_NODE, path: '/hello', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai
      .expect(leftChain)
      .to.deep.eq([
        { type: tree.STATIC_NODE, path: '/hello', chain: [1, 2, 3, 4] },
      ]);
  });

  it('merges two static nodes where first path includes second path', () => {
    const leftChain = [
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.STATIC_NODE, path: '/hello', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          { type: tree.STATIC_NODE, path: '/world', chain: [1, 2] },
          3,
          4,
        ],
      },
    ]);
  });

  it('merges two static nodes where second path includes first path', () => {
    const leftChain = [
      { type: tree.STATIC_NODE, path: '/hello', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.STATIC_NODE, path: '/helloworld', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [1, 2, { type: tree.STATIC_NODE, path: 'world', chain: [3, 4] }],
      },
    ]);
  });

  it('merges two static nodes with a common prefix', () => {
    const leftChain = [
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.STATIC_NODE, path: '/hellomeow', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          { type: tree.STATIC_NODE, path: '/world', chain: [1, 2] },
          { type: tree.STATIC_NODE, path: 'meow', chain: [3, 4] },
        ],
      },
    ]);
  });

  it('does not merge two static nodes with unrelated paths', () => {
    const leftChain = [
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1, 2] },
    ];
    const rightChain = [{ type: tree.STATIC_NODE, path: 'wut', chain: [3, 4] }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1, 2] },
      { type: tree.STATIC_NODE, path: 'wut', chain: [3, 4] },
    ]);
  });

  it('does not merge two fragment nodes', () => {
    const leftChain = [{ type: tree.FRAGMENT_NODE, prefix: '/hello' }];
    const rightChain = [{ type: tree.FRAGMENT_NODE, prefix: '/hello' }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.FRAGMENT_NODE, prefix: '/hello' },
      { type: tree.FRAGMENT_NODE, prefix: '/hello' },
    ]);
  });

  it('does not merge two boundary nodes', () => {
    const leftChain = [{ type: tree.BOUNDARY_NODE, path: '/' }];
    const rightChain = [{ type: tree.BOUNDARY_NODE, path: '/' }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.BOUNDARY_NODE, path: '/' },
      { type: tree.BOUNDARY_NODE, path: '/' },
    ]);
  });

  it('does not merge two layers', () => {
    const leftChain = [{ type: tree.LAYER, methods: [], handle: 1 }];
    const rightChain = [{ type: tree.LAYER, methods: [], handle: 1 }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.LAYER, methods: [], handle: 1 },
      { type: tree.LAYER, methods: [], handle: 1 },
    ]);
  });

  it('merges multiple static nodes correctly', () => {
    const nodes = [
      { type: tree.STATIC_NODE, path: '/1/2/3/4/5/6', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/2/3', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/2/3/4/5', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/2/3/4/5/6/7/8/9', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/2/3/4/5/11/7/8/9', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/9/3/4/5', chain: [] },
      { type: tree.STATIC_NODE, path: '/1/2/3/4/5', chain: [] },
    ];

    const result = [];

    for (const node of nodes) {
      tree.concat(result, [node]);
    }

    chai.expect(result).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/1/',
        chain: [
          {
            type: tree.STATIC_NODE,
            path: '2/3',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: '/4/5',
                chain: [
                  {
                    type: tree.STATIC_NODE,
                    path: '/',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: '6',
                        chain: [
                          {
                            type: tree.STATIC_NODE,
                            path: '/7/8/9',
                            chain: [],
                          },
                        ],
                      },
                      {
                        type: tree.STATIC_NODE,
                        path: '11/7/8/9',
                        chain: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { type: tree.STATIC_NODE, path: '9/3/4/5', chain: [] },
          { type: tree.STATIC_NODE, path: '2/3/4/5', chain: [] },
        ],
      },
    ]);
  });

  it('merges mixed chains correctly', () => {
    const leftChain = [
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          { type: tree.PARAMETER_NODE, capture: 'name', chain: [1, 2] },
          { type: tree.WILDCARD_NODE, capture: 'name', chain: [3, 4] },
          { type: tree.PARAMETER_NODE, capture: 'name', chain: [5, 6] },
        ],
      },
    ];
    const rightChain = [
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [{ type: tree.PARAMETER_NODE, capture: 'name', chain: [7, 8] }],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          { type: tree.PARAMETER_NODE, capture: 'name', chain: [1, 2] },
          { type: tree.WILDCARD_NODE, capture: 'name', chain: [3, 4] },
          { type: tree.PARAMETER_NODE, capture: 'name', chain: [5, 6, 7, 8] },
        ],
      },
    ]);
  });

  it('deep merges chains correctly', () => {
    const leftChain = [
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: '/world',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: '/hello',
                        chain: [
                          {
                            type: tree.PARAMETER_NODE,
                            capture: 'name',
                            chain: [1, 2],
                          },
                          {
                            type: tree.WILDCARD_NODE,
                            capture: 'name',
                            chain: [3, 4],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const rightChain = [
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: '/world',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: '/hello',
                        chain: [
                          {
                            type: tree.WILDCARD_NODE,
                            capture: 'name',
                            chain: [5, 6],
                          },
                          {
                            type: tree.PARAMETER_NODE,
                            capture: 'name',
                            chain: [7, 8],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: '/world',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: '/hello',
                        chain: [
                          {
                            type: tree.PARAMETER_NODE,
                            capture: 'name',
                            chain: [1, 2],
                          },
                          {
                            type: tree.WILDCARD_NODE,
                            capture: 'name',
                            chain: [3, 4, 5, 6],
                          },
                          {
                            type: tree.PARAMETER_NODE,
                            capture: 'name',
                            chain: [7, 8],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('merges complex nodes correctly', () => {
    const nodes = [
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1] },
      {
        type: tree.PARAMETER_NODE,
        capture: 'name',
        chain: [
          {
            type: tree.STATIC_NODE,
            path: '/wut',
            chain: [
              { type: tree.WILDCARD_NODE, capture: '', chain: [3] },
              { type: tree.BOUNDARY_NODE, path: '/' },
            ],
          },
        ],
      },
      {
        type: tree.PARAMETER_NODE,
        capture: 'name',
        chain: [
          { type: tree.STATIC_NODE, path: '/wutismyname', chain: [4, 5] },
          {
            type: tree.STATIC_NODE,
            path: '/wutall',
            chain: [{ type: tree.WILDCARD_NODE, capture: '', chain: [8] }],
          },
          { type: tree.STATIC_NODE, path: '/well', chain: [6, 7] },
        ],
      },
      { type: tree.PARAMETER_NODE, capture: 'id', chain: [9] },
      { type: tree.STATIC_NODE, path: '/hello', chain: [16, 17] },
      { type: tree.STATIC_NODE, path: '/hellomewo', chain: [18, 19] },
    ];

    const result = [];

    for (const node of nodes) {
      tree.concat(result, [node]);
    }

    chai.expect(result).to.deep.eq([
      { type: tree.STATIC_NODE, path: '/hello/world', chain: [1] },
      {
        type: tree.PARAMETER_NODE,
        capture: 'name',
        chain: [
          {
            type: tree.STATIC_NODE,
            path: '/wut',
            chain: [
              { type: tree.WILDCARD_NODE, capture: '', chain: [3] },
              { type: tree.BOUNDARY_NODE, path: '/' },
              { type: tree.STATIC_NODE, path: 'ismyname', chain: [4, 5] },
            ],
          },
          {
            type: tree.STATIC_NODE,
            path: '/wutall',
            chain: [{ type: tree.WILDCARD_NODE, capture: '', chain: [8] }],
          },
          { type: tree.STATIC_NODE, path: '/well', chain: [6, 7] },
        ],
      },
      { type: tree.PARAMETER_NODE, capture: 'id', chain: [9] },
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          16,
          17,
          { type: tree.STATIC_NODE, path: 'mewo', chain: [18, 19] },
        ],
      },
    ]);
  });
});

describe('tree.lookup()', () => {
  it('finds handlers for methods correctly', () => {
    const getHandle = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: ['GET'],
          handle: getHandle,
        },
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: ['POST'],
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: postHandle,
      },
    ]);
  });

  it('finds handlers for all methods correctly', () => {
    const getHandle = () => null;
    const allHandle = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: ['GET'],
          handle: getHandle,
        },
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: tree.METHODS,
          handle: allHandle,
        },
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: ['POST'],
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: allHandle,
      },
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: postHandle,
      },
    ]);
  });

  it('finds middleware correctly', () => {
    const middleware = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.LAYER,
          isMiddleware: true,
          methods: [],
          handle: middleware,
        },
        {
          type: tree.LAYER,
          isMiddleware: false,
          methods: ['POST'],
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: true,
        params: {},
        handle: middleware,
      },
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: postHandle,
      },
    ]);
  });

  it('finds handlers under static nodes correctly', () => {
    const helloHandle = () => null;
    const byeHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/hello',
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['GET'],
              handle: helloHandle,
            },
          ],
        },
        {
          type: tree.STATIC_NODE,
          path: '/bye',
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['GET'],
              handle: byeHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'GET', '/bye');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: byeHandle,
      },
    ]);
  });

  it('captures params correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/before/',
          chain: [
            {
              type: tree.PARAMETER_NODE,
              capture: 'name',
              chain: [
                {
                  type: tree.STATIC_NODE,
                  path: 'after',
                  chain: [
                    {
                      type: tree.LAYER,
                      isMiddleware: false,
                      methods: ['POST'],
                      handle: noop,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '/before/anyong/after');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {
          name: 'anyong',
        },
        handle: noop,
      },
    ]);
  });

  it('captures multiple params correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/before/',
          chain: [
            {
              type: tree.PARAMETER_NODE,
              capture: 'firstName',
              chain: [
                {
                  type: tree.PARAMETER_NODE,
                  capture: 'lastName',
                  chain: [
                    {
                      type: tree.LAYER,
                      isMiddleware: false,
                      methods: ['POST'],
                      handle: noop,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '/before/anyong/bluth');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {
          firstName: 'anyong',
          lastName: 'bluth',
        },
        handle: noop,
      },
    ]);
  });

  it('ignores non-capturing params correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/before/',
          chain: [
            {
              type: tree.PARAMETER_NODE,
              capture: '',
              chain: [
                {
                  type: tree.PARAMETER_NODE,
                  capture: 'lastName',
                  chain: [
                    {
                      type: tree.LAYER,
                      isMiddleware: false,
                      methods: ['POST'],
                      handle: noop,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '/before/anyong/bluth');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {
          lastName: 'bluth',
        },
        handle: noop,
      },
    ]);
  });

  it('captures wildcards correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/hello/',
          chain: [
            {
              type: tree.WILDCARD_NODE,
              capture: 'rest',
              chain: [
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['POST'],
                  handle: noop,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '/hello/anyong/bluth');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {
          rest: 'anyong/bluth',
        },
        handle: noop,
      },
    ]);
  });

  it('ignores non-capturing wildcards correctly', () => {
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.STATIC_NODE,
          path: '/hello/',
          chain: [
            {
              type: tree.WILDCARD_NODE,
              capture: '',
              chain: [
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['POST'],
                  handle: noop,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '/hello/anyong/bluth');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: noop,
      },
    ]);
  });

  it('finds handlers inside nested fragments correctly', () => {
    const getHandle = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.FRAGMENT_NODE,
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['GET'],
              handle: getHandle,
            },
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['POST'],
              handle: postHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: postHandle,
      },
    ]);
  });

  it('finds handlers inside nested boundaries correctly', () => {
    const getHandle = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.BOUNDARY_NODE,
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['GET'],
              handle: getHandle,
            },
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['POST'],
              handle: postHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: postHandle,
      },
    ]);
  });

  it('throws if it encounters an invalid node', () => {
    const getHandle = () => null;
    const postHandle = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.BOUNDARY_NODE,
          chain: [
            {
              type: undefined,
              isMiddleware: false,
              methods: ['GET'],
              handle: getHandle,
            },
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['POST'],
              handle: postHandle,
            },
          ],
        },
      ],
    };

    chai.expect(() => tree.lookup(root, 'POST', '')).to.throw('Invalid node');
  });

  it('only returns middleware when a handler is found within the boundary', () => {
    const wrong = () => null;
    const right = () => null;
    const root = {
      type: tree.FRAGMENT_NODE,
      chain: [
        {
          type: tree.BOUNDARY_NODE,
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['GET'],
              handle: right,
            },
            {
              type: tree.LAYER,
              isMiddleware: true,
              methods: [],
              handle: right,
            },
            {
              type: tree.BOUNDARY_NODE,
              chain: [
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['PUT'],
                  handle: wrong,
                },
                {
                  type: tree.LAYER,
                  isMiddleware: true,
                  methods: [],
                  handle: wrong,
                },
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['DELETE'],
                  handle: wrong,
                },
              ],
            },
          ],
        },
        {
          type: tree.BOUNDARY_NODE,
          chain: [
            {
              type: tree.LAYER,
              isMiddleware: false,
              methods: ['PUT'],
              handle: wrong,
            },
            {
              type: tree.LAYER,
              isMiddleware: true,
              methods: [],
              handle: right,
            },
            {
              type: tree.BOUNDARY_NODE,
              chain: [
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['GET'],
                  handle: right,
                },
                {
                  type: tree.LAYER,
                  isMiddleware: true,
                  methods: [],
                  handle: right,
                },
                {
                  type: tree.LAYER,
                  isMiddleware: false,
                  methods: ['DELETE'],
                  handle: wrong,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'GET', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: right,
      },
      {
        type: tree.LAYER,
        isMiddleware: true,
        params: {},
        handle: right,
      },
      {
        type: tree.LAYER,
        isMiddleware: true,
        params: {},
        handle: right,
      },
      {
        type: tree.LAYER,
        isMiddleware: false,
        params: {},
        handle: right,
      },
      {
        type: tree.LAYER,
        isMiddleware: true,
        params: {},
        handle: right,
      },
    ]);
  });
});
