const debug = require('debug')('koa-branch-router:utils');
const Type = require('./type');
const PathFragment = require('./path-fragment');

const safeDecode = (str) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

const findPrefixEnd = (a, b) => {
  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i] === b[i]) {
    i++;
  }

  return i;
};

const compactStack = (stack) =>
  stack.reduce((out, right) => {
    let left = out[out.length - 1];
    debug('comparing left %s and right %s', left && left.type, right.type);

    if (left && left.type === right.type) {
      switch (left.type) {
        case Type.captureAllFragment:
          if (left.capture === right.capture) {
            debug('merging capture all fragments "*%s"', left.capture);
            left.stack.push(...right.stack);
            return out;
          }
          break;

        case Type.captureParamFragment:
          if (left.capture === right.capture) {
            debug('merging capture param fragments ":%s"', left.capture);
            left.stack = compactStack([...left.stack, ...right.stack]);
            return out;
          }
          break;

        case Type.pathFragment: {
          debug('merging path fragments "%s" and "%s"', left.path, right.path);

          if (left.path === right.path) {
            debug('paths are identical, merging both');
            left.stack = compactStack([...left.stack, ...right.stack]);
            return out;
          }

          // find common prefix
          const prefixEnd = findPrefixEnd(left.path, right.path);
          const prefix = left.path.slice(0, prefixEnd);

          if (!prefix) {
            debug('no common prefix found, unable to merge');
            out.push(right);
            return out;
          }

          debug('found common prefix', prefix);

          // split left fragment
          if (prefixEnd < left.path.length) {
            const suffix = left.path.slice(prefixEnd);

            debug(
              'splitting left path "%s" into "%s" and "%s"',
              left.path,
              prefix,
              suffix,
            );

            const fragment = new PathFragment({
              path: suffix,
              stack: left.stack,
            });

            left.stack = [fragment];
            left.path = prefix;
          }

          // split right fragment
          if (prefixEnd < right.path.length) {
            const suffix = right.path.slice(prefixEnd);

            debug(
              'splitting right path "%s" into "%s" and "%s"',
              right.path,
              prefix,
              suffix,
            );

            const fragment = new PathFragment({
              path: suffix,
              stack: right.stack,
            });

            right.stack = [fragment];
            right.path = prefix;
          }

          debug('merging right and left stacks');
          left.stack = compactStack([...left.stack, ...right.stack]);
          return out;
        }
      }
    }
    out.push(right);
    return out;
  }, []);

module.exports = {
  safeDecode,
  findPrefixEnd,
  compactStack,
};
