/*global CodeMirror, JSLINT, test*/
(function() {
    'use strict';

    //set up mocks
    var editorChanged = false,
        mockLevels = [],
        hasChangedCallCount = 0,
        getLevelsCallCount = 0,
        scopeMode = {
            'name': 'scope',
            'hasChanged': function () {
                //instrument for tests
                hasChangedCallCount += 1;

                return editorChanged;
            },
            'getLevels': function () {
                //instrument for tests
                getLevelsCallCount += 1;
                //reset flag till next change
                editorChanged = false;
                return mockLevels;
            }
        },
        mode = CodeMirror.getMode({tabSize: 4}, scopeMode);

    //test helpers
    function beforeEach() {
        editorChanged = false;
        hasChangedCallCount = 0;
        getLevelsCallCount = 0;
        mockLevels = [];
    }

    function testOutput(name, levels, tokens) {
        test.mode(name, mode, tokens, function() {
            //set to true so the levels will be looked up
            editorChanged = true;
            mockLevels = levels;
        });
    }

    function testLevels(name, code, output) {
        test.mode(name, mode, output, function() {
            //set to true so the levels will be looked up
            editorChanged = true;
            JSLINT(code);
            mockLevels = JSLINT.color(JSLINT.data());
        });
    }

    function findSingle(str, pos, ch) {
        for (;;) {
            var found = str.indexOf(ch, pos);
            if (found == -1) return null;
            if (str.charAt(found + 1) != ch) return found;
            pos = found + 2;
        }
    }

    var styleName = /[\w&-_]+/g;
    function parseTokens(strs) {
        var tokens = [], plain = "";
        for (var i = 0; i < strs.length; ++i) {
            if (i) plain += "\n";
            var str = strs[i], pos = 0;
            while (pos < str.length) {
                var style = null, text;
                if (str.charAt(pos) == "[" && str.charAt(pos+1) != "[") {
                    styleName.lastIndex = pos + 1;
                    var m = styleName.exec(str);
                    style = m[0].replace(/&/g, " ");
                    var textStart = pos + style.length + 2;
                    var end = findSingle(str, textStart, "]");
                    if (end == null) throw new Error("Unterminated token at " + pos + " in '" + str + "'" + style);
                    text = str.slice(textStart, end);
                    pos = end + 1;
                } else {
                    var end = findSingle(str, pos, "[");
                    if (end == null) end = str.length;
                    text = str.slice(pos, end);
                    pos = end;
                }
                text = text.replace(/\[\[|\]\]/g, function(s) {return s.charAt(0);});
                tokens.push(style, text);
                plain += text;
            }
        }
        return {tokens: tokens, plain: plain};
    }

    test.mode = function(name, mode, tokens, setUp) {
        var data = parseTokens(tokens);
        return test(mode.name + " mode " + name, function() {
            beforeEach();
            if (setUp) {setUp(); }
            return compare(data.plain, data.tokens, mode);
        });
    };

    function compare(text, expected, mode) {

        var expectedOutput = [];
        for (var i = 0; i < expected.length; i += 2) {
            var sty = expected[i];
            if (sty && sty.indexOf(" ")) sty = sty.split(' ').sort().join(' ');
            expectedOutput.push(sty, expected[i + 1]);
        }

        var observedOutput = highlight(text, mode);

        var pass, passStyle = "";
        pass = highlightOutputsEqual(expectedOutput, observedOutput);
        passStyle = pass ? 'mt-pass' : 'mt-fail';

        var s = '';
        if (pass) {
            s += '<div class="mt-test ' + passStyle + '">';
            s +=   '<pre>' + text + '</pre>';
            s +=   '<div class="cm-s-default">';
            s +=   prettyPrintOutputTable(observedOutput);
            s +=   '</div>';
            s += '</div>';
            return s;
        } else {
            s += '<div class="mt-test ' + passStyle + '">';
            s +=   '<pre>' + text + '</pre>';
            s +=   '<div class="cm-s-default">';
            s += 'expected:';
            s +=   prettyPrintOutputTable(expectedOutput);
            s += 'observed:';
            s +=   prettyPrintOutputTable(observedOutput);
            s +=   '</div>';
            s += '</div>';
            throw s;
        }
    }

    /**
     * Emulation of CodeMirror's internal highlight routine for testing. Multi-line
     * input is supported.
     *
     * @param string to highlight
     *
     * @param mode the mode that will do the actual highlighting
     *
     * @return array of [style, token] pairs
     */
    function highlight(string, mode) {
        var state = mode.startState()

        var lines = string.replace(/\r\n/g,'\n').split('\n');
        var st = [], pos = 0;
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i], newLine = true;
            var stream = new CodeMirror.StringStream(line);
            if (line == "" && mode.blankLine) mode.blankLine(state);
            /* Start copied code from CodeMirror.highlight */
            while (!stream.eol()) {
                var style = mode.token(stream, state), substr = stream.current();
                if (style && style.indexOf(" ") > -1) style = style.split(' ').sort().join(' ');

                stream.start = stream.pos;
                if (pos && st[pos-2] == style && !newLine) {
                    st[pos-1] += substr;
                } else if (substr) {
                    st[pos++] = style; st[pos++] = substr;
                }
                // Give up when line is ridiculously long
                if (stream.pos > 5000) {
                    st[pos++] = null; st[pos++] = this.text.slice(stream.pos);
                    break;
                }
                newLine = false;
            }
        }

        return st;
    }

    /**
     * Compare two arrays of output from highlight.
     *
     * @param o1 array of [style, token] pairs
     *
     * @param o2 array of [style, token] pairs
     *
     * @return boolean; true iff outputs equal
     */
    function highlightOutputsEqual(o1, o2) {
        if (o1.length != o2.length) return false;
        for (var i = 0; i < o1.length; ++i)
            if (o1[i] != o2[i]) return false;
        return true;
    }

    /**
     * Print tokens and corresponding styles in a table. Spaces in the token are
     * replaced with 'interpunct' dots (&middot;).
     *
     * @param output array of [style, token] pairs
     *
     * @return html string
     */
    function prettyPrintOutputTable(output) {
        var s = '<table class="mt-output">';
        s += '<tr>';
        for (var i = 0; i < output.length; i += 2) {
            var style = output[i], val = output[i+1];
            s +=
                '<td class="mt-token">' +
                    '<span class="cm-' + String(style).replace(/ +/g, " cm-") + '">' +
                    val.replace(/ /g,'\xb7') +
                    '</span>' +
                    '</td>';
        }
        s += '</tr><tr>';
        for (var i = 0; i < output.length; i += 2) {
            s += '<td class="mt-style"><span>' + output[i] + '</span></td>';
        }
        s += '</table>';
        return s;
    }






    //Finally, we can test things! ... I miss AngularJS

    //basic logic tests
    (function() {
        var message = "should call hasChanged to see if the editor has changed";
        test(mode.name + " " + message, function() {
            beforeEach();
            highlight(" ", mode);
            return eq(hasChangedCallCount, 1, message);
        });
    }());

    (function() {
        var message = "should not call getLevels if the editor has not changed";
        test(mode.name + " " + message, function() {
            beforeEach();
            highlight(" ", mode);
            return eq(getLevelsCallCount, 0, message);
        });
    }());

    (function() {
        var message = "should call getLevels if the editor has changed";
        test(mode.name + " " + message, function() {
            beforeEach();
            editorChanged = true;
            highlight(" ", mode);
            return eq(getLevelsCallCount, 1, message);
        });
    }());

    /*
     * output tests are registered by calling testOutput(testName, levels,
     * tokens), where levels is the array returned by JSLINT.color, and
     * tokens is an array of lines that make up the test.
     *
     * These lines are strings, in which styled stretches of code are
     * enclosed in brackets `[]`, and prefixed by their style. For
     * example, `[keyword if]`.
     */

    testOutput("should apply the class name based on the level array",
        [{"line": 1, "level": 1, "from": 1, "thru": 14}],
        ["[level1 var test = 0;]"]);

    testOutput("should walk though the levels array",
        [
            {"line": 1, "level": 10, "from": 1, "thru": 4},
            {"line": 1, "level": 20, "from": 4, "thru": 14}
        ],
        ["[level10 var][level20  test = 1;]"]);

    testOutput("should handle gaps in scope change",
        [
            {"line": 1, "level": 200, "from": 1, "thru": 4},
            {"line": 1, "level": 300, "from": 6, "thru": 15}
        ],
        ["[level200 var]  [level300 test = 2;]"]);

    testOutput("should properly tokenize MONAD",
        [
            {"line": 1, "level": 1, "from": 1, "thru": 9},
            {"line": 1, "level": 0, "from": 10, "thru": 15},
            {"line": 1, "level": 1, "from": 15, "thru": 19},
            {"line": 2, "level": 1, "from": 5, "thru": 18},
            {"line": 3, "level": 1, "from": 5, "thru": 11},
            {"line": 3, "level": 2, "from": 12, "thru": 20},
            {"line": 3, "level": 1, "from": 21, "thru": 25},
            {"line": 3, "level": 2, "from": 25, "thru": 34},
            {"line": 4, "level": 2, "from": 9, "thru": 20},
            {"line": 4, "level": 0, "from": 21, "thru": 27},
            {"line": 4, "level": 2, "from": 27, "thru": 41},
            {"line": 5, "level": 2, "from": 9, "thru": 21},
            {"line": 5, "level": 3, "from": 22, "thru": 39},
            {"line": 6, "level": 3, "from": 13, "thru": 25},
            {"line": 6, "level": 2, "from": 25, "thru": 30},
            {"line": 6, "level": 3, "from": 30, "thru": 32},
            {"line": 7, "level": 3, "from": 9, "thru": 11},
            {"line": 8, "level": 2, "from": 9, "thru": 22},
            {"line": 9, "level": 2, "from": 5, "thru": 7},
            {"line": 10, "level": 1, "from": 1, "thru": 2}
        ],
        [
            "[level1 function] [level0 MONAD][level1 () {]",
            "    [level1\"use strict\";]",
            "    [level1 return] [level2 function] [level1 unit][level2 (value) {]",
            "        [level2 var monad =] [level0 Object][level2 .create(null);]",
            "        [level2 monad.bind =] [level3 function (func) {]",
            "            [level3 return func(][level2 value][level3 );]",
            "        [level3 };]",
            "        [level2 return monad;]",
            "    [level2 };]",
            "[level1 }]"
        ]
    );

    //GitHub Issue #4 (bug in JSLINT)
    testLevels("should properly parse hoisted variables",
        [   //input
            "var sayHi = function() {",
            "    console.log(late);",
            "};",
            "var late = 'hi';"
        ],
        [   //expected output
            "[level0 var sayHi =] [level1 function() {]",
            "    [level1 console.log(][level0 late][level1 );]",
            "[level1 };]",
            "[level0 var late = 'hi';]"
        ]
    );

    //GitHub Issue #3 (bug FIXED in JSLINT)
    testLevels("should properly parse named function expressions",
        [   //input
            "var foo = function bar() {",
            "    console.log('baz');",
            "};"
        ],
        [   //expected output
            "[level0 var foo =] [level1 function bar() {]",
            "    [level1 console.log('baz');]",
            "[level1 };]"
        ]
    );

    // GitHub Issue #2 (bug in JSLINT)
    testLevels("should match variables more than once per scope",
        [   //input
            "var x = 10;",
            "function level0() {",
            "    var a = x,",
            "        b = x;",
            "    return function level1() {",
            "        return x + x;",
            "    };",
            "}"
        ],
        [   //expected output
            "[level0 var x = 10;]",
            "[level1 function] [level0 level0][level1 () {]",
            "    [level1 var a =] [level0 x][level1 ,]",
            "        [level1 b =] [level0 x][level1 ;]",
            "    [level1 return] [level2 function] [level1 level1][level2 () {]",
            "        [level2 return] [level0 x] [level2 +] [level0 x][level2 ;]",
            "    [level2 };]",
            "[level1 }]"
        ]
    );

}());