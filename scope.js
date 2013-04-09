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

    //get the level information
    getLevels();

    return {
        startState: function () {
            //reset state
            fullyParsed = false;
            return {
                line: 0,
                index: 0
            };
        },
        token: function (stream, state) {
            var level;

            //get the latest levels
            getLevels();

            //check for valid levels data
            if (state.index < levels.length) {

                //get the level information
                level = levels[state.index];

                //check if we need to skip ahead
                if((level.from - 1) > stream.pos) {
                    stream.pos += (level.from - stream.pos -1);
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
    };
});