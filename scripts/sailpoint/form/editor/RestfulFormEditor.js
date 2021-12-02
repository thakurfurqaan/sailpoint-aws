/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class extends FormEditorWindow and allows creation and editing of Form Objects
 * from Centralize Form Location. It is associated with applications and roles.
 */
Ext.define('SailPoint.form.editor.RestfulFormEditorWindow', {
    extend : 'SailPoint.form.editor.FormEditorWindow',

    closeAction: 'destroy',

    createFormEditor : function() {
        this.formEditor = new SailPoint.form.editor.RestfulFormEditor({
            id : 'formEditor',
            beanType : this.beanType,
            formId : this.formId,
            usage: this.usage,
            window : this,
            border: false
        });
    },

    exit: function() {
        this.close();
    }
});

/**
 * Overrides some of the form field editor component to get the Application/Role
 * form editor that work within the confines of the centralize 'form'.
 */
Ext.define('SailPoint.form.editor.RestfulFormEditor', {
    extend : 'SailPoint.form.editor.FormEditor',

    formId: null,

    formObject: null,

    originalCount: null,

    initComponent: function() {
        this.callParent(arguments);
    },

    /**
     * Sends the JSON form to restful endpoint.
     */
    submitChanges: function() {
        var me = this,
            isSaveSuccess = false,
            formJSON = {
                name: this.formName.getValue(),
                description: this.formDescription.getValue(),
                owner: this.formOwnerSource,
                ownerType: this.formOwnerMethod,
                formType: this.beanType,
                application: (this.requireApplication) ? this.applicationSuggest.getValue() : null,

                // Save extended attributes of a form
                attributes: this.formObject.attributes,
                sections: this.sectionArray
            },
            url = "",
            params = {
                json: Ext.JSON.encode(formJSON)
            };

        // Create params and url for Edit Form
        if (this.formId) {
            url = "/" + SailPoint.Utils.encodeRestUriComponent(this.formId);
            params['formId'] = this.formId;
        }

        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/form' + url),
            method: !this.formId ? 'POST' : 'PUT',
            params: params,
            success: function(response) {
                var res = Ext.JSON.decode(response.responseText);
                if(res.errors) {
                    // if error occurred show the errors on status bar
                    var errors = ['#{msgs.form_save_error} ' + res.errors];
                    me.displayError(true, errors);
                } else {
                    // if success close the window
                    me.window.destroy();
                    // Reload the Grid here
                    var formGrid = Ext.getCmp('formGrid');
                    formGrid.getStore().load();
                    isSaveSuccess = true;
                }
            },
            failure: function(response) {
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
        return isSaveSuccess;
    },

    /**
     * Override parent(FormEditor) to avoid call to parents method.
     * This function is called on before show event listener of FormEditorWindow and
     * load Form details on the Form Editor Panel.
     */
    load : function() {
        var me = this;

        if (me.formId) {
            var url = "/" + SailPoint.Utils.encodeRestUriComponent(me.formId);
            Ext.Ajax.request({
                scope: me,
                url: SailPoint.getRelativeUrl('/rest/form' + url),
                method: 'GET',
                params: {formId:me.formId},
                success: function(result, response) {
                    var res = Ext.JSON.decode(result.responseText),
                    formData = JSON.parse(res);

                    if (formData.isAvailable) {
                        this.formObject = formData.form;

                        this.loadOwnerField(this.formObject);
                        this.loadFormAttributes(this.formObject);
                        this.getApplication(this.formObject);

                        this.formName.setValue(this.formObject.name);
                        this.formName.clearInvalid();

                        this.formDescription.setValue(this.formObject.description);

                        // Initialize tree store
                        this.formItemStore.setRootNode(this.formObject.root);

                        // Count of the number of nodes in the form item list
                        this.setFormItemsCount();
                    } else {
                        this.window.destroy();
                        Ext.MessageBox.show({
                            title:'#{msgs.err_dialog_title}',
                            msg: '#{msgs.form_display_error}',
                            buttons: Ext.MessageBox.OK,
                            icon: Ext.MessageBox.ERROR
                        });
                   }
                },
                failure: function(result, response) {
                    SailPoint.FATAL_ERR_ALERT.call(this);
                }
            });
        } else {
            me.getApplication();
        }
    }
});
