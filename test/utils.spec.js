const chai = require('chai');
const utils = require('../lib/utils');
const CaptureAllFragment = require('../lib/capture-all-fragment');
const CaptureParamFragment = require('../lib/capture-param-fragment');
const PathFragment = require('../lib/path-fragment');
const Router = require('../lib/router');
const Layer = require('../lib/layer');
const { compactStack } = require('../lib/utils');

describe('safeDecode', () => {
  it('decodes url encoded strings', () => {
    chai.expect(utils.safeDecode('%20')).to.eq(' ');
  });
  it('does not throw when encoded string is malformed', () => {
    chai.expect(utils.safeDecode('%')).to.eq('%');
  });
});

describe('findPrefixEnd', () => {
  it('finds the prefix end index for two strings', () => {
    chai.expect(utils.findPrefixEnd('hello', 'helloworld')).to.eq(5);
    chai.expect(utils.findPrefixEnd('hellow', 'helloworld')).to.eq(6);
    chai.expect(utils.findPrefixEnd('hell', 'helloworld')).to.eq(4);
    chai.expect(utils.findPrefixEnd('helloworld', 'wut')).to.eq(0);
  });
});

describe('compactStack', () => {
  it('merges two capture all fragments', () => {
    const stack = [
      new CaptureAllFragment({ capture: 'rest', stack: [1, 2] }),
      new CaptureAllFragment({ capture: 'rest', stack: [3, 4] }),
    ];

    const result = utils.compactStack(stack);

    chai
      .expect(result)
      .to.deep.eq([
        new CaptureAllFragment({ capture: 'rest', stack: [1, 2, 3, 4] }),
      ]);
  });

  it('does not merge two capture all fragments with different anmes', () => {
    const stack = [
      new CaptureAllFragment({ capture: 'rest', stack: [1, 2] }),
      new CaptureAllFragment({ capture: 'everyhting', stack: [3, 4] }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq(stack);
  });

  it('merges two capture param fragments', () => {
    const stack = [
      new CaptureParamFragment({ capture: 'userId', stack: [1, 2] }),
      new CaptureParamFragment({ capture: 'userId', stack: [3, 4] }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new CaptureParamFragment({
        capture: 'userId',
        stack: [1, 2, 3, 4],
      }),
    ]);
  });

  it('merges two capture param fragments and recursively', () => {
    const stack = [
      new CaptureParamFragment({
        capture: 'userId',
        stack: [new CaptureAllFragment({ capture: 'rest', stack: [1, 2] })],
      }),
      new CaptureParamFragment({
        capture: 'userId',
        stack: [new CaptureAllFragment({ capture: 'rest', stack: [3, 4] })],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new CaptureParamFragment({
        capture: 'userId',
        stack: [
          new CaptureAllFragment({ capture: 'rest', stack: [1, 2, 3, 4] }),
        ],
      }),
    ]);
  });

  it('merges two path fragments with the same path', () => {
    const stack = [
      new PathFragment({
        path: '/hello',
        stack: [1, 2],
      }),
      new PathFragment({
        path: '/hello',
        stack: [3, 4],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [1, 2, 3, 4],
      }),
    ]);
  });

  it('merges two path fragments where first path includes second path', () => {
    const stack = [
      new PathFragment({
        path: '/hello/world',
        stack: [1, 2],
      }),
      new PathFragment({
        path: '/hello',
        stack: [3, 4],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [
          new PathFragment({
            path: '/world',
            stack: [1, 2],
          }),
          3,
          4,
        ],
      }),
    ]);
  });

  it('merges two path fragments where second path includes first path', () => {
    const stack = [
      new PathFragment({
        path: '/hello',
        stack: [1, 2],
      }),
      new PathFragment({
        path: '/helloworld',
        stack: [3, 4],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [
          1,
          2,
          new PathFragment({
            path: 'world',
            stack: [3, 4],
          }),
        ],
      }),
    ]);
  });

  it('merges two path fragments with a common prefix', () => {
    const stack = [
      new PathFragment({
        path: '/hello/world',
        stack: [1, 2],
      }),
      new PathFragment({
        path: '/hellomeow',
        stack: [3, 4],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [
          new PathFragment({
            path: '/world',
            stack: [1, 2],
          }),
          new PathFragment({
            path: 'meow',
            stack: [3, 4],
          }),
        ],
      }),
    ]);
  });

  it('does not merge two path fragments with unrelated paths', () => {
    const stack = [
      new PathFragment({
        path: '/hello/world',
        stack: [1, 2],
      }),
      new PathFragment({
        path: 'wut',
        stack: [3, 4],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq(stack);
  });

  it('does not merge two routers', () => {
    const stack = [
      new Router({
        path: '/',
      }),
      new Router({
        path: '/',
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq(stack);
  });

  it('does not merge two layers', () => {
    const stack = [
      new Layer({ methods: [], handle: 1 }),
      new Layer({ methods: [], handle: 1 }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq(stack);
  });

  it('merges multiple path fragments correctly', () => {
    const stack = [
      new PathFragment({
        path: '/1/2/3/4/5/6',
        stack: [],
      }),
      new PathFragment({
        path: '/1/2/3',
        stack: [],
      }),
      new PathFragment({
        path: '/1/2/3/4/5',
        stack: [],
      }),
      new PathFragment({
        path: '/1/2/3/4/5/6/7/8/9',
        stack: [],
      }),
      new PathFragment({
        path: '/1/2/3/4/5/11/7/8/9',
        stack: [],
      }),
      new PathFragment({
        path: '/1/9/3/4/5',
        stack: [],
      }),
      new PathFragment({
        path: '/1/2/3/4/5',
        stack: [],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        type: 2,
        path: '/1/',
        stack: [
          new PathFragment({
            type: 2,
            path: '2/3',
            stack: [
              new PathFragment({
                type: 2,
                path: '/4/5',
                stack: [
                  new PathFragment({
                    type: 2,
                    path: '/',
                    stack: [
                      new PathFragment({
                        type: 2,
                        path: '6',
                        stack: [
                          new PathFragment({
                            type: 2,
                            path: '/7/8/9',
                            stack: [],
                          }),
                        ],
                      }),
                      new PathFragment({
                        type: 2,
                        path: '11/7/8/9',
                        stack: [],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new PathFragment({ type: 2, path: '9/3/4/5', stack: [] }),
          new PathFragment({ type: 2, path: '2/3/4/5', stack: [] }),
        ],
      }),
    ]);
  });

  it('merges mixed stack correctly', () => {
    const stack = [
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [1, 2],
          }),
          new CaptureAllFragment({
            capture: 'name',
            stack: [3, 4],
          }),
          new CaptureParamFragment({
            capture: 'name',
            stack: [5, 6],
          }),
        ],
      }),
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [7, 8],
          }),
        ],
      }),
    ];

    const result = compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [1, 2],
          }),
          new CaptureAllFragment({
            capture: 'name',
            stack: [3, 4],
          }),
          new CaptureParamFragment({
            capture: 'name',
            stack: [5, 6, 7, 8],
          }),
        ],
      }),
    ]);
  });

  it('deep merges stack correctly', () => {
    const stack = [
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [
              new PathFragment({
                path: '/world',
                stack: [
                  new CaptureParamFragment({
                    capture: 'id',
                    stack: [
                      new PathFragment({
                        path: '/hello',
                        stack: [
                          new CaptureParamFragment({
                            capture: 'name',
                            stack: [1, 2],
                          }),
                          new CaptureAllFragment({
                            capture: 'name',
                            stack: [3, 4],
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
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [
              new PathFragment({
                path: '/world',
                stack: [
                  new CaptureParamFragment({
                    capture: 'id',
                    stack: [
                      new PathFragment({
                        path: '/hello',
                        stack: [
                          new CaptureAllFragment({
                            capture: 'name',
                            stack: [5, 6],
                          }),
                          new CaptureParamFragment({
                            capture: 'name',
                            stack: [7, 8],
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

    const result = compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({
        path: '/hello',
        stack: [
          new CaptureParamFragment({
            capture: 'name',
            stack: [
              new PathFragment({
                path: '/world',
                stack: [
                  new CaptureParamFragment({
                    capture: 'id',
                    stack: [
                      new PathFragment({
                        path: '/hello',
                        stack: [
                          new CaptureParamFragment({
                            capture: 'name',
                            stack: [1, 2],
                          }),
                          new CaptureAllFragment({
                            capture: 'name',
                            stack: [3, 4, 5, 6],
                          }),
                          new CaptureParamFragment({
                            capture: 'name',
                            stack: [7, 8],
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

  it('merges a complex stack correctly', () => {
    const stack = [
      new PathFragment({
        path: '/hello/world',
        stack: [1],
      }),
      new CaptureParamFragment({
        capture: 'name',
        stack: [
          new PathFragment({
            path: '/wutall',
            stack: [new CaptureAllFragment({ capture: '', stack: [2] })],
          }),
          new PathFragment({
            path: '/wut',
            stack: [
              new CaptureAllFragment({ capture: '', stack: [3] }),
              new Router({
                path: '/',
              }),
            ],
          }),
        ],
      }),
      new CaptureParamFragment({
        capture: 'name',
        stack: [
          new PathFragment({
            path: '/wutismyname',
            stack: [4, 5],
          }),
          new PathFragment({
            path: '/well',
            stack: [6, 7],
          }),
          new PathFragment({
            path: '/wutall',
            stack: [new CaptureAllFragment({ capture: '', stack: [8] })],
          }),
        ],
      }),
      new CaptureParamFragment({
        capture: 'id',
        stack: [9],
      }),
      new CaptureParamFragment({
        capture: 'name',
        stack: [
          new PathFragment({
            path: '/wutall',
            stack: [10, 11],
          }),
          new PathFragment({
            path: '/wut',
            stack: [
              new CaptureAllFragment({ capture: 'etc', stack: [12] }),
              new CaptureAllFragment({ capture: 'extras', stack: [13] }),
              new CaptureAllFragment({ capture: 'etc', stack: [14] }),
              new CaptureAllFragment({ capture: 'etc', stack: [15] }),
            ],
          }),
        ],
      }),
      new PathFragment({
        path: '/hello',
        stack: [16, 17],
      }),
      new PathFragment({
        path: '/hellomewo',
        stack: [18, 19],
      }),
    ];

    const result = utils.compactStack(stack);

    chai.expect(result).to.deep.eq([
      new PathFragment({ type: 2, path: '/hello/world', stack: [1] }),
      new CaptureParamFragment({
        type: 3,
        capture: 'name',
        stack: [
          new PathFragment({
            type: 2,
            path: '/w',
            stack: [
              new PathFragment({
                type: 2,
                path: 'ut',
                stack: [
                  new PathFragment({
                    type: 2,
                    path: 'all',
                    stack: [
                      new CaptureAllFragment({
                        type: 4,
                        capture: '',
                        stack: [2],
                      }),
                    ],
                  }),
                  new CaptureAllFragment({ type: 4, capture: '', stack: [3] }),
                  new Router({ type: 5, path: '/', stack: [] }),
                  new PathFragment({
                    type: 2,
                    path: 'ismyname',
                    stack: [4, 5],
                  }),
                ],
              }),
              new PathFragment({ type: 2, path: 'ell', stack: [6, 7] }),
              new PathFragment({
                type: 2,
                path: 'utall',
                stack: [
                  new CaptureAllFragment({ type: 4, capture: '', stack: [8] }),
                ],
              }),
            ],
          }),
        ],
      }),
      new CaptureParamFragment({ type: 3, capture: 'id', stack: [9] }),
      // NOTE: the following layer isn't compact and this is to be expected.
      // compactStack does not touch unmerged layers's stacks
      new CaptureParamFragment({
        type: 3,
        capture: 'name',
        stack: [
          new PathFragment({ type: 2, path: '/wutall', stack: [10, 11] }),
          new PathFragment({
            type: 2,
            path: '/wut',
            stack: [
              new CaptureAllFragment({ type: 4, capture: 'etc', stack: [12] }),
              new CaptureAllFragment({
                type: 4,
                capture: 'extras',
                stack: [13],
              }),
              new CaptureAllFragment({ type: 4, capture: 'etc', stack: [14] }),
              new CaptureAllFragment({ type: 4, capture: 'etc', stack: [15] }),
            ],
          }),
        ],
      }),
      new PathFragment({
        type: 2,
        path: '/hello',
        stack: [
          16,
          17,
          new PathFragment({ type: 2, path: 'mewo', stack: [18, 19] }),
        ],
      }),
    ]);
  });
});
