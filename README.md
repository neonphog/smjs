# SMJS

[![Build Status](https://travis-ci.org/neonphog/smjs.svg?branch=master)](https://travis-ci.org/neonphog/smjs)

A reference implementation of the CJS javascript minification / encoding scheme.

```
"if (a) { return false; }" === "CJS0I1a(rL3'!"
```

See: [doc/cjs_grammar.md](doc/cjs_grammar.md).

SMJS and CJS were created by David Braden V, ~3o~ph( )g, < neonphog/a/neonphog/d/com >

CJS is designed to be small, prefer speed of parsing over speed of encoding, and contain only characters safe for inclusion in URI components (and consequently emails).

It is currently an unstable work in progress, and should be considered unfit for production use.

### Usage

#### Command Line

```
$ echo "if (a) { return false; }" | ./bin/smjs
CJS0I1a(rL3'!

$ echo "if (a) { return false; }" | ./bin/smjs | ./bin/smjs -d
if(a){return false;}

$ ./bin/smjs --bench -i jquery-1.11.2.js

Benchmark for jquery-1.11.2.js

  NOT-SAFE |    SIZE     | (+ decoder) |   URI-SAFE |    SIZE     | (+ decoder)
---------- | ----------- | ----------- | ---------- | ----------- | -----------
  original | 277.52 KiB  | -           |          - | -           | -
  UglifyJS | 94.34 KiB   | -           |          - | -           | -
      smjs | 92.75 KiB   | 105.58 KiB  |       smjs | 97.82 KiB   | 110.65 KiB
 Uglify+sm | 78.41 KiB   | 91.24 KiB   |  Uglyfy+sm | 83.31 KiB   | 96.14 KiB
```

#### Javascript

```
>>> console.log((new SMJS.Encoder()).encodeString('return false;'));
"CJS0rL3"

>>> console.log((new SMJS.Decoder()).decodeString('CJS0rL3'));
"return false;"
```

