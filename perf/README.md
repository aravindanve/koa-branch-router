# Benchmarks

Benchmark cases taken from [Router Benchmarks by @delvedor](https://github.com/delvedor/router-benchmark)

### 1.0.0-beta.3 (~ 4.3x beta.2)

Nearly 4.3x performance improvement over beta.2 after replacing recursion with iteration.

```
=============================
 koa-branch-router benchmark
=============================
short static: 1,667,674 ops/sec
static with same radix: 1,406,414 ops/sec
dynamic route: 635,239 ops/sec
mixed static dynamic: 669,526 ops/sec
long static: 1,216,818 ops/sec
wildcard: 1,429,993 ops/sec
all together: 157,716 ops/sec

==========================================================
 koa-branch-router benchmark (WARNING: includes handling)
==========================================================
short static: 1,439,801 ops/sec
static with same radix: 1,217,645 ops/sec
dynamic route: 576,578 ops/sec
mixed static dynamic: 591,784 ops/sec
long static: 1,081,569 ops/sec
wildcard: 1,194,005 ops/sec
all together: 143,493 ops/sec
```

### 1.0.0-beta.2

```
=============================
 koa-branch-router benchmark
=============================
short static: 380,448 ops/sec
static with same radix: 233,703 ops/sec
dynamic route: 142,334 ops/sec
mixed static dynamic: 169,050 ops/sec
long static: 296,934 ops/sec
wildcard: 284,577 ops/sec
all together: 35,539 ops/sec

==========================================================
 koa-branch-router benchmark (WARNING: includes handling)
==========================================================
short static: 355,771 ops/sec
static with same radix: 222,079 ops/sec
dynamic route: 139,644 ops/sec
mixed static dynamic: 163,378 ops/sec
long static: 291,173 ops/sec
wildcard: 293,432 ops/sec
all together: 34,345 ops/sec
```
