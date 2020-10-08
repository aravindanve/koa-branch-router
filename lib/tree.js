const debug = require('debug')('koa-branch-router:tree');
const assert = require('assert');
const utils = require('./utils');
const METHODS = require('http').METHODS;

const TYPE = {
  LAYER: 1,
  STATIC_NODE: 2,
  PARAMETER_NODE: 3,
  WILDCARD_NODE: 4,
  FRAGMENT_NODE: 5,
  FRAGMENT_END: 6,
  LAYER_MATCH: 10,
};

function insert(root, methods, path, handles) {
  let chain = [];

  assert(handles.length, 'You must provide at least one middleware');

  const isMiddleware = methods.length === 0;
  const endsWithSlash = path.endsWith('/');

  for (const handle of handles) {
    if (typeof handle !== 'function') {
      assert(
        handle.type === TYPE.FRAGMENT_NODE,
        'Middleware must be a function, RouteFragment or Router',
      );
      assert(
        isMiddleware,
        'RouteFragment or Router cannot be added with methods',
      );
      chain.push(handle);
    } else {
      chain.push({
        type: TYPE.LAYER,
        methods,
        isMiddleware,
        endsWithSlash,
        handle,
      });
    }
  }

  // trim trailing slash
  if (endsWithSlash) {
    path = path.slice(0, -1);
  }

  // check there are no paramater captures after `*`
  assert(!/\*.*:/.test(path), 'Invalid parameter capture after wildcard');

  // handle wildcard `*`
  const wildcardStartIndex = path.indexOf('*');
  if (wildcardStartIndex !== -1) {
    const capture = path.slice(wildcardStartIndex + 1);
    const node = {
      type: TYPE.WILDCARD_NODE,
      capture,
      chain,
    };

    debug('wildcard "*%s"', capture);

    chain = [node];
    path = path.slice(0, wildcardStartIndex);

    debug('path = "%s"', path);
  }

  // check each parameter capture is separated by a `/`
  assert(!/:[^/]*:/.test(path), 'Invalid multiple parameter captures');

  // handle params rtl `:`
  let paramStartIndex = path.lastIndexOf(':');
  while (paramStartIndex !== -1) {
    const slashIndex = path.indexOf('/', paramStartIndex);
    const paramEndIndex = slashIndex !== -1 ? slashIndex : path.length;
    const suffix = path.slice(paramEndIndex);

    if (suffix) {
      const node = {
        type: TYPE.STATIC_NODE,
        path: suffix,
        lowerCasePath: suffix.toLowerCase(),
        chain,
      };

      debug('static "%s"', suffix);
      chain = [node];
    }

    const capture = path.slice(paramStartIndex + 1, paramEndIndex);
    const node = {
      type: TYPE.PARAMETER_NODE,
      capture,
      chain,
    };

    debug('parameter ":%s"', capture);

    chain = [node];
    path = path.slice(0, paramStartIndex);
    paramStartIndex = path.lastIndexOf(':');

    debug('path = "%s"', path);
  }

  // handle static path
  if (path) {
    const node = {
      type: TYPE.STATIC_NODE,
      path,
      lowerCasePath: path.toLowerCase(),
      chain,
    };

    debug('static "%s"', path);
    chain = [node];
    path = '';
  }

  // concat layer chains
  concat(root.chain, chain);
}

function concat(leftChain, rightChain) {
  const stack = [{ leftChain, rightChain }];

  while (stack.length) {
    const { leftChain, rightChain } = stack.pop();

    // (try) merge last node in left chain with first node in right chain
    merge: if (leftChain.length && rightChain.length) {
      const leftNode = leftChain[leftChain.length - 1];
      const rightNode = rightChain[0];

      if (leftNode.type !== rightNode.type) {
        // cannot merge nodes of different type
        break merge;
      }

      if (leftNode.type === TYPE.WILDCARD_NODE) {
        if (leftNode.capture === rightNode.capture) {
          debug('merge "*%s"', leftNode.capture);
          for (const node of rightNode.chain) {
            leftNode.chain.push(node);
          }
          rightChain.shift(); // discard right
        }
        break merge;
      }

      if (leftNode.type === TYPE.PARAMETER_NODE) {
        if (leftNode.capture === rightNode.capture) {
          debug('merge ":%s"', leftNode.capture);
          stack.push({
            leftChain: leftNode.chain,
            rightChain: rightNode.chain,
          });
          rightChain.shift(); // discard right
        }
        break merge;
      }

      if (leftNode.type === TYPE.STATIC_NODE) {
        if (leftNode.path === rightNode.path) {
          debug('merge "%s"', leftNode.path);
          stack.push({
            leftChain: leftNode.chain,
            rightChain: rightNode.chain,
          });
          rightChain.shift(); // discard right
          break merge;
        }

        // find common prefix
        const prefixEnd = utils.findPrefixEnd(leftNode.path, rightNode.path);
        const prefix = leftNode.path.slice(0, prefixEnd);

        if (!prefix) {
          // no common prefix found
          break merge;
        }

        // split left fragment
        if (prefixEnd < leftNode.path.length) {
          const suffix = leftNode.path.slice(prefixEnd);
          const node = {
            type: TYPE.STATIC_NODE,
            path: suffix,
            lowerCasePath: suffix.toLowerCase(),
            chain: leftNode.chain,
          };

          debug('split left "%s", "%s"', prefix, suffix);

          leftNode.chain = [node];
          leftNode.path = prefix;
          leftNode.lowerCasePath = prefix.toLowerCase();
        }

        // split right fragment
        if (prefixEnd < rightNode.path.length) {
          const suffix = rightNode.path.slice(prefixEnd);
          const node = {
            type: TYPE.STATIC_NODE,
            path: suffix,
            lowerCasePath: suffix.toLowerCase(),
            chain: rightNode.chain,
          };

          debug('split right "%s", "%s"', prefix, suffix);

          rightNode.chain = [node];
          rightNode.path = prefix;
          rightNode.lowerCasePath = prefix.toLowerCase();
        }

        stack.push({
          leftChain: leftNode.chain,
          rightChain: rightNode.chain,
        });
        rightChain.shift(); // discard right
        break merge;
      }
    }

    // push rest of the right chain into left
    for (const node of rightChain) {
      leftChain.push(node);
    }
  }
}

