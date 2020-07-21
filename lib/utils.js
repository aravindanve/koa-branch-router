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

const bindParams = (params, handle) => (ctx, next) => {
  ctx.params = params;
  return handle(ctx, next);
};

module.exports = {
  safeDecode,
  findPrefixEnd,
  bindParams,
};
