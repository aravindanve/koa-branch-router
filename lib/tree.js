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
  BOUNDARY_NODE: 7,
  BOUNDARY_START: 8,
  BOUNDARY_END: 9,
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
        [TYPE.FRAGMENT_NODE, TYPE.BOUNDARY_NODE].includes(handle.type),
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
    const suffix = path.slice(paramEndIndex + 1);

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
  let caseSensitive = false;
  let strict = false;

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

  // pass 1: find

  while (stack.length) {
    const { node, index, params } = stack.pop();

    if (node.type === TYPE.LAYER) {
      if (node.isMiddleware) {
        chain.push({
          type: TYPE.LAYER_MATCH,
          isMiddleware: true,
          params,
          handle: node.handle,
        });
      } else if (
        index >= path.length && // path must be exhausted
        (!strict || endsWithSlash === node.endsWithSlash) &&
        (node.methods === METHODS || node.methods.includes(method))
      ) {
        chain.push({
          type: TYPE.LAYER_MATCH,
          isMiddleware: false,
          params,
          handle: node.handle,
        });
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
      const captureEnd = slashIndex === -1 ? path.length : slashIndex;
      const nextIndex = captureEnd + 1;
      const nextParams = !node.capture
        ? params
        : {
            ...params,
            [node.capture]: utils.safeDecode(path.slice(index, captureEnd)),
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
        node: { type: TYPE.FRAGMENT_END, caseSensitive, strict },
      });

      // fragment settings
      caseSensitive = node.caseSensitive;
      strict = node.strict;

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
      continue;
    }

    if (node.type === TYPE.BOUNDARY_NODE) {
      // push boundary start delimiter
      chain.push({
        type: TYPE.BOUNDARY_START,
      });

      // push boundary delimiter at the bottom
      // of the stack to signal end of boundary
      // and restore current settings
      stack.push({
        node: { type: TYPE.BOUNDARY_END, caseSensitive, strict },
      });

      // boundary settings
      caseSensitive = node.caseSensitive;
      strict = node.strict;

      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params,
          index,
        });
      }
      continue;
    }

    if (node.type === TYPE.BOUNDARY_END) {
      // restore settings
      caseSensitive = node.caseSensitive;
      strict = node.strict;
      chain.push(node); // push boundary end to chain
      continue;
    }

    throw new Error('Invalid node!');
  }

  debug('lookup %s "%s", found %s layers', method, path, chain.length);

  // pass 2: reduce

  const layerChain = [];
  const boundaryCache = [];

  let layerChainLength = 0;
  let boundaryStartIndex = 0;
  let boundaryHasHandler = false;

  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];

    if (node.type === TYPE.LAYER_MATCH) {
      if (!node.isMiddleware) {
        boundaryHasHandler = true;
      }
      layerChain[layerChainLength++] = node;
      continue;
    }

    if (node.type === TYPE.BOUNDARY_START) {
      boundaryCache.push({
        boundaryHasHandler,
        boundaryStartIndex,
      });
      boundaryHasHandler = false;
      boundaryStartIndex = layerChainLength;
      continue;
    }

    // istanbul ignore else
    if (node.type === TYPE.BOUNDARY_END) {
      if (!boundaryHasHandler) {
        layerChainLength = boundaryStartIndex;
      }
      const cache = boundaryCache.pop();
      boundaryHasHandler = boundaryHasHandler || cache.boundaryHasHandler;
      boundaryStartIndex = cache.boundaryStartIndex;
      continue;
    }
  }

  debug('lookup %s "%s", keeping %s layers', method, path, layerChainLength);

  return layerChain.slice(0, layerChainLength);
}

module.exports = {
  METHODS,
  TYPE,
  insert,
  concat,
  lookup,
};
