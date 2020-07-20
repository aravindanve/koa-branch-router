module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: '2019',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    quotes: ['warn', 'single', { avoidEscape: true }],
    'eol-last': ['warn', 'always'],
    'max-len': [
      'warn',
      {
        code: 120,
        tabWidth: 2,
      },
    ],
    'capitalized-comments': [
      'warn',
      'never',
      {
        ignorePattern: 'FIXME|TODO|HACK|NOTE|IMPORTANT|DEPRECATED|^\\*',
      },
    ],
    'no-trailing-spaces': 'warn',
  },
};
