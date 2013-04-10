/*global CodeMirror */
CodeMirror.defineMode('scope', function (config, parserConfig) {
    'use strict';

    var levels = [], fullyParsed;

    //request levels from parserConfig
    function getLevels() {
        //this gets called a lot so check first
        if (parserConfig.hasChanged()) {
            levels = parserConfig.getLevels();
        }
    }

    function parseLine(stream, state) {
        var level;

        //get the latest levels
        getLevels();

        //check for valid levels data
        if (state.index < levels.length) {

            //check stream for 'start of line'
            if (stream.sol()) {
                state.line += 1;
            }

            //get the level information
            level = levels[state.index];

            //check if we need to skip the line
            if (state.line !== level.line) {
                //do nothing
                stream.skipToEnd();
                return null;
            }

            //check if we need to skip ahead within the line
            if ((level.from - 1) > stream.pos) {
                stream.pos += (level.from - stream.pos - 1);
                return null;
            }

            //move stream to scope change
            stream.pos += (level.thru - level.from);

            //step forward in the list
            state.index += 1;

            //return the CSS class to apply
            return 'level' + level.level;
        }
        //do nothing
        stream.skipToEnd();
        return null;
    }

    return {
        startState: function () {
            fullyParsed = false;
            return {
                //source code line
                line: 0,
                //levels array index
                index: 0
            };
        },
        token: function (stream, state) {
            return parseLine(stream, state);
        },
        blankLine: function(state) {
            return parseLine(new CodeMirror.StringStream(''), state);
        }
    };
});