/*global document, JSLINT, CodeMirror, location*/
(function (doc, lint, cm) {
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
    editor = cm.fromTextArea(doc.getElementById('editor'), { 'theme': 'ambiance', 'mode': scopeMode });

    //lint the code in the editor
    function lintCode() {
        lint(editor.getValue());
        editorChanged = true;
    }

    //lint code when it changes
    editor.on('change', lintCode);


    //Shouldn't need the code below this line, it's just for this demo

    function loadSample(id) {
        editor.setValue(doc.getElementById(id.substr(id.lastIndexOf('#') + 1)).innerHTML);
    }

    //load the default code sample
    loadSample(location.hash || 'minimonad');

    //support changing modes
    function selectMode(mode) {
        if (mode === 'pro') {
            lintCode();
            editor.setOption('mode', scopeMode);
        } else {
            editor.setOption('mode', 'javascript');
        }
    }

    //bind mode change event handlers
    doc.getElementById('grownup').onclick = function () {
        selectMode(this.value);
    };
    doc.getElementById('n00b').onclick = function () {
        selectMode(this.value);
    };

    //bind code sample handlers
    doc.getElementById('mini').onclick = function () {
        loadSample(this.href);
    };
    doc.getElementById('full').onclick = function () {
        loadSample(this.href);
    };
    doc.getElementById('eight').onclick = function () {
        loadSample(this.href);
    };
}(document, JSLINT, CodeMirror));