/*global jQuery, JSLINT, CodeMirror, location*/
(function ($, lint, cm) {
    'use strict';

    var editor,
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
    editor = cm($('#editor')[0], { 'theme': 'ambiance', 'mode': scopeMode });

    //lint the code in the editor
    function lintCode() {
        lint(editor.getValue());
        editorChanged = true;
    }

    //lint code when it changes
    editor.on('change', lintCode);


    //Shouldn't need the code below this line, it's just for this demo

    function loadSample(id) {
        var sample = $('#' + id.substr(id.lastIndexOf('#') + 1));
        editor.setValue(sample.text());
    }

    //load the default code sample
    $(function() {
        loadSample(location.hash || 'depinject');
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
    $('#toggleMode').on('click', 'button', function() {
        selectMode($(this).data('mode'));
    });

    //bind code sample change handler
    $('#samples').on('click', 'a', function() {
        loadSample(this.href);
    });

}(jQuery, JSLINT, CodeMirror));