function lookup(root, method, path, initialParams = {}) {
  let stack = [];
  let chain = [];
  let chainLength = 0;
  let caseSensitive = false;
  let strict = false;
  let boundaryStartIndex = 0;
  let boundaryHasHandler = false;

  const boundaryCache = [];
  const lowerCasePath = path.toLowerCase();
  const endsWithSlash = path.endsWith('/');

  // trim trailing slash
  if (endsWithSlash) {
    path = path.slice(0, -1);
  }

  stack.push({
    node: root,
    params: initialParams,
    index: 0,
  });

  debug('lookup %s "%s"', method, path);

  while (stack.length) {
    const { node, index, params } = stack.pop();

    if (node.type === TYPE.LAYER) {
      if (node.isMiddleware) {
        chain[chainLength++] = {
          type: TYPE.LAYER_MATCH,
          isMiddleware: true,
          params,
          handle: node.handle,
        };
        continue;
      }

      if (
        index >= path.length && // path must be exhausted
        (!strict || endsWithSlash === node.endsWithSlash) &&
        (node.methods === METHODS || node.methods.includes(method))
      ) {
        boundaryHasHandler = true; // flag handler in boundary
        chain[chainLength++] = {
          type: TYPE.LAYER_MATCH,
          isMiddleware: false,
          params,
          handle: node.handle,
        };
      }
      continue;
    }

    if (node.type === TYPE.STATIC_NODE) {
      const match = caseSensitive
        ? path.startsWith(node.path, index)
        : lowerCasePath.startsWith(node.lowerCasePath, index);

      if (match) {
        const nextIndex = index + node.path.length;
        for (let i = node.chain.length - 1; i >= 0; i--) {
          stack.push({
            node: node.chain[i],
            params,
            index: nextIndex,
          });
        }
      }
      continue;
    }

    if (node.type === TYPE.PARAMETER_NODE) {
      const slashIndex = path.indexOf('/', index);
      const nextIndex = slashIndex === -1 ? path.length : slashIndex;
      const nextParams = !node.capture
        ? params
        : {
            ...params,
            [node.capture]: utils.safeDecode(path.slice(index, nextIndex)),
          };

      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params: nextParams,
          index: nextIndex,
        });
      }
      continue;
    }

    if (node.type === TYPE.WILDCARD_NODE) {
      const nextIndex = path.length;
      const nextParams = !node.capture
        ? params
        : {
            ...params,
            [node.capture]: path.slice(index),
          };

      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params: nextParams,
          index: nextIndex,
        });
      }
      continue;
    }

    if (node.type === TYPE.FRAGMENT_NODE) {
      // push fragment delimiter at the bottom
      // of the stack to signal end of fragment
      // and restore current settings
      stack.push({
        node: {
          type: TYPE.FRAGMENT_END,
          isBoundary: node.isBoundary,
          caseSensitive,
          strict,
        },
      });

      // handle boundary start
      if (node.isBoundary) {
        boundaryCache.push({
          boundaryHasHandler,
          boundaryStartIndex,
        });
        boundaryHasHandler = false;
        boundaryStartIndex = chainLength;
      }

      // use node settings if defined or inherit
      if (node.caseSensitive !== undefined) {
        caseSensitive = node.caseSensitive;
      }
      if (node.strict !== undefined) {
        strict = node.strict;
      }

      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params,
          index,
        });
      }
      continue;
    }

    if (node.type === TYPE.FRAGMENT_END) {
      // restore settings
      caseSensitive = node.caseSensitive;
      strict = node.strict;

      // handle boundary end
      if (node.isBoundary) {
        // if boundary has no handler then restore chain before boundary
        if (!boundaryHasHandler) {
          chainLength = boundaryStartIndex;
        }

        // restore parent boundary values
        const cache = boundaryCache.pop();
        // if a boundary nested within the current boundary has a
        // handler, it implies the currect boundary has a handler
        boundaryHasHandler = boundaryHasHandler || cache.boundaryHasHandler;
        boundaryStartIndex = cache.boundaryStartIndex;
      }
      continue;
    }

    throw new Error('Invalid node!');
  }

  debug('lookup %s "%s", found %s layers', method, path, chainLength);

  return chain.slice(0, chainLength);
}

module.exports = {
  METHODS,
  TYPE,
  insert,
  concat,
  lookup,
};
