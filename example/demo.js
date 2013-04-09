/*global jQuery, JSLINT, CodeMirror, location*/
(function ($, lint, cm) {
    'use strict';

    var editor, legendHTML,
        editorChanged = false,
        scopeMode = {
            'name': 'scope',
            'hasChanged': function () {
                return editorChanged;
            },
            'getLevels': function () {
                //check that JSLINT has been called
                if (lint.hasOwnProperty('errors')) {
                    editorChanged = false;
                    return lint.color(lint.data());
                }
            }
        };

    //set up code editor
    editor = cm.fromTextArea($('#editor')[0], { 'theme': 'ambiance', 'mode': scopeMode });

    //lint the code in the editor
    function lintCode() {
        lint(editor.getValue());
        editorChanged = true;
    }

    //lint code when it changes
    editor.on('change', lintCode);


    //Shouldn't need the code below this line, it's just for this demo

    function loadSample(id) {
        var sample = $('#'+id.substr(id.lastIndexOf('#') + 1));
        editor.setValue(sample.text());
    }

    //load the default code sample
    $(function() {
        loadSample(location.hash || 'minimonad');
    });

    //support changing modes
    function selectMode(mode) {
        if (mode === 'pro') {
            lintCode();
            editor.setOption('mode', scopeMode);
        } else {
            editor.setOption('mode', 'javascript');
        }
    }

    //bind mode change event handler
    $("#toggleMode").on("click", "button", function(e){
        selectMode($(this).data("mode"));
    });

    //bind code sample change handler
    $("#samples").on("click", "a", function(){
        loadSample(this.href);
    });

    //setup legend popover
    legendHTML = ['<span class="legend">',
        '<span class="level0">Level 0</span>',
        '<span class="level1">Level 1</span>',
        '<span class="level2">Level 2</span>',
        '<span class="level3">Level 3</span>',
        '<span class="level4">Level 4</span>',
        '<span class="level5">Level 5</span>',
        '<span class="level6">Level 6</span>',
        '<span class="level7">Level 7</span>',
        '<span class="level8">Level 8</span>',
        '<span class="level9">Level 9</span>',
        '</span>'];
    $('i').popover({ html : true, content: legendHTML.join('\n') });

}(jQuery, JSLINT, CodeMirror));