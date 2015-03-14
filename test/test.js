
(function (__runner) {

  if (typeof define == 'function' && define.amd) {
    define(['chai', '../lib/encoder', '../lib/decoder'],
        function (chai, enc, dec) {
      __runner(chai, enc.Encoder, dec.Decoder);
    });
  } else if (typeof exports != 'undefined') {
    __runner(
      require('chai'),
      require('../lib/encoder').Encoder,
      require('../lib/decoder').Decoder
    );
  } else {
    __runner(chai, SMJS.Encoder, SMJS.Decoder);
  }

}(function (chai, Encoder, Decoder) {
  'use strict';

  var assert = chai.assert;
  var expect = chai.expect;

  var enc, dec;

  describe("unit suite", function () {

    function eTest(code, exp) {
      /*jshint evil:true */
      var ex = {code: code};
      try {
        var encoded = ex.encoded = enc.encodeString(code);
        var recoded = ex.recoded = dec.decodeString(encoded);
        var result = (new Function(recoded))();
        if (typeof exp == 'function') {
          exp(result);
        } else {
          expect(result).equals(exp);
        }
      } catch (e) {
        ex.inner = {message: e.toString()};
        if (e.stack) {
          ex.inner.stack = e.stack.split('\n');
        }
        throw new Error(JSON.stringify(ex, null, '  '));
      }
    }

    beforeEach(function () {
      enc = new Encoder;
      dec = new Decoder;
    });

    describe("sanity", function () {

      it('can encode', function () {
        expect(enc.encodeString('"a"')).equals("CJS0El%22a%22'");
      });

      it('can decode', function () {
        expect(dec.decodeString("CJS0El%22a%22'")).equals('"a";');
      });

      it('ignores whitespace', function () {
        var code = "+C J\tS\r0\nE+l %\t2\r2\na+% 2\r2\n'\t";
        expect(dec.decodeString(code)).equals('"a";');
      });

    });

    describe("tokens", function () {

      describe("T_ASSIGN", function () {
        it('basic', function () {
          eTest('var a = "worked"; return a;', 'worked');
        });
      });

      describe("T_ARRAY", function () {
        it('basic', function () {
          eTest('var a = [1, "worked", 2]; return a[1];', 'worked');
        });

        it('empty', function () {
          eTest('var a = []; return a.length === 0 ? "worked" : "bad"',
            'worked');
        });

        it('join', function () {
          eTest('return ["wo", "rk", "ed"].join("")', 'worked');
        });
      });

      describe("T_BOP", function () {
        it('basic', function () {
          eTest('return "wor" + "ked";', 'worked');
        });

        it('order', function () {
          eTest('return (1 + 1) * 2;', 4);
        });

        it('logical op', function () {
          eTest('return undefined || "worked";', 'worked');
        });
      });

      describe("T_BREAK", function () {
        it('basic', function () {
          eTest('a: { break a; return "bad"; } return "worked";',
            'worked');
        });
      });

      describe("T_CALL", function () {
        it('basic', function () {
          eTest('function a() { return "worked"; }\n' +
            'return a();',
            'worked');
        });
      });

      describe("T_CONTINUE", function () {
        it('basic', function () {
          eTest('var a = "workedabc";\n' +
            'b: while (true) {\n' +
            ' a = a.substr(0, a.length - 1);\n' +
            ' if (a !== "worked") continue b;\n' +
            ' return a;\n' +
            '}',
            'worked');
        });
      });

      describe("T_EXPR", function () {
        it('basic', function () {
          eTest('"a"; return "worked";', 'worked');
        });
      });

      describe("T_FUNC", function () {
        it('basic', function () {
          eTest('function a(a) { return a; } return a("worked");',
            'worked');
        });

        it('anonymous', function () {
          eTest('var a = function (a) { return a; }; return a("worked");',
            'worked');
        });

        it('immediate exec', function () {
          eTest('return (function () { return "worked"; })();',
            'worked');
        });
      });

      describe("T_FOR", function () {
        it('basic', function () {
          eTest('for(;false;);return "worked";', 'worked');
        });
      });

      describe("T_FOR_IN", function () {
        it('basic', function () {
          eTest('var out = "";\n' +
            'for (var i in {"wo":1, "rk":1, "ed":1}) {\n' +
            '  out += i;\n' +
            '}\n' +
            'return out;',
            'worked');
        });
      });

      describe("T_TRY / T_THROW / T_CATCH", function () {
        it('basic', function () {
          eTest(
            'var out = "wo";\n' +
            'try {\n' +
            'throw "rk";\n' +
            '} catch (e) {\n' +
            'out += e;\n' +
            '} finally {\n' +
            'return out + "ed"\n' +
            '}\n' +
            'return "bad";',
            'worked');
        });
      });

      describe("T_IF", function () {
        it('if', function () {
          eTest('if(true){return "worked";}', 'worked');
        });

        it('else', function () {
          eTest('if(false){return "no";}else{return "worked";}',
            'worked');
        });

        it('else if', function () {
          eTest('if(false){return "no";}else if(true){return "worked";}',
            'worked');
        });

        it('no block if', function () {
          // if semi-colon insertion goes wrong, `o = "worked"` might
          // become part of `if (false)` and not be executed.
          eTest('var o; if (false); o = "worked"; return o;', 'worked');
        });

        it('no block else', function () {
          eTest('if (false) return "bad"; else return "worked";',
            'worked');
        });
      });

      describe("T_PREUPDATE", function () {
        it('basic', function () {
          eTest('var a = 3; ++a; return ++a;', 5);
        });
      });

      describe("T_POSTUPDATE", function () {
        it('basic', function () {
          eTest('var a = 3; a++; return a++;', 4);
        });
      });

      describe("T_LITERAL", function () {
        it('string', function () {
          eTest('return "worked";', 'worked');
        });

        it('integer', function () {
          eTest('return 42;', 42);
        });

        it('float', function () {
          eTest('return 3.14159', 3.14159);
        });

        it('true', function () {
          eTest('return true;', true);
        });

        it('false', function () {
          eTest('return false;', false);
        });

        it('undefined', function () {
          eTest('return undefined;', undefined);
        });

        it('null', function () {
          eTest('return null;', null);
        });

        it('NaN', function () {
          eTest('return NaN;', function (result) {
            assert(isNaN(result), "Expecting: NaN, got: '" + result + "'");
          });
        });
      });

      describe("T_MEMBER", function () {
        it('basic', function () {
          eTest('var a = {b:{c:{d:"worked"}}}; return a.b.c.d;', 'worked');
        });
      });

      describe("T_NEW", function () {
        it('basic', function () {
          eTest(
            'function A(b) {this.a = b;}\n' +
            'return (new A("worked")).a;',
            'worked');
        });

        it('empty new', function () {
          eTest(
            'function A() {this.a = "worked";}\n' +
            'return (new A).a;',
            'worked');
        });

        it('immediate new', function () {
          eTest(
            'return (new (function (b) {this.a = b;})("worked")).a;',
            'worked');
        });
      });

      describe("T_OBJECT", function () {
        it('basic', function () {
          eTest('return ({a: "bad", b:"worked"}).b;', 'worked');
        });
      });

      describe("T_SEQ", function () {
        it('basic', function () {
          eTest('var a, b; a = 0, b = "worked"; return b;', 'worked');
        });
      });

      describe.skip("T_TABLE", function () {
        it('full table', function () {
          var str = 'var ';
          for (var i = 0; i < 70 * 70 * 3; ++i) {
            str += 'longname' + i + ', ';
          }
          str += 'finalname = "worked";';
          eTest(str + 'return finalname;', 'worked');
        });
      });

      describe("T_THIS", function () {
        it('basic', function () {
          eTest('function r() {return this;} if (r() === this)' +
            '{ return "worked"; }',
            'worked');
        });
      });

      describe("T_UOP", function () {
        it('basic', function () {
          eTest('return typeof "worked";', 'string');
        });
      });

      describe("T_VAR", function () {
        it('one var', function () {
          eTest('var a = "worked"; return a;', 'worked');
        });

        it('multi var', function () {
          eTest('var a = 1, b = "worked", c; return c || b;', 'worked');
        });
      });

      describe("T_WHILE", function () {
        it('basic', function () {
          eTest('while (false) { break; } return "worked";', 'worked');
        });
      });

      describe("T_WITH", function () {
        it('basic', function () {
          eTest('with ("worked") { return length; }', 6);
        });
      });

      describe("T_LABEL", function () {
        it('basic', function () {
          eTest('one: { two: { three: { break one; }' +
            'return "bad"; } return "bad"; }' +
            'return "worked";',
            'worked');
        });
      });

      describe("T_CONDITIONAL", function () {
        it('basic', function () {
          eTest('return true ? false ? "bad" : "worked" : "bad"',
            'worked');
        });
      });

      describe("T_EMPTY", function () {
        it('basic', function () {
          eTest(';;return "worked";', 'worked');
        });
      });

      describe("T_BLOCK", function () {
        it('basic', function () {
          eTest('{}return "worked";', 'worked');
        });
      });

    });

    describe('regression issues', function () {

      // id table was finding toString because of an "in" check
      it('toString in id table', function () {
        eTest('return "worked".toString()', 'worked');
      });

    });

  });

}));

