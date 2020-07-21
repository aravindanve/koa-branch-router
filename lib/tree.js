const debug = require('debug')('koa-branch-router:tree');
const assert = require('assert');
const utils = require('./utils');
const METHODS = require('http').METHODS;

const LAYER = 1;
const STATIC_NODE = 2;
const PARAMETER_NODE = 3;
const WILDCARD_NODE = 4;
const FRAGMENT_NODE = 5;
const BOUNDARY_NODE = 6;
const BOUNDARY_START = 7;
const BOUNDARY_END = 8;

function insert(root, methods, path, handles, options = {}) {
  let chain = [];

  assert(handles.length, 'You must provide at least one middleware');

  // TODO: caseSensitive & strict
  // const caseSensitive = options.caseSensitive === true;
  // const strict = options.strict === true;
  const isMiddleware = methods.length === 0;

  for (const handle of handles) {
    if (typeof handle !== 'function') {
      assert(
        [FRAGMENT_NODE, BOUNDARY_NODE].includes(handle.type),
        'Middleware must be a function, RouteFragment or Router',
      );
      assert(
        isMiddleware,
        'RouteFragment or Router cannot be added with methods',
      );
      chain.push(handle);
    } else {
      chain.push({
        type: LAYER,
        methods,
        isMiddleware,
        handle,
      });
    }
  }

  // check there are no paramater captures after `*`
  assert(!/\*.*:/.test(path), 'Invalid parameter capture after wildcard');

  // handle wildcard `*`
  const wildcardStartIndex = path.indexOf('*');
  if (wildcardStartIndex !== -1) {
    const capture = path.slice(wildcardStartIndex + 1);
    const node = {
      type: WILDCARD_NODE,
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
        type: STATIC_NODE,
        path: suffix,
        chain,
      };

      debug('static "%s"', suffix);
      chain = [node];
    }

    const capture = path.slice(paramStartIndex + 1, paramEndIndex);
    const node = {
      type: PARAMETER_NODE,
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
      type: STATIC_NODE,
      path,
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

      if (leftNode.type === WILDCARD_NODE) {
        if (leftNode.capture === rightNode.capture) {
          debug('merge "*%s"', leftNode.capture);
          for (const node of rightNode.chain) {
            leftNode.chain.push(node);
          }
          rightChain.shift(); // discard right
        }
        break merge;
      }

      if (leftNode.type === PARAMETER_NODE) {
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

      if (leftNode.type === STATIC_NODE) {
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
            type: STATIC_NODE,
            path: suffix,
            chain: leftNode.chain,
          };

          debug('split left "%s", "%s"', prefix, suffix);

          leftNode.chain = [node];
          leftNode.path = prefix;
        }

        // split right fragment
        if (prefixEnd < rightNode.path.length) {
          const suffix = rightNode.path.slice(prefixEnd);
          const node = {
            type: STATIC_NODE,
            path: suffix,
            chain: rightNode.chain,
          };

          debug('split right "%s", "%s"', prefix, suffix);

          rightNode.chain = [node];
          rightNode.path = prefix;
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

function lookup(root, method, path, options = {}) {
  let stack = [];
  let chain = [];

  // TODO: caseSensitive & strict
  // const caseSensitive = options.caseSensitive === true;
  // const strict = options.strict === true;

  stack.push({
    node: root,
    params: options.params || {},
    index: 0,
  });

  debug('lookup %s "%s"', method, path);

  // pass 1: find

  while (stack.length) {
    const { node, index, params } = stack.pop();

    if (node.type === LAYER) {
      if (node.isMiddleware) {
        chain.push({
          type: LAYER,
          isMiddleware: true,
          params,
          handle: node.handle,
        });
      } else if (index >= path.length && node.methods === METHODS) {
        chain.push({
          type: LAYER,
          isMiddleware: false,
          params,
          handle: node.handle,
        });
      } else if (index >= path.length && node.methods.includes(method)) {
        chain.push({
          type: LAYER,
          isMiddleware: false,
          params,
          handle: node.handle,
        });
      }
      continue;
    }

    if (node.type === STATIC_NODE) {
      if (path.startsWith(node.path, index)) {
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

    if (node.type === PARAMETER_NODE) {
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

    if (node.type === WILDCARD_NODE) {
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

    if (node.type === FRAGMENT_NODE) {
      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params,
          index,
        });
      }
      continue;
    }

    if (node.type === BOUNDARY_NODE) {
      // push boundary start delimiter
      chain.push({
        type: BOUNDARY_START,
      });

      // push boundary delimiter at the bottom
      // of the stack to signal end of boundary
      stack.push({
        node: { type: BOUNDARY_END },
      });
      for (let i = node.chain.length - 1; i >= 0; i--) {
        stack.push({
          node: node.chain[i],
          params,
          index,
        });
      }
      continue;
    }

    // boundary delimiter
    if (node.type === BOUNDARY_END) {
      chain.push(node); // push boundary end delimiter
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

    if (node.type === LAYER) {
      if (!node.isMiddleware) {
        boundaryHasHandler = true;
      }
      layerChain[layerChainLength++] = node;
      continue;
    }

    if (node.type === BOUNDARY_START) {
      boundaryCache.push({
        boundaryHasHandler,
        boundaryStartIndex,
      });
      boundaryHasHandler = false;
      boundaryStartIndex = layerChainLength;
      continue;
    }

    // istanbul ignore else
    if (node.type === BOUNDARY_END) {
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
  LAYER,
  STATIC_NODE,
  PARAMETER_NODE,
  WILDCARD_NODE,
  FRAGMENT_NODE,
  BOUNDARY_NODE,
  BOUNDARY_START,
  BOUNDARY_END,
  insert,
  concat,
  lookup,
};
