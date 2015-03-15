# CJS Version 0 Grammar
CJS is an encoding protocol for representing a javascript (ecma5(6?)) AST, designed to:
- be small
- prefer speed of parsing over speed of encoding
- contain only characters safe for inclusion in URI components (and consequently emails)

## Status: Unstable

Version 0 is intended as a working draft. Version 0 streams from one day may be un-readable by tomorrow's parser.

### Heuristic Header

CJS Version 0 Streams should begin with the literal characters:

```
CJS0
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
1) T_END
```

### T_1 T_2 T_3 T_4 T_5 T_6 T_7 T_8 T_9

### T_ID

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

### T_BOP

```
0) literal "b"
1) D2R1 index into literal code lookup table: operator
2) NODE left
3) NODE right
```

### T_BREAK

```
0) literal "B"
1) T_ID | T_NULL label
```

### T_CALL

```
0) literal "c"
1) NODE callee
2) NODE_LIST arguments
```

### T_CONTINUE

```
0) literal "C"
1) T_ID | T_NULL label
```

### T_EXPR

```
0) literal "E"
1) NODE body
```

### T_FUNC

```
0) literal "f"
1) T_ID | T_NULL name
2) NODE_LIST arguments
3) NODE body
```

### T_FOR

```
0) literal "F"
1) NODE | T_NULL initializer
2) NODE | T_NULL test
3) NODE | T_NULL update
4) NODE body
```

### T_FOR_IN

```
0) literal "g"
1) NODE left
2) NODE right
3) NODE body
```

### T_THROW

```
0) literal "G"
1) NODE body
```

### T_TRY

```
0) literal "h"
1) NODE body
2) NODE | T_NULL catch
3) NODE | T_NULL finally
```

### T_CATCH

```
0) literal "H"
1) T_ID | T_NULL parameter
2) NODE body
```

### T_IF

```
0) literal "I"
1) NODE test
2) NODE body
3) NODE | T_NULL alternate
```

### T_PREUPDATE

```
0) literal "j"
1) D2R1 index into literal code lookup table: operator
2) NODE body
```

### T_POSTUPDATE

```
0) literal "J"
1) D2R1 index into literal code lookup table: operator
2) NODE body
```

### T_SWITCH

```
0) literal "k"
1) NODE discriminant
2) NODE_LIST body
```

### T_SWICH_CASE

```
0) literal "K"
1) NODE test
2) NODE_LIST body
```

### T_MEMBER

```
0) literal "m"
1) NODE left
2) NODE right
```

### T_NEW

```
0) literal "n"
1) NODE callee
2) NODE_LIST arguments
```

### T_ORDER

```
0) literal "o"
1) NODE body
```

### T_OBJECT

```
0) literal "O"
TODO - describe OBJDEF
```

### T_RETURN

```
0) literal "r"
1) NODE body
```

### T_SEQ

```
0) literal "S"
1) NODE_LIST body
```

### T_TABLE

```
0) literal "t"
TODO - describe TABLEDEF
```

### T_THIS

```
0) literal "T"
```

### T_UOP

```
0) literal "u"
1) D2R1 index into literal code lookup table: operator
2) NODE right
```

### T_VAR

```
0) literal "v"
TODO - describe vardef
```

### T_DO_WHILE

```
0) literal "V"
1) NODE body
2) NODE test
```

### T_WHILE

```
0) literal "w"
1) NODE test
2) NODE body
```

### T_WITH

```
0) literal "W"
1) NODE with item
2) NODE body
```

### T_LABEL

```
0) literal "z"
1) T_ID name
2) NODE body
```

### T_CONDITIONAL

```
0) literal "Z"
1) NODE test
2) NODE true item
2) NODE false item
```

### T_BLOCK

```
0) literal "("
1) NODE_LIST body
2) T_END
```
