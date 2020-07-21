const chai = require('chai');
const chaiSpies = require('chai-spies');
const RouteFragment = require('../lib/route-fragment');
const tree = require('../lib/tree');

chai.use(chaiSpies);

const noop = () => {};

describe('RouteFragment', () => {
  it('can be initialized', () => {
    chai.expect(new RouteFragment()).to.be.an.instanceof(RouteFragment);
  });

  it('exposes correct node type', () => {
    const fragment = new RouteFragment();
    chai.expect(fragment.type).to.eq(tree.FRAGMENT_NODE);
  });

  it('exposes verbs', () => {
    const fragment = new RouteFragment();

    chai.expect(fragment.get).to.be.a('function');
    chai.expect(fragment.put).to.be.a('function');
    chai.expect(fragment.post).to.be.a('function');
    chai.expect(fragment.patch).to.be.a('function');
    chai.expect(fragment.delete).to.be.a('function');
    chai.expect(fragment.del).to.be.a('function');
  });

  it('.use() adds middleware correctly', () => {
    const fragment = new RouteFragment();

    fragment.use(noop);
    fragment.use('/hello', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.LAYER,
        methods: [],
        isMiddleware: true,
        handle: noop,
      },
      {
        type: tree.STATIC_NODE,
        path: '/hello',
        chain: [
          {
            type: tree.LAYER,
            methods: [],
            isMiddleware: true,
            handle: noop,
          },
        ],
      },
    ]);
  });

  it('.verb() adds handlers correctly', () => {
    const fragment = new RouteFragment();

    fragment.get(noop);
    fragment.post(noop);
    fragment.all(noop);
    fragment.post('/psst', noop);

    chai.expect(fragment.chain).to.deep.eq([
      { type: tree.LAYER, methods: ['GET'], isMiddleware: false, handle: noop },
      {
        type: tree.LAYER,
        methods: ['POST'],
        isMiddleware: false,
        handle: noop,
      },
      {
        type: tree.LAYER,
        methods: tree.METHODS,
        isMiddleware: false,
        handle: noop,
      },
      {
        type: tree.STATIC_NODE,
        path: '/psst',
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

  it('.del() does the same thing as .delete()', () => {
    const fragment = new RouteFragment();

    fragment.delete(noop);
    fragment.del(noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.LAYER,
        methods: ['DELETE'],
        isMiddleware: false,
        handle: noop,
      },
      {
        type: tree.LAYER,
        methods: ['DELETE'],
        isMiddleware: false,
        handle: noop,
      },
    ]);
  });

  it('option.prefix adds the prefix to all handles', () => {
    const fragment = new RouteFragment({ prefix: '/prefix/a' });

    fragment.get(noop);
    fragment.post(noop);
    fragment.all(noop);
    fragment.post('/psst', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/prefix/a',
        chain: [
          {
            type: tree.LAYER,
            methods: ['GET'],
            isMiddleware: false,
            handle: noop,
          },
          {
            type: tree.LAYER,
            methods: ['POST'],
            isMiddleware: false,
            handle: noop,
          },
          {
            type: tree.LAYER,
            methods: tree.METHODS,
            isMiddleware: false,
            handle: noop,
          },
          {
            type: tree.STATIC_NODE,
            path: '/psst',
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

  it('.add() handles wildcards correctly', () => {
    const fragment = new RouteFragment();

    fragment.add(['POST'], '/user*', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/user',
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

  it('.add() handles named wildcards correctly', () => {
    const fragment = new RouteFragment();

    fragment.add(['PUT'], '/user*userSuffix', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/user',
        chain: [
          {
            type: tree.WILDCARD_NODE,
            capture: 'userSuffix',
            chain: [
              {
                type: tree.LAYER,
                methods: ['PUT'],
                isMiddleware: false,
                handle: noop,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('.add() handles named parameters correctly', () => {
    const fragment = new RouteFragment();

    fragment.add(['GET'], '/:userId', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: '/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'userId',
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
    ]);
  });

  it('.add() handles multiple named parameters correctly', () => {
    const fragment = new RouteFragment();

    fragment.add(['PUT'], 'users/:userId/items/:itemId', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: 'users/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'userId',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: 'items/',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'itemId',
                    chain: [
                      {
                        type: tree.LAYER,
                        methods: ['PUT'],
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

  it('.add() handles mixed paths correctly', () => {
    const fragment = new RouteFragment();

    fragment.add(['PUT'], 'users/:userId/items/:itemId/wild*', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: 'users/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'userId',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: 'items/',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'itemId',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: 'wild',
                        chain: [
                          {
                            type: tree.WILDCARD_NODE,
                            capture: '',
                            chain: [
                              {
                                type: tree.LAYER,
                                methods: ['PUT'],
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
            ],
          },
        ],
      },
    ]);
  });

  it('.add() compacts chain when new middleware is added', () => {
    const fragment = new RouteFragment();

    fragment.chain = [
      {
        type: tree.STATIC_NODE,
        path: 'users/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'userId',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: 'items/',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,
                    capture: 'itemId',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: 'wild',
                        chain: [
                          {
                            type: tree.WILDCARD_NODE,
                            capture: '',
                            chain: [
                              {
                                type: tree.LAYER,
                                methods: ['PUT'],
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
            ],
          },
        ],
      },
    ];

    fragment.add(['PUT'], 'users/:userId/items/item', noop);

    chai.expect(fragment.chain).to.deep.eq([
      {
        type: tree.STATIC_NODE,
        path: 'users/',
        chain: [
          {
            type: tree.PARAMETER_NODE,
            capture: 'userId',
            chain: [
              {
                type: tree.STATIC_NODE,
                path: 'items/',
                chain: [
                  {
                    type: tree.PARAMETER_NODE,

                    capture: 'itemId',
                    chain: [
                      {
                        type: tree.STATIC_NODE,
                        path: 'wild',
                        chain: [
                          {
                            type: tree.WILDCARD_NODE,
                            capture: '',
                            chain: [
                              {
                                type: tree.LAYER,
                                methods: ['PUT'],
                                isMiddleware: false,
                                handle: noop,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: tree.STATIC_NODE,
                    path: 'item',
                    chain: [
                      {
                        type: tree.LAYER,
                        methods: ['PUT'],
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
});
