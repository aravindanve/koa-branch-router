const chai = require('chai');
const chaiSpies = require('chai-spies');
const RouteFragment = require('../lib/route-fragment');
const Layer = require('../lib/layer');
const methods = require('../lib/methods');
const PathFragment = require('../lib/path-fragment');
const CaptureAllFragment = require('../lib/capture-all-fragment');
const CaptureParamFragment = require('../lib/capture-param-fragment');

chai.use(chaiSpies);

describe('RouteFragment', () => {
  it('can be initialized', () => {
    chai
      .expect(new RouteFragment({ capture: '', stack: [] }))
      .to.be.an.instanceof(RouteFragment);
  });

  it('exposes verbs', () => {
    const fragment = new RouteFragment({ capture: '', stack: [] });

    chai.expect(fragment.get).to.be.a('function');
    chai.expect(fragment.put).to.be.a('function');
    chai.expect(fragment.post).to.be.a('function');
    chai.expect(fragment.patch).to.be.a('function');
    chai.expect(fragment.delete).to.be.a('function');
    chai.expect(fragment.del).to.be.a('function');
  });

  it('.use() adds middleware correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.use(handle);
    fragment.use('/hello', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new Layer({ methods: [], handle }),
      new PathFragment({
        path: '/hello',
        stack: [new Layer({ methods: [], handle })],
      }),
    ]);
  });

  it('.verb() adds handlers correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.get(handle);
    fragment.post(handle);
    fragment.all(handle);
    fragment.post('/psst', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new Layer({ methods: ['GET'], handle }),
      new Layer({ methods: ['POST'], handle }),
      new Layer({ methods, handle }),
      new PathFragment({
        path: '/psst',
        stack: [new Layer({ methods: ['POST'], handle })],
      }),
    ]);
  });

  it('.del() does the same thing as .delete()', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.delete(handle);
    fragment.del(handle);

    chai
      .expect(fragment.stack)
      .to.deep.eq([
        new Layer({ methods: ['DELETE'], handle }),
        new Layer({ methods: ['DELETE'], handle }),
      ]);
  });

  it('.add() handles wildcards correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.add(['POST'], '/user*', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        path: '/user',
        stack: [
          new CaptureAllFragment({
            capture: '',
            stack: [new Layer({ methods: ['POST'], handle })],
          }),
        ],
      }),
    ]);
  });

  it('.add() handles named wildcards correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.add(['PUT'], '/user*userSuffix', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        path: '/user',
        stack: [
          new CaptureAllFragment({
            capture: 'userSuffix',
            stack: [new Layer({ methods: ['PUT'], handle })],
          }),
        ],
      }),
    ]);
  });

  it('.add() handles named parameters correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.add(['GET'], '/:userId', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        path: '/',
        stack: [
          new CaptureParamFragment({
            capture: 'userId',
            stack: [new Layer({ methods: ['GET'], handle })],
          }),
        ],
      }),
    ]);
  });

  it('.add() handles multiple named parameters correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.add(['PUT'], 'users/:userId/items/:itemId', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        path: 'users/',
        stack: [
          new CaptureParamFragment({
            capture: 'userId',
            stack: [
              new PathFragment({
                path: 'items/',
                stack: [
                  new CaptureParamFragment({
                    capture: 'itemId',
                    stack: [new Layer({ methods: ['PUT'], handle })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]);
  });

  it('.add() handles mixed paths correctly', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.add(['PUT'], 'users/:userId/items/:itemId/wild*', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        path: 'users/',
        stack: [
          new CaptureParamFragment({
            capture: 'userId',
            stack: [
              new PathFragment({
                path: 'items/',
                stack: [
                  new CaptureParamFragment({
                    capture: 'itemId',
                    stack: [
                      new PathFragment({
                        path: 'wild',
                        stack: [
                          new CaptureAllFragment({
                            capture: '',
                            stack: [new Layer({ methods: ['PUT'], handle })],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ]);
  });

  it('.add() compacts stack when new middleware is added', () => {
    const fragment = new RouteFragment();
    const handle = () => null;

    fragment.stack = [
      new PathFragment({
        path: 'users/',
        stack: [
          new CaptureParamFragment({
            capture: 'userId',
            stack: [
              new PathFragment({
                path: 'items/',
                stack: [
                  new CaptureParamFragment({
                    capture: 'itemId',
                    stack: [
                      new PathFragment({
                        path: 'wild',
                        stack: [
                          new CaptureAllFragment({
                            capture: '',
                            stack: [new Layer({ methods: ['PUT'], handle })],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    fragment.add(['PUT'], 'users/:userId/items/item', handle);

    chai.expect(fragment.stack).to.deep.eq([
      new PathFragment({
        type: 2,
        path: 'users/',
        stack: [
          new CaptureParamFragment({
            type: 3,
            capture: 'userId',
            stack: [
              new PathFragment({
                type: 2,
                path: 'items/',
                stack: [
                  new CaptureParamFragment({
                    type: 3,
                    capture: 'itemId',
                    stack: [
                      new PathFragment({
                        type: 2,
                        path: 'wild',
                        stack: [
                          new CaptureAllFragment({
                            type: 4,
                            capture: '',
                            stack: [
                              new Layer({
                                type: 1,
                                methods: ['PUT'],
                                handle,
                              }),
                            ],
                          }),
                        ],
                        caseSensitive: false,
                      }),
                    ],
                  }),
                  new PathFragment({
                    type: 2,
                    path: 'item',
                    stack: [
                      new Layer({
                        type: 1,
                        methods: ['PUT'],
                        handle,
                      }),
                    ],
                    caseSensitive: false,
                  }),
                ],
                caseSensitive: false,
              }),
            ],
          }),
        ],
        caseSensitive: false,
      }),
    ]);
  });
});
