/*global CodeMirror */
CodeMirror.defineMode('scope', function (config, parserConfig) {
    'use strict';

    var levels = [], fullyParsed;

    //lint the code to get the scope information
    function getLevels() {
        //this gets called a lot so check first
        if (parserConfig.hasChanged()) {
            levels = parserConfig.getLevels();
        }
    }

    //get the level information
    getLevels();

    return {
        startState: function () {
            fullyParsed = false;

            return {
                line: 0,
                index: 0
            };
        },
        token: function (stream, state) {
            var level, next;

            //get the latest levels
            getLevels();

            //check for valid levels data
            if (state.index < levels.length) {

                //check stream for 'start of line'
                if (stream.sol()) {
                    if (!fullyParsed) {
                        state.line += 1;
                    }
                }

                //get the level information
                level = levels[state.index];

                //check if we need to skip ahead
                if((level.from - 1) > stream.pos) {
                    stream.pos += (level.from - stream.pos -1);
                    return null;
                }

                //move stream to scope change
                stream.pos += (level.thru - level.from);

                //check if this is the last line
                if (state.index == levels.length) {
                    fullyParsed = true;
                }
                else
                {
                    //step forward in the list
                    state.index += 1;
                }

                //return the CSS class to apply
                return 'level' + level.level;
            }
            //handle race conditions
            stream.skipToEnd();
            return null;
        }
    };
});