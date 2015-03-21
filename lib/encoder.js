
(function (__factory, __root) {

  if (typeof define == 'function' && define.amd) {
    define(['exports', './common', 'acorn'],
        function (__exports, common, _acorn) {
      __factory(__exports,
        common.COMMON,
        _acorn);
    });
  } else if (typeof exports != 'undefined') {
    __factory(exports,
      require('./common').COMMON,
      require('acorn'));
  } else {
    __factory(__root.SMJS, __root.SMJS.COMMON, acorn);
  }

}(function (__exports, COMMON, _acorn) {
  'use strict';

  var hasOwnProperty = Object.hasOwnProperty;

  /**
   * @constructor
   *
   * @param {object} [options]
   * @param {boolean} [options.uriSafe]
   */
  function Encoder(options) {
    options = options || {};
    if (options.uriSafe || options.uriSafe === undefined) {
      this.uriSafe = true;
    }
  }

  Encoder.prototype.encode = function (code, cbWrite) {
    var i, len;

    this._reset();
    this._cbWrite = cbWrite;

    this._cbWrite("CJS" + COMMON.d2r(0));

    var ast = this._acornToSmjs(this._getAst(code));

    //console.log("enc: " + JSON.stringify(ast));

    this._prioritizeLiterals(ast);

    for (i = 0, len = ast.length; i < len; ++i) {
      this._next(ast[i]);
    }

    this._finalizeBlock();
  };

  Encoder.prototype.encodeString = function (code) {
    var out = '';
    this.encode(code, function (data) {
      out += data;
    });
    return out;
  };

  Encoder.prototype._escape = function (str) {
    if (this.uriSafe) {
      return encodeURIComponent(str.toString()).replace(/\'/g,'%27');
    } else {
      return str.toString().replace(/\%/g, '%25').replace(/\'/g, '%27');
    }
  };

  Encoder.prototype._prioritizeLiterals = function (ast) {
    var i, len;

    var dupLiterals = {};
    for (i = 0, len = ast.length; i < len; ++i) {
      this._nextDupLit(ast[i], dupLiterals);
    }

    var arr = [];
    Object.keys(dupLiterals).forEach(function (key) {
      var count = dupLiterals[key];
      if (count < 2 || key.length < 2) {
        return;
      }
      arr.push([key, key.length * count - 1]);
    });
    arr = arr.sort(function (a, b) {
      return b[1] - a[1];
    });
    arr = arr.slice(0, Math.pow(70, 2) - 1);

    for (i = 0, len = arr.length; i < len; ++i) {
      var t = COMMON.d2r2(this.nextId++);
      this.ids[arr[i][0]] = t;
    }
  };

  Encoder.prototype._reset = function () {
    this._resetIds();

    this._code = '';
  };

  Encoder.prototype._resetIds = function () {
    this.nextId = 0;
    this.ids = {};
  };

  Encoder.prototype._finalizeBlock = function () {
    var i, len;
    var keys = Object.keys(this.ids);
    if (keys.length) {
      var out = new Array(keys.length);
      for (i = 0, len = keys.length; i < len; ++i) {
        var key = keys[i];
        out[COMMON.r2d(this.ids[key])] = key;
      }
      this._cbWrite(COMMON.T_TABLE);
      for (i = 0, len = out.length; i < len; ++i) {
        this._cbWrite(out[i]);
        this._cbWrite(COMMON.T_END);
      }
      this._cbWrite(COMMON.T_END);
    }
    this._cbWrite(this._code);

    this._reset();
  };

  Encoder.prototype._getAst = function (code) {
    // create a somewhat permissive parser
    return _acorn.parse(code, {
      // TODO - support 6
      ecmaVersion: 5,
      allowTrailingCommas: true,
      forbidReserved: false,
      allowReturnOutsideFunction: true,

      // non-standard "ParenthesizedExpression"
      preserveParens: true
    });
  };

  Encoder.prototype._acornToSmjs = function (ast) {
    if (ast.type != "Program") {
      throw new Error('Expecting top-level program');
    }
    var astOut = [];
    for (var i = 0, len = ast.body.length; i < len; ++i) {
      astOut.push(this._acornNext(ast.body[i], null));
    }

    return astOut;
  };

  Encoder.prototype._acornNext = function (node, _parent) {
    if (node === null) {
      throw new Error("Null child of _parent = " + _parent.type);
    }
    if (_parent === undefined) {
      throw new Error('API error, pass _parent in to _acornNext');
    }
    node._parent = _parent;

    if (!(node.type in this._acornMap)) {
      throw new Error('Unknown acorn type: "' + node.type + '"');
    }

    var smjs = this._acornMap[node.type].call(this, node);

    return this._checkOrder(node, smjs);
  };

  Encoder.prototype._checkOrder = function (acornNode, smjsNode) {
    return smjsNode;

    /* TODO - remove?, using acorn's preserveParens for now

    switch (smjsNode[0]) {
    case COMMON.T_BOP:
      // TODO - precedence
      smjsNode = COMMON.astCreateNode(COMMON.T_ORDER, smjsNode);
      break;
    case COMMON.T_CALL:
      if (smjsNode[1][0] === COMMON.T_FUNC) {
        smjsNode[1] = COMMON.astCreateNode(COMMON.T_ORDER, smjsNode[1]);
      }
      break;
    case COMMON.T_NEW:
      if (acornNode._parent &&
          acornNode._parent.type === "MemberExpression") {
        smjsNode = COMMON.astCreateNode(COMMON.T_ORDER, smjsNode);
      }
    }
    return smjsNode;
    */
  };

  var _acornMap = Encoder.prototype._acornMap = {};

  _acornMap["AssignmentExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_ASSIGN,
      node.operator,
      this._acornNext(node.left, node),
      this._acornNext(node.right, node)
    );
  };

  _acornMap["ArrayExpression"] = function (node) {
    var body = [];

    for (var i = 0, len = node.elements.length; i < len; ++i) {
      body.push(this._acornNext(node.elements[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_ARRAY, body);
  };

  _acornMap["LogicalExpression"] =
  _acornMap["BinaryExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_BOP,
      node.operator,
      this._acornNext(node.left, node),
      this._acornNext(node.right, node)
    );
  };

  _acornMap["BreakStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_BREAK,
      node.label ? node.label.name : null);
  };

  _acornMap["CallExpression"] = function (node) {
    var args = [];

    for (var i = 0, len = node.arguments.length; i < len; ++i) {
      args.push(this._acornNext(node.arguments[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_CALL,
      this._acornNext(node.callee, node),
      args
    );
  };

  _acornMap["ContinueStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_CONTINUE,
      node.label ? node.label.name : null);
  };

  _acornMap["EmptyStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_EMPTY);
  };

  _acornMap["ExpressionStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_EXPR,
      this._acornNext(node.expression, node)
    );
  };

  _acornMap["FunctionDeclaration"] =
  _acornMap["FunctionExpression"] = function (node) {
    var args = [];

    for (var i = 0, len = node.params.length; i < len; ++i) {
      args.push(this._acornNext(node.params[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_FUNC,
      node.id ? node.id.name : null,
      args,
      this._acornNext(node.body, node)
    );
  };

  _acornMap["ForStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_FOR,
      node.init ? this._acornNext(node.init, node) : null,
      node.test ? this._acornNext(node.test, node) : null,
      node.update ? this._acornNext(node.update, node) : null,
      this._acornNext(node.body, node)
    );
  };

  _acornMap["ForInStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_FOR_IN,
      this._acornNext(node.left, node),
      this._acornNext(node.right, node),
      this._acornNext(node.body, node)
    );
  };

  _acornMap["ThrowStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_THROW,
      this._acornNext(node.argument, node)
    );
  };

  _acornMap["TryStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_TRY,
      this._acornNext(node.block, node),
      node.handler ? this._acornNext(node.handler, node) : null,
      node.finalizer ? this._acornNext(node.finalizer, node) : null
    );
  };

  _acornMap["CatchClause"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_CATCH,
      node.param ? node.param.name : null,
      this._acornNext(node.body, node)
    );
  };

  _acornMap["IfStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_IF,
      this._acornNext(node.test, node),
      this._acornNext(node.consequent, node),
      node.alternate ? this._acornNext(node.alternate, node) : null
    );
  };

  _acornMap["UpdateExpression"] = function (node) {
    var token = COMMON.T_POSTUPDATE;
    if (node.prefix) {
      token = COMMON.T_PREUPDATE;
    }
    return COMMON.astCreateNode(token,
      node.operator,
      this._acornNext(node.argument, node)
    );
  };

  _acornMap["SwitchStatement"] = function (node) {
    var cases = [];
    for (var i = 0, len = node.cases.length; i < len; ++i) {
      cases.push(this._acornNext(node.cases[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_SWITCH,
      this._acornNext(node.discriminant, node),
      cases);
  };

  _acornMap["SwitchCase"] = function (node) {
    var body = [];
    for (var i = 0, len = node.consequent.length; i < len; ++i) {
      body.push(this._acornNext(node.consequent[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_SWITCH_CASE,
      node.test ? this._acornNext(node.test, node) : null,
      body);
  };

  _acornMap["Literal"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_LITERAL, node.raw);
  };

  _acornMap["MemberExpression"] = function (node) {
    var token = COMMON.T_ARRAY_MEMBER;
    if (node.property.type === "Identifier") {
      token = COMMON.T_DOT_MEMBER;
    }
    return COMMON.astCreateNode(token,
      this._acornNext(node.object, node),
      this._acornNext(node.property, node)
    );
  };

  _acornMap["NewExpression"] = function (node) {
    var args = [];

    if (node.arguments) {
      for (var i = 0, len = node.arguments.length; i < len; ++i) {
        args.push(this._acornNext(node.arguments[i], node));
      }
    }

    return COMMON.astCreateNode(COMMON.T_NEW,
      this._acornNext(node.callee, node),
      args
    );
  };

  _acornMap["ParenthesizedExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_ORDER,
      this._acornNext(node.expression, node)
    );
  };

  _acornMap["ObjectExpression"] = function (node) {
    var body = [];

    for (var i = 0, len = node.properties.length; i < len; ++i) {
      var prop = node.properties[i];
      if (prop.kind !== 'init') {
        throw new Error('getter/setter not yet supported');
      }
      body.push([
        this._acornNext(prop.key, node),
        this._acornNext(prop.value, node)
      ]);
    }

    return COMMON.astCreateNode(COMMON.T_OBJECT, body);
  };

  _acornMap["Identifier"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_LITERAL, node.name);
  };

  _acornMap["ReturnStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_RETURN,
      node.argument ? this._acornNext(node.argument, node) : null
    );
  };

  _acornMap["SequenceExpression"] = function (node) {
    var body = [];

    for (var i = 0, len = node.expressions.length; i < len; ++i) {
      body.push(this._acornNext(node.expressions[i], node));
    }

    return COMMON.astCreateNode(COMMON.T_SEQ, body);
  };

  _acornMap["ThisExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_THIS);
  };

  _acornMap["UnaryExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_UOP,
      node.operator,
      this._acornNext(node.argument, node)
    );
  };

  _acornMap["VariableDeclaration"] = function (node) {
    var body = [];
    for (var i = 0, len = node.declarations.length; i < len; ++i) {
      var v = node.declarations[i];
      body.push([
        COMMON.astCreateNode(COMMON.T_LITERAL, v.id.name),
        v.init ? this._acornNext(v.init, node) : null
      ]);
    }
    return COMMON.astCreateNode(COMMON.T_VAR, body);
  };

  _acornMap["DoWhileStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_DO_WHILE,
      this._acornNext(node.body, node),
      this._acornNext(node.test, node)
    );
  };

  _acornMap["WhileStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_WHILE,
      this._acornNext(node.test, node),
      this._acornNext(node.body, node)
    );
  };

  _acornMap["WithStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_WITH,
      this._acornNext(node.object, node),
      this._acornNext(node.body, node)
    );
  };

  _acornMap["LabeledStatement"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_LABEL,
      node.label.name,
      this._acornNext(node.body, node)
    );
  };

  _acornMap["ConditionalExpression"] = function (node) {
    return COMMON.astCreateNode(COMMON.T_CONDITIONAL,
      this._acornNext(node.test, node),
      this._acornNext(node.consequent, node),
      this._acornNext(node.alternate, node)
    );
  };

  _acornMap["BlockStatement"] = function (node) {
    var body = [];
    for (var i = 0, len = node.body.length; i < len; ++i) {
      body.push(this._acornNext(node.body[i], node));
    }
    return COMMON.astCreateNode(COMMON.T_BLOCK, body);
  };

  Encoder.prototype._nextDupLit = function (node, dupLiterals) {
    var j, jlen;

    if (node === null) {
      return;
    }

    var nodeDef = COMMON.AST_NODES[node[0]];
    if (!nodeDef) {
      throw new Error('unrecognized token: "' + node[0] + '"');
    }

    for (var i = 0, len = nodeDef.length; i < len; ++i) {
      var type = nodeDef[i];
      var val = COMMON.astGetProp(node, type);
      switch (type) {
      case COMMON.AST_OPERATOR:
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
        this._nextDupLit(val, dupLiterals);
        break;
      case COMMON.AST_BODY:
      case COMMON.AST_ARGUMENTS:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._nextDupLit(val[j], dupLiterals);
        }
        break;
      case COMMON.AST_LITERAL:
        if (!val) {
          break;
        }
        var escval = this._escape(val);
        if (!hasOwnProperty.call(dupLiterals, escval)) {
          dupLiterals[escval] = 1;
        } else {
          dupLiterals[escval]++;
        }
        break;
      case COMMON.AST_OBJDEF:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._nextDupLit(val[j][0], dupLiterals);
          this._nextDupLit(val[j][1], dupLiterals);
        }
        break;
      case COMMON.AST_VARDEF:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._nextDupLit(val[j][0], dupLiterals);
          if (val[j][1]) {
            this._nextDupLit(val[j][1], dupLiterals);
          }
        }
        break;
      default:
        throw new Error('unhandled nodeDef:type: "' + type + '"');
      }
    }
  };

  Encoder.prototype._next = function (node) {
    var j, jlen;

    if (node === null) {
      this._writeToken(COMMON.T_NULL);
      return;
    }

    var nodeDef = COMMON.AST_NODES[node[0]];

    if (!nodeDef) {
      throw new Error('unrecognized token: "' + node[0] + '"');
    }

    if (node[0] !== COMMON.T_LITERAL) {
      this._writeToken(node[0]);
    }

    for (var i = 0, len = nodeDef.length; i < len; ++i) {
      var type = nodeDef[i];
      var val = COMMON.astGetProp(node, type);
      switch (type) {
      case COMMON.AST_OPERATOR:
        this._writeLiteralCode(val);
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
        this._next(val);
        break;
      case COMMON.AST_BODY:
      case COMMON.AST_ARGUMENTS:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._next(val[j]);
        }
        this._writeEnd();
        break;
      case COMMON.AST_LITERAL:
        this._writeLiteral(val);
        break;
      case COMMON.AST_OBJDEF:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._next(val[j][0]);
          this._next(val[j][1]);
        }
        this._writeEnd();
        break;
      case COMMON.AST_VARDEF:
        for (j = 0, jlen = val.length; j < jlen; ++j) {
          this._next(val[j][0]);
          if (val[j][1]) {
            this._next(val[j][1]);
          } else {
            this._writeToken(COMMON.T_NULL);
          }
        }
        this._writeEnd();
        break;
      default:
        throw new Error('unhandled nodeDef:type: "' + type + '"');
      }
    }
  };

  Encoder.prototype._writeToken = function (token) {
    this._code += token;
  };

  Encoder.prototype._writeEnd = function () {
    this._code += COMMON.T_END;
  };

  Encoder.prototype._writeLiteral = function (raw) {
    if (raw === undefined || raw === null) {
      this._writeToken(COMMON.T_LITERAL);
      this._writeToken(COMMON.T_END);
      return;
    }

    var idx = COMMON.LITERAL_CODE_TABLE.indexOf(raw);
    if (idx < 0) {
      var escval = this._escape(raw);
      if (hasOwnProperty.call(this.ids, escval)) {
        this._writeToken(COMMON.T_LITERAL_TABLE);
        this._code += this.ids[escval];
      } else if (escval.length === 1) {
        this._writeToken(COMMON.T_LITERAL_1);
        this._code += escval;
      } else if (escval.length === 2) {
        this._writeToken(COMMON.T_LITERAL_2);
        this._code += escval;
      } else {
        this._writeToken(COMMON.T_LITERAL);
        this._code += escval;
        this._writeEnd();
      }
    } else {
      this._writeToken(COMMON.T_LITERAL_CODE);
      this._code += COMMON.d2r(idx);
    }
  };

  Encoder.prototype._writeLiteralCode = function (raw) {
    var idx = COMMON.LITERAL_CODE_TABLE.indexOf(raw);
    if (idx >= 0) {
      this._code += COMMON.d2r(idx);
    } else {
      throw new Error('unrecognized literal : "' + raw + '"');
    }
  };

  __exports.Encoder = Encoder;

}, this));

