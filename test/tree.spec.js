const chai = require('chai');
const tree = require('../lib/tree');
const Router = require('../lib');
const RouteFragment = require('../lib/route-fragment');

const noop = () => {};

describe('tree.insert()', () => {
  it('inserts static paths correctly', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.LAYER,
            methods: ['POST'],
            isMiddleware: false,
            endsWithSlash: false,
            handle: noop,
          },
        ],
      },
    ]);
  });

  it('inserts empty paths correctly', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.LAYER,
        methods: ['POST'],
        isMiddleware: false,
        endsWithSlash: false,
        handle: noop,
      },
    ]);
  });

  it('inserts nested Router and RouteFragments correctly', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, [], '/hello', [new Router(), new RouteFragment()]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [new Router(), new RouteFragment()],
      },
    ]);
  });

  it('asserts middleware is one of function, Router or RouteFragment', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/hello', [1]))
      .to.throw('must be a function, RouteFragment or Router');
  });

  it('asserts Router and RouteFragment are not added with methods', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello*', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.WILDCARD_NODE,
            capture: '',
            chain: [
              {
                type: tree.TYPE.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello*name', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.WILDCARD_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.TYPE.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    chai
      .expect(() => tree.insert(root, ['GET'], '/hello*:name', [noop]))
      .to.throw('parameter capture after wildcard');
  });

  it('inserts paths with parameters correctly', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello:', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: '',
            chain: [
              {
                type: tree.TYPE.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['POST'], '/hello:name', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.TYPE.LAYER,
                methods: ['POST'],
                isMiddleware: false,
                endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [],
    };

    tree.insert(root, ['GET'], '/:lastName/:firstName/profile', [noop]);

    chai.expect(root.chain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/',
        lowerCasePath: '/',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'lastName',
            chain: [
              {
                type: tree.TYPE.PARAMETER_NODE,
                capture: 'firstName',
                chain: [
                  {
                    type: tree.TYPE.STATIC_NODE,
                    path: 'profile',
                    lowerCasePath: 'profile',
                    chain: [
                      {
                        type: tree.TYPE.LAYER,
                        methods: ['GET'],
                        isMiddleware: false,
                        endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
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
      { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai
      .expect(leftChain)
      .to.deep.eq([
        { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [1, 2, 3, 4] },
      ]);
  });

  it('does not merge two wildcard nodes with different names', () => {
    const leftChain = [
      { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.TYPE.WILDCARD_NODE, capture: 'everyhting', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
      { type: tree.TYPE.WILDCARD_NODE, capture: 'everyhting', chain: [3, 4] },
    ]);
  });

  it('merges two parameter nodes', () => {
    const leftChain = [
      { type: tree.TYPE.PARAMETER_NODE, capture: 'userId', chain: [1, 2] },
    ];
    const rightChain = [
      { type: tree.TYPE.PARAMETER_NODE, capture: 'userId', chain: [3, 4] },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'userId',
        chain: [1, 2, 3, 4],
      },
    ]);
  });

  it('merges two parameter nodes recursively', () => {
    const leftChain = [
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'userId',
        chain: [
          { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [1, 2] },
        ],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'userId',
        chain: [
          { type: tree.TYPE.WILDCARD_NODE, capture: 'rest', chain: [3, 4] },
        ],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'userId',
        chain: [
          {
            type: tree.TYPE.WILDCARD_NODE,
            capture: 'rest',
            chain: [1, 2, 3, 4],
          },
        ],
      },
    ]);
  });

  it('merges two static nodes with empty paths', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '',
        lowerCasePath: '',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '',
        lowerCasePath: '',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '',
        lowerCasePath: '',
        chain: [1, 2, 3, 4],
      },
    ]);
  });

  it('merges two static nodes with the same path', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [1, 2, 3, 4],
      },
    ]);
  });

  it('merges two static nodes where first path includes second path', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/world',
            lowerCasePath: '/world',
            chain: [1, 2],
          },
          3,
          4,
        ],
      },
    ]);
  });

  it('merges two static nodes where second path includes first path', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/helloworld',
        lowerCasePath: '/helloworld',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          1,
          2,
          {
            type: tree.TYPE.STATIC_NODE,
            path: 'world',
            lowerCasePath: 'world',
            chain: [3, 4],
          },
        ],
      },
    ]);
  });

  it('merges two static nodes with a common prefix', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hellomeow',
        lowerCasePath: '/hellomeow',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/world',
            lowerCasePath: '/world',
            chain: [1, 2],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: 'meow',
            lowerCasePath: 'meow',
            chain: [3, 4],
          },
        ],
      },
    ]);
  });

  it('does not merge two static nodes with unrelated paths', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1, 2],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: 'wut',
        lowerCasePath: 'wut',
        chain: [3, 4],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1, 2],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: 'wut',
        lowerCasePath: 'wut',
        chain: [3, 4],
      },
    ]);
  });

  it('does not merge two fragment nodes', () => {
    const leftChain = [{ type: tree.TYPE.FRAGMENT_NODE, prefix: '/hello' }];
    const rightChain = [{ type: tree.TYPE.FRAGMENT_NODE, prefix: '/hello' }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.TYPE.FRAGMENT_NODE, prefix: '/hello' },
      { type: tree.TYPE.FRAGMENT_NODE, prefix: '/hello' },
    ]);
  });

  it('does not merge two boundary nodes', () => {
    const leftChain = [
      { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
    ];
    const rightChain = [
      { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
      { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
    ]);
  });

  it('does not merge two layers', () => {
    const leftChain = [{ type: tree.TYPE.LAYER, methods: [], handle: 1 }];
    const rightChain = [{ type: tree.TYPE.LAYER, methods: [], handle: 1 }];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      { type: tree.TYPE.LAYER, methods: [], handle: 1 },
      { type: tree.TYPE.LAYER, methods: [], handle: 1 },
    ]);
  });

  it('merges multiple static nodes correctly', () => {
    const nodes = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3/4/5/6',
        lowerCasePath: '/1/2/3/4/5/6',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3',
        lowerCasePath: '/1/2/3',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3/4/5',
        lowerCasePath: '/1/2/3/4/5',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3/4/5/6/7/8/9',
        lowerCasePath: '/1/2/3/4/5/6/7/8/9',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3/4/5/11/7/8/9',
        lowerCasePath: '/1/2/3/4/5/11/7/8/9',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/9/3/4/5',
        lowerCasePath: '/1/9/3/4/5',
        chain: [],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/2/3/4/5',
        lowerCasePath: '/1/2/3/4/5',
        chain: [],
      },
    ];

    const result = [];

    for (const node of nodes) {
      tree.concat(result, [node]);
    }

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/1/',
        lowerCasePath: '/1/',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '2/3',
            lowerCasePath: '2/3',
            chain: [
              {
                type: tree.TYPE.STATIC_NODE,
                path: '/4/5',
                lowerCasePath: '/4/5',
                chain: [
                  {
                    type: tree.TYPE.STATIC_NODE,
                    path: '/',
                    lowerCasePath: '/',
                    chain: [
                      {
                        type: tree.TYPE.STATIC_NODE,
                        path: '6',
                        lowerCasePath: '6',
                        chain: [
                          {
                            type: tree.TYPE.STATIC_NODE,
                            path: '/7/8/9',
                            lowerCasePath: '/7/8/9',
                            chain: [],
                          },
                        ],
                      },
                      {
                        type: tree.TYPE.STATIC_NODE,
                        path: '11/7/8/9',
                        lowerCasePath: '11/7/8/9',
                        chain: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '9/3/4/5',
            lowerCasePath: '9/3/4/5',
            chain: [],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '2/3/4/5',
            lowerCasePath: '2/3/4/5',
            chain: [],
          },
        ],
      },
    ]);
  });

  it('merges mixed chains correctly', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          { type: tree.TYPE.PARAMETER_NODE, capture: 'name', chain: [1, 2] },
          { type: tree.TYPE.WILDCARD_NODE, capture: 'name', chain: [3, 4] },
          { type: tree.TYPE.PARAMETER_NODE, capture: 'name', chain: [5, 6] },
        ],
      },
    ];
    const rightChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          { type: tree.TYPE.PARAMETER_NODE, capture: 'name', chain: [7, 8] },
        ],
      },
    ];

    tree.concat(leftChain, rightChain);

    chai.expect(leftChain).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          { type: tree.TYPE.PARAMETER_NODE, capture: 'name', chain: [1, 2] },
          { type: tree.TYPE.WILDCARD_NODE, capture: 'name', chain: [3, 4] },
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'name',
            chain: [5, 6, 7, 8],
          },
        ],
      },
    ]);
  });

  it('deep merges chains correctly', () => {
    const leftChain = [
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.TYPE.STATIC_NODE,
                path: '/world',
                lowerCasePath: '/world',
                chain: [
                  {
                    type: tree.TYPE.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.TYPE.STATIC_NODE,
                        path: '/hello',
                        lowerCasePath: '/hello',
                        chain: [
                          {
                            type: tree.TYPE.PARAMETER_NODE,
                            capture: 'name',
                            chain: [1, 2],
                          },
                          {
                            type: tree.TYPE.WILDCARD_NODE,
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
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.TYPE.STATIC_NODE,
                path: '/world',
                lowerCasePath: '/world',
                chain: [
                  {
                    type: tree.TYPE.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.TYPE.STATIC_NODE,
                        path: '/hello',
                        lowerCasePath: '/hello',
                        chain: [
                          {
                            type: tree.TYPE.WILDCARD_NODE,
                            capture: 'name',
                            chain: [5, 6],
                          },
                          {
                            type: tree.TYPE.PARAMETER_NODE,
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
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          {
            type: tree.TYPE.PARAMETER_NODE,
            capture: 'name',
            chain: [
              {
                type: tree.TYPE.STATIC_NODE,
                path: '/world',
                lowerCasePath: '/world',
                chain: [
                  {
                    type: tree.TYPE.PARAMETER_NODE,
                    capture: 'id',
                    chain: [
                      {
                        type: tree.TYPE.STATIC_NODE,
                        path: '/hello',
                        lowerCasePath: '/hello',
                        chain: [
                          {
                            type: tree.TYPE.PARAMETER_NODE,
                            capture: 'name',
                            chain: [1, 2],
                          },
                          {
                            type: tree.TYPE.WILDCARD_NODE,
                            capture: 'name',
                            chain: [3, 4, 5, 6],
                          },
                          {
                            type: tree.TYPE.PARAMETER_NODE,
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
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1],
      },
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'name',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/wut',
            lowerCasePath: '/wut',
            chain: [
              { type: tree.TYPE.WILDCARD_NODE, capture: '', chain: [3] },
              { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
            ],
          },
        ],
      },
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'name',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/wutismyname',
            lowerCasePath: '/wutismyname',
            chain: [4, 5],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/wutall',
            lowerCasePath: '/wutall',
            chain: [{ type: tree.TYPE.WILDCARD_NODE, capture: '', chain: [8] }],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/well',
            lowerCasePath: '/well',
            chain: [6, 7],
          },
        ],
      },
      { type: tree.TYPE.PARAMETER_NODE, capture: 'id', chain: [9] },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [16, 17],
      },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hellomewo',
        lowerCasePath: '/hellomewo',
        chain: [18, 19],
      },
    ];

    const result = [];

    for (const node of nodes) {
      tree.concat(result, [node]);
    }

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello/world',
        lowerCasePath: '/hello/world',
        chain: [1],
      },
      {
        type: tree.TYPE.PARAMETER_NODE,
        capture: 'name',
        chain: [
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/wut',
            lowerCasePath: '/wut',
            chain: [
              { type: tree.TYPE.WILDCARD_NODE, capture: '', chain: [3] },
              { type: tree.TYPE.FRAGMENT_NODE, isBoundary: true, path: '/' },
              {
                type: tree.TYPE.STATIC_NODE,
                path: 'ismyname',
                lowerCasePath: 'ismyname',
                chain: [4, 5],
              },
            ],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/wutall',
            lowerCasePath: '/wutall',
            chain: [{ type: tree.TYPE.WILDCARD_NODE, capture: '', chain: [8] }],
          },
          {
            type: tree.TYPE.STATIC_NODE,
            path: '/well',
            lowerCasePath: '/well',
            chain: [6, 7],
          },
        ],
      },
      { type: tree.TYPE.PARAMETER_NODE, capture: 'id', chain: [9] },
      {
        type: tree.TYPE.STATIC_NODE,
        path: '/hello',
        lowerCasePath: '/hello',
        chain: [
          16,
          17,
          {
            type: tree.TYPE.STATIC_NODE,
            path: 'mewo',
            lowerCasePath: 'mewo',
            chain: [18, 19],
          },
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.LAYER,
          methods: ['GET'],
          isMiddleware: false,
          endsWithSlash: false,
          handle: getHandle,
        },
        {
          type: tree.TYPE.LAYER,
          methods: ['POST'],
          isMiddleware: false,
          endsWithSlash: false,
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.LAYER,
          methods: ['GET'],
          isMiddleware: false,
          endsWithSlash: false,
          handle: getHandle,
        },
        {
          type: tree.TYPE.LAYER,
          methods: tree.METHODS,
          isMiddleware: false,
          endsWithSlash: false,
          handle: allHandle,
        },
        {
          type: tree.TYPE.LAYER,
          methods: ['POST'],
          isMiddleware: false,
          endsWithSlash: false,
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: false,
        params: {},
        handle: allHandle,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.LAYER,
          methods: [],
          isMiddleware: true,
          endsWithSlash: false,
          handle: middleware,
        },
        {
          type: tree.TYPE.LAYER,
          methods: ['POST'],
          isMiddleware: false,
          endsWithSlash: false,
          handle: postHandle,
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: true,
        params: {},
        handle: middleware,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/hello',
          lowerCasePath: '/hello',
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['GET'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: helloHandle,
            },
          ],
        },
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/bye',
          lowerCasePath: '/bye',
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['GET'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: byeHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'GET', '/bye');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: false,
        params: {},
        handle: byeHandle,
      },
    ]);
  });

  it('captures params correctly', () => {
    const root = {
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/before/',
          lowerCasePath: '/before/',
          chain: [
            {
              type: tree.TYPE.PARAMETER_NODE,
              capture: 'name',
              chain: [
                {
                  type: tree.TYPE.STATIC_NODE,
                  path: 'after',
                  lowerCasePath: 'after',
                  chain: [
                    {
                      type: tree.TYPE.LAYER,
                      methods: ['POST'],
                      isMiddleware: false,
                      endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/before/',
          lowerCasePath: '/before/',
          chain: [
            {
              type: tree.TYPE.PARAMETER_NODE,
              capture: 'firstName',
              chain: [
                {
                  type: tree.TYPE.PARAMETER_NODE,
                  capture: 'lastName',
                  chain: [
                    {
                      type: tree.TYPE.LAYER,
                      methods: ['POST'],
                      isMiddleware: false,
                      endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/before/',
          lowerCasePath: '/before/',
          chain: [
            {
              type: tree.TYPE.PARAMETER_NODE,
              capture: '',
              chain: [
                {
                  type: tree.TYPE.PARAMETER_NODE,
                  capture: 'lastName',
                  chain: [
                    {
                      type: tree.TYPE.LAYER,
                      methods: ['POST'],
                      isMiddleware: false,
                      endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/hello/',
          lowerCasePath: '/hello/',
          chain: [
            {
              type: tree.TYPE.WILDCARD_NODE,
              capture: 'rest',
              chain: [
                {
                  type: tree.TYPE.LAYER,
                  methods: ['POST'],
                  isMiddleware: false,
                  endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.STATIC_NODE,
          path: '/hello/',
          lowerCasePath: '/hello/',
          chain: [
            {
              type: tree.TYPE.WILDCARD_NODE,
              capture: '',
              chain: [
                {
                  type: tree.TYPE.LAYER,
                  methods: ['POST'],
                  isMiddleware: false,
                  endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.FRAGMENT_NODE,
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['GET'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: getHandle,
            },
            {
              type: tree.TYPE.LAYER,
              methods: ['POST'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: postHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.FRAGMENT_NODE,
          isBoundary: true,
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['GET'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: getHandle,
            },
            {
              type: tree.TYPE.LAYER,
              methods: ['POST'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: postHandle,
            },
          ],
        },
      ],
    };

    const result = tree.lookup(root, 'POST', '');

    chai.expect(result).to.deep.eq([
      {
        type: tree.TYPE.LAYER_MATCH,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.FRAGMENT_NODE,
          isBoundary: true,
          chain: [
            {
              type: undefined,
              isMiddleware: false,
              methods: ['GET'],
              handle: getHandle,
            },
            {
              type: tree.TYPE.LAYER,
              methods: ['POST'],
              isMiddleware: false,
              endsWithSlash: false,
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
      type: tree.TYPE.FRAGMENT_NODE,
      chain: [
        {
          type: tree.TYPE.FRAGMENT_NODE,
          isBoundary: true,
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['GET'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: right,
            },
            {
              type: tree.TYPE.LAYER,
              methods: [],
              isMiddleware: true,
              endsWithSlash: false,
              handle: right,
            },
            {
              type: tree.TYPE.FRAGMENT_NODE,
              isBoundary: true,
              chain: [
                {
                  type: tree.TYPE.LAYER,
                  methods: ['PUT'],
                  isMiddleware: false,
                  endsWithSlash: false,
                  handle: wrong,
                },
                {
                  type: tree.TYPE.LAYER,
                  methods: [],
                  isMiddleware: true,
                  endsWithSlash: false,
                  handle: wrong,
                },
                {
                  type: tree.TYPE.LAYER,
                  methods: ['DELETE'],
                  isMiddleware: false,
                  endsWithSlash: false,
                  handle: wrong,
                },
              ],
            },
          ],
        },
        {
          type: tree.TYPE.FRAGMENT_NODE,
          isBoundary: true,
          chain: [
            {
              type: tree.TYPE.LAYER,
              methods: ['PUT'],
              isMiddleware: false,
              endsWithSlash: false,
              handle: wrong,
            },
            {
              type: tree.TYPE.LAYER,
              methods: [],
              isMiddleware: true,
              endsWithSlash: false,
              handle: right,
            },
            {
              type: tree.TYPE.FRAGMENT_NODE,
              isBoundary: true,
              chain: [
                {
                  type: tree.TYPE.LAYER,
                  methods: ['GET'],
                  isMiddleware: false,
                  endsWithSlash: false,
                  handle: right,
                },
                {
                  type: tree.TYPE.LAYER,
                  methods: [],
                  isMiddleware: true,
                  endsWithSlash: false,
                  handle: right,
                },
                {
                  type: tree.TYPE.LAYER,
                  methods: ['DELETE'],
                  isMiddleware: false,
                  endsWithSlash: false,
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
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: false,
        params: {},
        handle: right,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: true,
        params: {},
        handle: right,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: true,
        params: {},
        handle: right,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: false,
        params: {},
        handle: right,
      },
      {
        type: tree.TYPE.LAYER_MATCH,
        isMiddleware: true,
        params: {},
        handle: right,
      },
    ]);
  });
});
