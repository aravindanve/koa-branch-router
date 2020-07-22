# Benchmarks

Benchmark cases taken from [Router Benchmarks by @delvedor](https://github.com/delvedor/router-benchmark)


### 1.0.3

Marginal improvement in some metrics after removing two pass lookup in favor of single pass lookup.

```
=============================
 koa-branch-router benchmark
=============================
short static: 1,876,267 ops/sec
static with same radix: 1,524,041 ops/sec
dynamic route: 563,580 ops/sec
mixed static dynamic: 600,813 ops/sec
long static: 1,220,339 ops/sec
wildcard: 1,376,084 ops/sec
all together: 154,851 ops/sec

==========================================================
 koa-branch-router benchmark (WARNING: includes handling)
==========================================================
short static: 1,516,434 ops/sec
static with same radix: 1,271,850 ops/sec
dynamic route: 569,076 ops/sec
mixed static dynamic: 585,142 ops/sec
long static: 1,066,773 ops/sec
wildcard: 1,187,118 ops/sec
all together: 141,027 ops/sec

====================================
 koa-branch-router nested benchmark
====================================
short static: 1,136,449 ops/sec
static with same radix: 1,029,325 ops/sec
dynamic route: 481,392 ops/sec
mixed static dynamic: 514,809 ops/sec
long static: 981,395 ops/sec
wildcard: 1,089,155 ops/sec
all together: 115,412 ops/sec

=================================================================
 koa-branch-router nested benchmark (WARNING: includes handling)
=================================================================
short static: 1,038,871 ops/sec
static with same radix: 928,249 ops/sec
dynamic route: 444,447 ops/sec
mixed static dynamic: 484,259 ops/sec
long static: 890,927 ops/sec
wildcard: 933,389 ops/sec
all together: 105,788 ops/sec
```

### 1.0.2

```
=============================
 koa-branch-router benchmark
=============================
short static: 1,724,273 ops/sec
static with same radix: 1,394,821 ops/sec
dynamic route: 578,566 ops/sec
mixed static dynamic: 585,552 ops/sec
long static: 1,136,413 ops/sec
wildcard: 1,314,565 ops/sec
all together: 146,391 ops/sec

==========================================================
 koa-branch-router benchmark (WARNING: includes handling)
==========================================================
short static: 1,451,289 ops/sec
static with same radix: 1,226,463 ops/sec
dynamic route: 549,447 ops/sec
mixed static dynamic: 570,400 ops/sec
long static: 979,056 ops/sec
wildcard: 1,128,197 ops/sec
all together: 134,931 ops/sec

====================================
 koa-branch-router nested benchmark
====================================
short static: 1,046,224 ops/sec
static with same radix: 957,560 ops/sec
dynamic route: 445,160 ops/sec
mixed static dynamic: 462,641 ops/sec
long static: 892,005 ops/sec
wildcard: 792,863 ops/sec
all together: 100,375 ops/sec

=================================================================
 koa-branch-router nested benchmark (WARNING: includes handling)
=================================================================
short static: 931,397 ops/sec
static with same radix: 865,637 ops/sec
dynamic route: 421,822 ops/sec
mixed static dynamic: 467,769 ops/sec
long static: 839,301 ops/sec
wildcard: 929,431 ops/sec
all together: 100,860 ops/sec
```

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
