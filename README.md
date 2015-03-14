# SMJS

[![Build Status](https://travis-ci.org/neonphog/smjs.svg?branch=master)](https://travis-ci.org/neonphog/smjs)

A reference implementation of the CJS javascript minification / encoding scheme. See: [doc/cjs_grammar.md](doc/cjs_grammar.md).

SMJS and CJS were created by David Braden V, ~3o~ph( )g, < neonphog/a/neonphog/d/com >

CJS is a javascript minification / encoding scheme ( `if (a) { return false; }` === `CJS0Iqa'(rL3'!` ) designed to be small, prefer speed of parsing over speed of decoding, and contain only characters safe for inclusion in URI components (and consequently emails).

It is currently an unstable work in progress, and should be considered unfit for production use.

### Usage

#### Command Line

```
$ echo "if (a) { return false; }" | ./bin/smjs
CJS0Iqa'(rL3'!

$ echo "if (a) { return false; }" | ./bin/smjs | ./bin/smjs -d
if(a){return false;}
```

#### Javascript

```
>>> console.log((new SMJS.Encoder()).encodeString('return false;'));
"CJS0rL3"

>>> console.log((new SMJS.Decoder()).decodeString('CJS0rL3'));
"return false;"
```

