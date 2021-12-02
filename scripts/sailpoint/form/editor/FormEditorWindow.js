/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.form.FormEditorWindow
* @extends Ext.Window
* This class creates a Form Editor Panel on top of a Form Editor window.
*/
Ext.ns('SailPoint',
       'SailPoint.form',
       'SailPoint.form.editor',
       'SailPoint.form.editor.FormEditorWindow');

SailPoint.form.editor.FormEditor.EditorWindow = null;

SailPoint.form.editor.FormEditor.ShowEditorWindow = function(beanType, usage) {

    if(!SailPoint.form.editor.FormEditor.EditorWindow) {
        SailPoint.form.editor.FormEditor.EditorWindow = new SailPoint.form.editor.FormEditorWindow ({
            beanType: beanType,
            usage: usage
        });
    } else {
        SailPoint.form.editor.FormEditor.EditorWindow.setUsage(usage);
    }

    SailPoint.form.editor.FormEditor.EditorWindow.show();
};

Ext.define('SailPoint.form.editor.FormEditorWindow', {
    extend : 'Ext.Window',

    id: 'formEditorWindow',

    formEditor: null,

    beanType: null,

    usage: null,

    closeAction: 'hide',

    plain: true,

    autoScroll: false,

    // Form editor window width relative to browser width
    width: Ext.getBody().getViewSize().width - 366,

    // Form editor window height relative to browser height
    height: Ext.getBody().getViewSize().height,

    // On escape button press call closeForm method 
    onEsc : function() {
        this.formEditor.closeForm();
    },

    createFormEditor : function() {
        this.formEditor = Ext.create('SailPoint.form.editor.FormEditor', {
            id: 'formEditor',
            beanType: this.beanType,
            usage: this.usage,
            window : this
        });
    },

    initComponent : function() {

        this.createFormEditor();

        Ext.applyIf(this, {
            header: false,
            layout: 'fit',
            modal: true,
            bodyCls: 'FormEditorWindowBody'
        });

        this.items = [ this.formEditor ];

        this.on('beforeshow', function() {
            this.center();
            this.formEditor.load();
        });

        this.callParent(arguments);
    },

    setUsage: function(usage) {
        this.usage = usage;
        if (this.formEditor) {
            this.formEditor.setUsage(usage);
        }
    },

    exit: function() {
        this.hide();
    }
});
