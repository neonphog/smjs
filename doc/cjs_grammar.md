# CJS Version 0 Grammar
CJS is an encoding protocol for representing a javascript (ecma5(6?)) AST, designed to:
- be small
- prefer speed of parsing over speed of encoding
- contain only characters safe for inclusion in URI components (and consequently emails)

## Status: Unstable

Version 0 is intended as a working draft. Version 0 streams from one day may be un-readable by tomorrow's parser.

### Heuristic Header

CJS Version 1 Streams should begin with the literal characters:

```
CJS1
```

### D2R / D2R1 / D2R2

Numbers in CJS are often represented in base 70 using the following alphabet:

```
0123456789aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ-_.!~*()
```

In this file, numbers in this form will be denoted as D2R, or the exactly 1 character variant: D2R1, or the exactly 2 character (zero padded) variant: D2R2.

### Literal Code Lookup Table

Literal codes and operators are stored via referencing the following lookup table:

```
0: "undefined"
1: "null"
2: "true"
3: "false"
4: "NaN"
5: "Infinity"
6: "-Infinity"
7: '-'
8: '+'
9: '!'
a: '~'
A: 'typeof'
b: 'void'
B: 'delete'
c: '=='
C: '!='
d: '==='
D: '!=='
e: '<'
E: '<='
f: '>'
F: '>='
g: '<<'
G: '>>'
h: '>>>'
H: '*'
i: '/'
I: '%'
j: '|'
J: '^'
k: '&'
K: 'in'
l: 'instanceof'
L: '..'
m: '||'
M: '&&'
n: '='
N: '+='
o: '-='
O: '*='
p: '/='
P: '%='
q: '<<='
Q: '>>='
r: '>>>='
R: '|='
s: '^='
S: '&='
t: '++'
T: '--'
```

### NODE / TOKEN

A node will consist of a single character TOKEN, followed by zero or more characters as defined by the node type in particular.

### T_END

```
0) literal "'"
```

### T_STRING

Any strings (including identifiers and literals) will be URI component escaped, with the additional requirement of percent encoding apostrophes ('). For example:

```javascript
encodeURIComponent(str).replace(/\'/g,'%27')
```

Following any number of escaped characters will be a literal apostrophe (').

```
0) ESCAPED STRING
1) literal "'"
```

### T_EMPTY

```
0) literal "."
```

### T_NULL

```
0) literal "!"
```

### NODE_LIST

```
0 or more) NODE
N + 1) T_END
```


### T_ASSIGN

```
0) literal "a"
1) NODE left
2) NODE right
```

### T_ARRAY

```
0) literal "A"
1) NODE_LIST array elements
```

### T_LITERAL

T_STRING will be an in-line value of the literal. Strings will include quoting (e.g. `l%22a%22'`)

```
0) literal "l"
1) T_STRING in-line value
```

### T_LITERAL_CODE

```
0) literal "L"
1) D2R1 index into literal code lookup table
```

