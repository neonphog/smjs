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
                original: 284183
                UglifyJS: 96606
                    smjs: 107358
          smjs + decoder: 120627
          UglifyJS->smjs: 92205
UglifyJS->smjs + decoder: 105474
```

#### Javascript

```
>>> console.log((new SMJS.Encoder()).encodeString('return false;'));
"CJS0rL3"

>>> console.log((new SMJS.Decoder()).decodeString('CJS0rL3'));
"return false;"
```

