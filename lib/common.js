
(function (__factory, __root) {

  if (typeof define == 'function' && define.amd) {
    define(['exports'], function (__exports) {
      __factory(__exports);
    });
  } else if (typeof exports != 'undefined') {
    __factory(exports);
  } else {
    var orig = __root.SMJS;
    __root.SMJS = {
      noConflict: function () {
        __root.SMJS = orig;
        return this;
      }
    };
    __factory(__root.SMJS);
  }

}(function (__exports) {
  'use strict';

  var COMMON = __exports.COMMON = {
    // VERSION:START
    "version": "0.0.1-alpha.1"
    // VERSION:END
  };

  // uri component safe alphabet, apostrophe (') is left out as an end marker
  var T = "0123456789" +
    "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ" +
    "-_.!~*()";

  function d2r(num) {
    var tlen = T.length;
    var r = num % tlen;
    var q = Math.floor(num / tlen);
    var out = T.charAt(r);
    while (q) {
      r = q % tlen;
      q = Math.floor(q / tlen);
      out = T.charAt(r) + out;
    }
    return out;
  }

  function d2r2(num) {
    var t = d2r(num);
    if (t.length < 2) {
      t = T[0] + t;
    }
    return t;
  }

  function r2d(str) {
    var tlen = T.length;
    var out = 0;
    var slen = str.length;
    for (var i = 0; i < slen; ++i) {
      out = out * tlen + T.indexOf(str.charAt(i));
    }
    return out;
  }

  function esc(str) {
    return encodeURIComponent(str.toString()).replace(/\'/g,'%27');
  }

  function unesc(str) {
    return decodeURIComponent(str);
  }

  COMMON.d2r = d2r;
  COMMON.d2r2 = d2r2;
  COMMON.r2d = r2d;
  COMMON.esc = esc;
  COMMON.unesc = unesc;

  // ASTs are stored as an array tree as an attempt to minimize
  // memory / garbage collection
  // should include only what can be encoded by the actual cjs stream

  COMMON.AST_TOKEN = 'token';
  COMMON.AST_NODE = 'node';
  COMMON.AST_BODY = 'body';
  COMMON.AST_ID = 'id';
  COMMON.AST_LITERAL = 'literal';
  COMMON.AST_OPERATOR = 'operator';
  COMMON.AST_LEFT = 'left';
  COMMON.AST_RIGHT = 'right';
  COMMON.AST_ARGUMENTS = 'arguments';
  COMMON.AST_INIT = 'init';
  COMMON.AST_TEST = 'test';
  COMMON.AST_UPDATE = 'update';
  COMMON.AST_CATCH = 'catch';
  COMMON.AST_FINALLY = 'finally';
  COMMON.AST_ALT = 'alt';
  COMMON.AST_OBJDEF = 'objdef';
  COMMON.AST_VARDEF = 'vardef';

  COMMON.AST_NODES = {};

  // special end token is not in the d2r alphabet
  COMMON.T_END = "'";

  //COMMON. = '0';
  // number tokens indicate an inlide id value of corresponding length
  COMMON.T_1 = '1';
  COMMON.T_2 = '2';
  COMMON.T_3 = '3';
  COMMON.T_4 = '4';
  COMMON.T_5 = '5';
  COMMON.T_6 = '6';
  COMMON.T_7 = '7';
  COMMON.T_8 = '8';
  COMMON.T_9 = '9';

  COMMON.T_ASSIGN = 'a';
  COMMON.AST_NODES[COMMON.T_ASSIGN] = [
    COMMON.AST_OPERATOR, COMMON.AST_LEFT, COMMON.AST_RIGHT];

  COMMON.T_ARRAY = 'A';
  COMMON.AST_NODES[COMMON.T_ARRAY] = [COMMON.AST_BODY];

  COMMON.T_BOP = 'b';
  COMMON.AST_NODES[COMMON.T_BOP] = [
    COMMON.AST_OPERATOR, COMMON.AST_LEFT, COMMON.AST_RIGHT];

  COMMON.T_BREAK = 'B';
  COMMON.AST_NODES[COMMON.T_BREAK] = [COMMON.AST_ID];

  COMMON.T_CALL = 'c';
  COMMON.AST_NODES[COMMON.T_CALL] = [COMMON.AST_NODE, COMMON.AST_ARGUMENTS];

  COMMON.T_CONTINUE = 'C';
  COMMON.AST_NODES[COMMON.T_CONTINUE] = [COMMON.AST_ID];

  //COMMON. = 'd';
  //COMMON. = 'D';
  //COMMON. = 'e';

  COMMON.T_EXPR = 'E';
  COMMON.AST_NODES[COMMON.T_EXPR] = [COMMON.AST_NODE];

  COMMON.T_FUNC = 'f';
  COMMON.AST_NODES[COMMON.T_FUNC] =
    [COMMON.AST_ID, COMMON.AST_ARGUMENTS, COMMON.AST_NODE];

  COMMON.T_FOR = 'F';
  COMMON.AST_NODES[COMMON.T_FOR] = [
    COMMON.AST_INIT, COMMON.AST_TEST, COMMON.AST_UPDATE, COMMON.AST_NODE];

  COMMON.T_FOR_IN = 'g';
  COMMON.AST_NODES[COMMON.T_FOR_IN] = [
    COMMON.AST_LEFT, COMMON.AST_RIGHT, COMMON.AST_NODE];

  COMMON.T_THROW = 'G';
  COMMON.AST_NODES[COMMON.T_THROW] = [COMMON.AST_NODE];

  COMMON.T_TRY = 'h';
  COMMON.AST_NODES[COMMON.T_TRY] =
    [COMMON.AST_NODE, COMMON.AST_CATCH, COMMON.AST_FINALLY];

  COMMON.T_CATCH = 'H';
  COMMON.AST_NODES[COMMON.T_CATCH] = [COMMON.AST_ID, COMMON.AST_NODE];

  //COMMON. = 'i';

  COMMON.T_IF = 'I';
  COMMON.AST_NODES[COMMON.T_IF] =
    [COMMON.AST_TEST, COMMON.AST_NODE, COMMON.AST_ALT];

  COMMON.T_PREUPDATE = 'j';
  COMMON.AST_NODES[COMMON.T_PREUPDATE] =
    [COMMON.AST_OPERATOR, COMMON.AST_NODE];

  COMMON.T_POSTUPDATE = 'J';
  COMMON.AST_NODES[COMMON.T_POSTUPDATE] =
    [COMMON.AST_OPERATOR, COMMON.AST_NODE];

  COMMON.T_SWITCH = 'k';
  COMMON.AST_NODES[COMMON.T_SWITCH] =
    [COMMON.AST_NODE, COMMON.AST_BODY];
  COMMON.T_SWITCH_CASE = 'K';
  COMMON.AST_NODES[COMMON.T_SWITCH_CASE] =
    [COMMON.AST_TEST, COMMON.AST_BODY];

  COMMON.T_LITERAL = 'l';
  COMMON.T_LITERAL_CODE = 'L';
  COMMON.AST_NODES[COMMON.T_LITERAL] = [COMMON.AST_LITERAL];

  COMMON.T_MEMBER = 'm';
  COMMON.AST_NODES[COMMON.T_MEMBER] = [COMMON.AST_LEFT, COMMON.AST_RIGHT];

  //COMMON. = 'M';

  COMMON.T_NEW = 'n';
  COMMON.AST_NODES[COMMON.T_NEW] = [COMMON.AST_NODE, COMMON.AST_ARGUMENTS];

  //COMMON. = 'N';

  COMMON.T_ORDER = 'o';
  COMMON.AST_NODES[COMMON.T_ORDER] = [COMMON.AST_NODE];

  COMMON.T_OBJECT = 'O';
  COMMON.AST_NODES[COMMON.T_OBJECT] = [COMMON.AST_OBJDEF];

  //COMMON. = 'p';
  //COMMON. = 'P';

  COMMON.T_ID = 'q';
  COMMON.AST_NODES[COMMON.T_ID] = [COMMON.AST_ID];

  //COMMON. = 'Q';

  COMMON.T_RETURN = 'r';
  COMMON.AST_NODES[COMMON.T_RETURN] = [COMMON.AST_NODE];

  //COMMON. = 'R';
  //COMMON. = 's';

  COMMON.T_SEQ = 'S';
  COMMON.AST_NODES[COMMON.T_SEQ] = [COMMON.AST_BODY];

  COMMON.T_TABLE = 't';

  COMMON.T_THIS = 'T';
  COMMON.AST_NODES[COMMON.T_THIS] = [];

  COMMON.T_UOP = 'u';
  COMMON.AST_NODES[COMMON.T_UOP] = [COMMON.AST_OPERATOR, COMMON.AST_NODE];

  //COMMON. = 'U';

  COMMON.T_VAR = 'v';
  COMMON.AST_NODES[COMMON.T_VAR] = [COMMON.AST_VARDEF];

  COMMON.T_DO_WHILE = 'V';
  COMMON.AST_NODES[COMMON.T_DO_WHILE] = [COMMON.AST_NODE, COMMON.AST_TEST];

  COMMON.T_WHILE = 'w';
  COMMON.AST_NODES[COMMON.T_WHILE] = [COMMON.AST_TEST, COMMON.AST_NODE];

  COMMON.T_WITH = 'W';
  COMMON.AST_NODES[COMMON.T_WITH] = [COMMON.AST_NODE, COMMON.AST_ALT];

  //COMMON. = 'x';
  //COMMON. = 'X';
  //COMMON. = 'y';
  //COMMON. = 'Y';

  COMMON.T_LABEL = 'z';
  COMMON.AST_NODES[COMMON.T_LABEL] = [COMMON.AST_ID, COMMON.AST_NODE];

  COMMON.T_CONDITIONAL = 'Z';
  COMMON.AST_NODES[COMMON.T_CONDITIONAL] = [
    COMMON.AST_TEST, COMMON.AST_NODE, COMMON.AST_ALT];

  //COMMON. = '-';
  //COMMON. = '_';

  COMMON.T_EMPTY = '.';
  COMMON.AST_NODES[COMMON.T_EMPTY] = [];

  COMMON.T_NULL = '!';

  //COMMON. = '~';
  //COMMON. = '*';

  COMMON.T_BLOCK = '(';
  COMMON.AST_NODES[COMMON.T_BLOCK] = [COMMON.AST_BODY];

  //COMMON. = ')';

  COMMON.LITERAL_CODE_TABLE = [
    "undefined",
    "null",
    "true",
    "false",
    "NaN",
    "Infinity",
    "-Infinity",
    '-',
    '+',
    '!',
    '~',
    'typeof',
    'void',
    'delete',
    '==',
    '!=',
    '===',
    '!==',
    '<',
    '<=',
    '>',
    '>=',
    '<<',
    '>>',
    '>>>',
    '*',
    '/',
    '%',
    '|',
    '^',
    '&',
    'in',
    'instanceof',
    '..',
    '||',
    '&&',
    '=',
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '<<=',
    '>>=',
    '>>>=',
    '|=',
    '^=',
    '&=',
    '++',
    '--'
  ];

  var slice = [].slice;
  COMMON.astCreateNode = function (/* arguments */) {
    var nodeDef = COMMON.AST_NODES[arguments[0]];
    if (!nodeDef || arguments.length - 1 !== nodeDef.length) {
      throw new Error('invalid createNode');
    }
    return slice.call(arguments);
  };

  COMMON.astGetProp = function (node, prop) {
    var nodeDef = COMMON.AST_NODES[node[0]];
    if (!nodeDef || node.length - 1 !== nodeDef.length) {
      throw new Error('invalid node getProp');
    }
    return node[nodeDef.indexOf(prop) + 1];
  };

}, this));

