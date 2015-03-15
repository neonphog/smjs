
(function (__factory, __root) {

  if (typeof define == 'function' && define.amd) {
    define(['exports', './common'], function (__exports, common) {
      __factory(__exports, common.COMMON);
    });
  } else if (typeof exports != 'undefined') {
    __factory(exports, require('./common').COMMON);
  } else {
    __factory(__root.SMJS, __root.SMJS.COMMON);
  }

}(function (__exports, COMMON) {
  'use strict';

  function Decoder() {
  }

  Decoder.prototype.decode = function (code, cbWrite) {
    this._reset(code);
    this._cbWrite = cbWrite;

    if (this._get(3) !== 'CJS') {
      throw new Error('This does not appear to be an cjs stream');
    }

    var streamver = COMMON.r2d(this._get(1));
    if (streamver !== 0) {
      throw new Error('This decoder only supports v0 cjs streams.' +
        ' Stream version found: ' + streamver);
    }

    var ast = [];

    var node = this._nextAst();
    while (node !== false) {
      if (node !== true) {
        ast.push(node);
      }
      node = this._nextAst();
    }

    // free memory, no longer needed
    this._resetIds();

    var init = true;
    for (var i = 0, len = ast.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(';');
      }
      this._next(ast[i]);
    }
  };

  Decoder.prototype.decodeString = function (code) {
    var out = '';
    this.decode(code, function (data) {
      out += data;
    });
    return out;
  };

  Decoder.prototype._reset = function (code) {
    this._cbWrite = null;
    this._code = code;
    this._pointer = 0;
    this._resetIds();
  };

  Decoder.prototype._resetIds = function () {
    this._ids = Object.create(null);
  };

  Decoder.prototype._get = function (count) {
    var out = '';
    while (out.length < count) {
      if (this._pointer >= this._code.length) {
        return false;
      }
      var c = this._code[this._pointer++];
      if (c !== ' ' && c !== '\t' && c !== '+' &&
          c !== '\r' && c !== '\n') {
        out += c;
      }
    }
    return out;
  };

  Decoder.prototype._peek = function () {
    return this._code[this._pointer];
  };

  Decoder.prototype._getToEnd = function () {
    var out = '';
    var c = this._get(1);
    while (c && c != COMMON.T_END) {
      out += c;
      c = this._get(1);
    }
    return out;
  };

  Decoder.prototype._nextAst = function () {
    var args;

    var token = this._get(1);
    if (!token) {
      return false;
    }

    if (token === COMMON.T_NULL) {
      return null;
    } else if (token === COMMON.T_TABLE) {
      this._readTable();

      return this._nextAst();
    }

    var isLitCode = false;
    if (token === COMMON.T_ID_CODE) {
      return COMMON.astCreateNode(COMMON.T_ID, this._readIdCode());
    } else if (token === COMMON.T_ID) {
      return COMMON.astCreateNode(token, this._readInlineId());
    } else if (token === COMMON.T_LITERAL_CODE) {
      isLitCode = true;
      token = COMMON.T_LITERAL;
    }

    var nodeDef = COMMON.AST_NODES[token];
    if (!nodeDef) {
      throw new Error('unexpected token: "' + token + '"');
    }

    var node = [token];

    for (var i = 0, len = nodeDef.length; i < len; ++i) {
      var type = nodeDef[i];

      switch (type) {
      case COMMON.AST_OPERATOR:
        node.push(this._readLiteralCode());
        break;
      case COMMON.AST_NODE:
      case COMMON.AST_LEFT:
      case COMMON.AST_RIGHT:
      case COMMON.AST_INIT:
      case COMMON.AST_TEST:
      case COMMON.AST_UPDATE:
      case COMMON.AST_ALT:
      case COMMON.AST_CATCH:
      case COMMON.AST_FINALLY:
        node.push(this._nextAst());
        break;
      case COMMON.AST_BODY:
      case COMMON.AST_ARGUMENTS:
        args = [];
        while (this._peek() !== COMMON.T_END) {
          args.push(this._nextAst());
        }
        this._get(1); // end
        node.push(args);
        break;
      case COMMON.AST_ID:
        node.push(this._readId());
        break;
      case COMMON.AST_LITERAL:
        if (isLitCode) {
          node.push(this._readLiteralCode());
        } else {
          node.push(COMMON.unesc(this._getToEnd()));
        }
        break;
      case COMMON.AST_OBJDEF:
        args = [];
        while (this._peek() !== COMMON.T_END) {
          args.push([
            this._nextAst(),
            this._nextAst()
          ]);
        }
        this._get(1); // end
        node.push(args);
        break;
      case COMMON.AST_VARDEF:
        args = [];
        while (this._peek() !== COMMON.T_END) {
          args.push([
            this._readId(),
            this._nextAst()
          ]);
        }
        this._get(1); // end
        node.push(args);
        break;
      default:
        throw new Error('unhandled nodeDef:type: "' + type + '"');
      }
    }

    return COMMON.astCreateNode.apply(this, node);
  };

  Decoder.prototype._readTable = function () {
    this._resetIds();

    var idx = 0;
    var id = this._getToEnd();
    while (id.length) {
      this._ids[COMMON.d2r2(idx++)] = id;
      id = this._getToEnd();
    }
  };

  Decoder.prototype._readId = function () {
    if (this._peek() === COMMON.T_TABLE) {
      this._get(1);
      this._readTable();
    }

    var token = this._get(1);
    if (token === COMMON.T_ID_CODE) {
      return this._readIdCode();
    }
    return this._readInlineId();
  };

  Decoder.prototype._readIdCode = function () {
    if (this._peek() === COMMON.T_END) {
      this._get(1);
      return null;
    }
    return this._ids[this._get(2)];
  };

  Decoder.prototype._readInlineId = function () {
    return COMMON.unesc(this._getToEnd());
  };

  Decoder.prototype._readLiteralCode = function () {
    return COMMON.LITERAL_CODE_TABLE[COMMON.r2d(this._get(1))];
  };

  Decoder.prototype._next = function (node) {
    if (!(node[0] in this._map)) {
      throw new Error('Unhandled token: "' + node[0] + '"');
    }
    this._map[node[0]].call(this, node);
  };

  var _map = Decoder.prototype._map = {};

  _map[COMMON.T_ASSIGN] =
  _map[COMMON.T_BOP] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_LEFT));
    this._cbWrite(' ' +
      COMMON.astGetProp(node, COMMON.AST_OPERATOR) + ' ');
    this._next(COMMON.astGetProp(node, COMMON.AST_RIGHT));
  };

  _map[COMMON.T_ARRAY] = function (node) {
    var body = COMMON.astGetProp(node, COMMON.AST_BODY);

    this._cbWrite('[');
    var init = true;
    for (var i = 0, len = body.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._next(body[i]);
    }
    this._cbWrite(']');
  };

  _map[COMMON.T_BREAK] = function (node) {
    this._cbWrite('break');
    var id = COMMON.astGetProp(node, COMMON.AST_ID);
    if (id !== null) {
      this._cbWrite(' ');
      this._cbWrite(id);
    }
    this._cbWrite(';');
  };

  _map[COMMON.T_CALL] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));

    this._cbWrite('(');
    var init = true;
    var args = COMMON.astGetProp(node, COMMON.AST_ARGUMENTS);
    for (var i = 0, len = args.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._next(args[i]);
    }
    this._cbWrite(')');
  };

  _map[COMMON.T_CONTINUE] = function (node) {
    this._cbWrite('continue');
    var id = COMMON.astGetProp(node, COMMON.AST_ID);
    if (id !== null) {
      this._cbWrite(' ');
      this._cbWrite(id);
    }
    this._cbWrite(';');
  };

  _map[COMMON.T_EXPR] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(';');
  };

  _map[COMMON.T_FUNC] = function (node) {
    this._cbWrite("function ");
    var id = COMMON.astGetProp(node, COMMON.AST_ID);
    if (id !== null) {
      this._cbWrite(id);
    }
    this._cbWrite("(");

    var args = COMMON.astGetProp(node, COMMON.AST_ARGUMENTS);
    var init = true;
    for (var i = 0, len = args.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._next(args[i]);
    }
    this._cbWrite(")");

    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_FOR] = function (node) {
    var init = COMMON.astGetProp(node, COMMON.AST_INIT);
    var test = COMMON.astGetProp(node, COMMON.AST_TEST);
    var update = COMMON.astGetProp(node, COMMON.AST_UPDATE);
    var body = COMMON.astGetProp(node, COMMON.AST_NODE);

    this._cbWrite('for(');

    if (init) {
      this._next(init);
    }

    this._cbWrite(';');

    if (test) {
      this._next(test);
    }

    this._cbWrite(';');

    if (update) {
      this._next(update);
    }

    this._cbWrite(')');

    this._next(body);
  };

  _map[COMMON.T_FOR_IN] = function (node) {
    this._cbWrite('for(');
    this._next(COMMON.astGetProp(node, COMMON.AST_LEFT));
    this._cbWrite(' in ');
    this._next(COMMON.astGetProp(node, COMMON.AST_RIGHT));
    this._cbWrite(')');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_THROW] = function (node) {
    this._cbWrite('throw ');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_TRY] = function (node) {
    this._cbWrite('try ');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));

    var c = COMMON.astGetProp(node, COMMON.AST_CATCH);
    var f = COMMON.astGetProp(node, COMMON.AST_FINALLY);

    if (c) {
      this._next(c);
    }

    if (f) {
      this._cbWrite('finally ');
      this._next(f);
    }
  };

  _map[COMMON.T_CATCH] = function (node) {
    this._cbWrite('catch (');
    var id = COMMON.astGetProp(node, COMMON.AST_ID);
    if (id !== null) {
      this._cbWrite(id);
    }
    this._cbWrite(')');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_IF] = function (node) {
    this._cbWrite('if(');
    this._next(COMMON.astGetProp(node, COMMON.AST_TEST));
    this._cbWrite(')');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    var alt = COMMON.astGetProp(node, COMMON.AST_ALT);
    if (alt !== null) {
      this._cbWrite(' else ');
      this._next(alt);
    }
  };

  _map[COMMON.T_PREUPDATE] = function (node) {
    this._cbWrite(COMMON.astGetProp(node, COMMON.AST_OPERATOR));
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_POSTUPDATE] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(COMMON.astGetProp(node, COMMON.AST_OPERATOR));
  };

  _map[COMMON.T_SWITCH] = function (node) {
    this._cbWrite('switch(');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite('){');
    var body = COMMON.astGetProp(node, COMMON.AST_BODY);
    //var init = true;
    for (var i = 0, len = body.length; i < len; ++i) {
      //if (init) {
      //  init = false;
      //} else {
      //  this._cbWrite(';');
      //}
      this._next(body[i]);
    }
    this._cbWrite('}\n');
  };

  _map[COMMON.T_SWITCH_CASE] = function (node) {
    var test = COMMON.astGetProp(node, COMMON.AST_TEST);
    if (test === null) {
      this._cbWrite('default: ');
    } else {
      this._cbWrite('case ');
      this._next(test);
      this._cbWrite(': ');
    }
    var body = COMMON.astGetProp(node, COMMON.AST_BODY);
    var init = true;
    for (var i = 0, len = body.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(';');
      }
      this._next(body[i]);
    }
  };

  _map[COMMON.T_LITERAL] = function (node) {
    this._cbWrite(COMMON.astGetProp(node, COMMON.AST_LITERAL));
  };

  _map[COMMON.T_MEMBER] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_LEFT));
    var right = COMMON.astGetProp(node, COMMON.AST_RIGHT);
    if (right[0] === COMMON.T_ID) {
      this._cbWrite('.');
      this._next(right);
    } else {
      this._cbWrite('[');
      this._next(right);
      this._cbWrite(']');
    }
  };

  _map[COMMON.T_NEW] = function (node) {
    this._cbWrite('new ');

    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));

    var args = COMMON.astGetProp(node, COMMON.AST_ARGUMENTS);
    if (args.length) {
      this._cbWrite('(');
      var init = true;
      for (var i = 0, len = args.length; i < len; ++i) {
        if (init) {
          init = false;
        } else {
          this._cbWrite(',');
        }
        this._next(args[i]);
      }
      this._cbWrite(')');
    }
  };

  _map[COMMON.T_ORDER] = function (node) {
    this._cbWrite('(');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(')');
  };

  _map[COMMON.T_OBJECT] = function (node) {
    var objdef = COMMON.astGetProp(node, COMMON.AST_OBJDEF);

    this._cbWrite('{');
    var init = true;
    for (var i = 0, len = objdef.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._next(objdef[i][0]);
      this._cbWrite(':');
      this._next(objdef[i][1]);
    }
    this._cbWrite('}');
  };

  _map[COMMON.T_ID] = function (node) {
    this._cbWrite(COMMON.astGetProp(node, COMMON.AST_ID));
  };

  _map[COMMON.T_RETURN] = function (node) {
    var next = COMMON.astGetProp(node, COMMON.AST_NODE);
    if (next === null) {
      this._cbWrite('return;');
    } else {
      this._cbWrite('return ');
      this._next(next);
      this._cbWrite(';');
    }
  };

  _map[COMMON.T_SEQ] = function (node) {
    var body = COMMON.astGetProp(node, COMMON.AST_BODY);

    var init = true;
    for (var i = 0, len = body.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._next(body[i]);
    }
  };

  _map[COMMON.T_THIS] = function (node) {
    this._cbWrite('this');
  };

  _map[COMMON.T_UOP] = function (node) {
    this._cbWrite(
      COMMON.astGetProp(node, COMMON.AST_OPERATOR) + ' ');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_VAR] = function (node) {
    this._cbWrite('var ');
    var vardef = COMMON.astGetProp(node, COMMON.AST_VARDEF);
    var init = true;
    for (var i = 0, len = vardef.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(',');
      }
      this._cbWrite(vardef[i][0]);
      if (vardef[i][1] !== null) {
        this._cbWrite(' = ');
        this._next(vardef[i][1]);
      }
    }

    //this._cbWrite(';');
  };

  _map[COMMON.T_DO_WHILE] = function (node) {
    this._cbWrite('do ');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(' while (');
    this._next(COMMON.astGetProp(node, COMMON.AST_TEST));
    this._cbWrite(')');
  };

  _map[COMMON.T_WHILE] = function (node) {
    this._cbWrite('while(');
    this._next(COMMON.astGetProp(node, COMMON.AST_TEST));
    this._cbWrite(')');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_WITH] = function (node) {
    this._cbWrite('with (');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(')');
    this._next(COMMON.astGetProp(node, COMMON.AST_ALT));
  };

  _map[COMMON.T_LABEL] = function (node) {
    this._cbWrite(COMMON.astGetProp(node, COMMON.AST_ID));
    this._cbWrite(':');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
  };

  _map[COMMON.T_CONDITIONAL] = function (node) {
    this._next(COMMON.astGetProp(node, COMMON.AST_TEST));
    this._cbWrite(' ? ');
    this._next(COMMON.astGetProp(node, COMMON.AST_NODE));
    this._cbWrite(' : ');
    this._next(COMMON.astGetProp(node, COMMON.AST_ALT));
  };

  _map[COMMON.T_EMPTY] = function (node) {
    this._cbWrite(';');
  };

  _map[COMMON.T_BLOCK] = function (node) {
    this._cbWrite('{');
    var body = COMMON.astGetProp(node, COMMON.AST_BODY);
    var init = true;
    for (var i = 0, len = body.length; i < len; ++i) {
      if (init) {
        init = false;
      } else {
        this._cbWrite(';');
      }
      this._next(body[i]);
    }
    this._cbWrite('}\n');
  };

  __exports.Decoder = Decoder;

}, this));

