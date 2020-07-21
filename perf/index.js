'use strict';

const { fork } = require('child_process');
const { join } = require('path');
const { Queue } = require('./utils');

const benchmarks = ['flat.js', 'flat+handling.js'];

const queue = new Queue();

benchmarks.forEach((file) => {
  queue.add(runner.bind({ file: join(__dirname, 'benchmarks', file) }));
});

function runner(done) {
  const process = fork(this.file);
  process.on('close', done);
}
