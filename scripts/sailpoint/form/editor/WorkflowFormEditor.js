/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class extends FormEditorWindow and allows
 * creation and editing of Form Objects from inline and
 * Centralize Form Location. It is associated with workflow's.
 */
Ext.define('SailPoint.form.editor.WorkflowFormEditorWindow', {
    extend : 'SailPoint.form.editor.FormEditorWindow',

    // Window should be destroyed on close.
    closeAction: 'destroy',
    exit: function() {
        this.close();
    },

    createFormEditor : function() {
        this.formEditor = new SailPoint.form.editor.WorkflowFormEditor({
            id : 'formEditor',
            beanType : this.beanType,
            usage: this.usage,
            window : this
        });
    }
});

/**
 * Overrides some of the template field editor component to get the provisioning
 * policy editor to work within the confines of the workflow editor
 */
Ext.define('SailPoint.form.editor.WorkflowFormEditor', {
    extend: 'SailPoint.form.editor.FormEditor',
    requires: ['SailPoint.form.editor.ButtonEditor'],
    uses: ['SailPoint.form.editor.FormItemHelper',
           'SailPoint.form.editor.ApprovalPanel'],

    fieldFormPanelTitle : '#{msgs.form_editor_edit_fields}',

    buttonForm : null,

    addFormButton: null,

    buttonNode: null,

    stepId : null,

    stepObj : null,

    referenceables: null,

    callablesType : 'Action',

    approvalPanel : null,

    formObject: null,

    originalCount: null,

    initComponent : function() {
        if (this.usage !== 'Standalone') {
            // Referenceables variables resolves like this -
            // window - Class=SailPoint.form.editor.WorkflowFormEditorWindow id=editorWindow
            // panel - Class=SailPoint.WorkflowStepPanel id=workflowDesigner
            // parent - Class=SailPoint.WorkflowDesigner id=workflowTabbedPanel
            // editor - Class=SailPoint.WorkflowEditor id=workflowPanel
            this.approvalPanel = new SailPoint.form.editor.ApprovalPanel({referenceables:
                                this.window.panel.parent.editor.workflow.variables, parentObject: this, windowWidth: this.window.width});
            this.approvalPanel.hide();
        }
        this.addFormButton = new Ext.Button({
            text: '#{msgs.form_editor_add_button}',
            id: 'addFormButtonsBtn',
            cls: 'secondaryBtn',
            margin: '3 4 5 0',
            columnWidth : 0.167
        });

        // on click
        this.addFormButton.on('click', this.addButton, this);

        // Instantiate button form for edit
        this.buttonEditor = new SailPoint.form.editor.ButtonEditor({
            formEditor: this
        });

        this.callParent(arguments);

        /* Overrides the FormEditor's init function to require the name on the form */
        this.formName.allowBlank = false;
    },

    /**
     * Set workflow step data
     * @param {string} stepID The id of workflow step
     * @param {Object} step The step data
     */
    setStep : function(stepID, step) {
        var me = this;

        me.stepID = stepID;
        me.stepObj = step;
    },

    /**
     * Loads the form data to form editor.
     */
    load : function() {
        var me = this,
            cloneOfItems;

        if (me.stepObj) {
            me.formObject = me.stepObj.form;

            me.formName.clearInvalid();
            me.formName.setValue(me.formObject.name);
            me.formDescription.setValue(me.formObject.description);

            // Load approval details
            if (me.usage !== 'Standalone') {
                me.approvalPanel.formSend.setValue(me.formObject.sendVal);
                me.approvalPanel.formReturn.setValue(me.formObject.returnVal);
                me.setOwnerType(me.formObject.ownerMethod, me.formObject.ownerSource);
                me.loadFormAttributes(me.formObject);
            }

            if (me.formObject.items) {
                // Poor man's deep object cloning.
                // This nonsense is needed due to tree-store’s
                // setRootNode function murders its argument data.
                cloneOfItems = JSON.parse(JSON.stringify(me.formObject.items));

                me.formItemStore.setRootNode(cloneOfItems);

                // Count of the number of nodes in the form item list
                me.setFormItemsCount();
            }
        }
    },

    /**
     * Set owner details for inline workflow form
     */
    setOwnerType : function(ownerType, owner) {
        if(!ownerType) {
            ownerType = SailPoint.form.editor.FormEditor.TYPE_STRING;
        }

        this.approvalPanel.approvalPanelCombo.setValue(ownerType);

        if (ownerType == SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
            this.approvalPanel.formOwnerScript.setValue(owner);
        } else if (ownerType == SailPoint.form.editor.FormEditor.TYPE_RULE) {
            this.approvalPanel.formOwnerRule.setValue(owner);
        } else if (ownerType == SailPoint.form.editor.FormEditor.TYPE_STRING) {
            this.approvalPanel.stringComponent.setValue(owner);
        } else if (ownerType == SailPoint.form.editor.FormEditor.TYPE_REFERENCE) {
            this.approvalPanel.reference.setValue(owner);
        } else if (ownerType == SailPoint.form.editor.FormEditor.TYPE_CALL) {
            this.approvalPanel.callables.setValue(owner);
        }
    },

    /**
     * Submit the form data
     */
    submitChanges : function() {
        var me = this,
            formObj;

        // Initialize the stepObj.form.id only after save is clicked.
        // This field is used in the WorkflowDesigner.js to determine
        // if a form has been added to the step.
        if (!me.stepObj.form.id) {
            me.stepObj.form = new SailPoint.WorkflowForm();
            me.stepObj.form.id = randomUUID();
        }

        formObj = me.stepObj.form;

        formObj.name = me.formName.getValue();
        formObj.description = me.formDescription.getValue();

        // Save extended attributes of a form
        formObj.attributes = me.formObject.attributes;

        // Set form items with the clone
        formObj.items = me.cloneOfItems;

        // Set the approval components data
        if (this.usage !== 'Standalone') {
            formObj.sendVal = me.approvalPanel.formSend.getValue();
            formObj.returnVal = me.approvalPanel.formReturn.getValue();
            me.updateOwnerField(formObj);
        }

        // Remove the FormRef for an embedded form
        formObj.formRefId = null;

        // A vanilla form item array.
        // It don't have tree structure
        formObj.sections = me.sectionArray;
        formObj.buttons = me.buttonArray;

        // make worflow dirty
        me.window.panel.parent.editor.workflow.markDirty();

        return true;
    },

    /**
     * Update owner details to form object 
     */
    updateOwnerField : function(formObj) {
        if(this.approvalPanel.approvalPanelCombo.getValue()) {
            formObj.ownerMethod = this.approvalPanel.approvalPanelCombo.getValue();

            if(formObj.ownerMethod === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                formObj.ownerSource = this.approvalPanel.formOwnerScript.getValue();
            } else if(formObj.ownerMethod === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                formObj.ownerSource = this.approvalPanel.formOwnerRule.getDisplayValue();
            } else if(formObj.ownerMethod === SailPoint.form.editor.FormEditor.TYPE_STRING) {
                formObj.ownerSource = this.approvalPanel.stringComponent.getValue();
            } else if(formObj.ownerMethod === SailPoint.form.editor.FormEditor.TYPE_REFERENCE) {
                formObj.ownerSource = this.approvalPanel.reference.getValue();
            } else if(formObj.ownerMethod === SailPoint.form.editor.FormEditor.TYPE_CALL) {
                formObj.ownerSource = this.approvalPanel.callables.getValue();
            }
        }
    },

    /**
     * Add new button and show it's properties for edit
     */
    addButton : function() {
        var me = this,
            rootNode = me.formItemPanel.getRootNode(),
            hasNotApplied;

        // Instantiate helper - lazy loading is preferred
        var formItemHelper = new SailPoint.form.editor.FormItemHelper({
            nodeType: 'button', // Crate a node of type button
            treeView: me.formItemPanel.getView(),
            parentNode: rootNode
        });

        // Check for edit node if exists
        var editNode = formItemHelper.getEditedNode(rootNode);

        if(editNode) {
            var formItemEditor = formItemHelper.getFormItemEditor(me, editNode);
            hasNotApplied = formItemHelper.hasNotAppliedChanges(formItemEditor, editNode);
            if(hasNotApplied) {
                Ext.Msg.confirm('#{msgs.form_item_edit_confirm_title}',
                    '#{msgs.form_item_edit_confirm_msg}',
                        function(btnText) {
                            if ('yes' === btnText) {
                                me.buttonEditor.initButton(formItemHelper);
                            }
                        }
                );
                return false;
            }
        }
        if(!editNode || !hasNotApplied) {
            me.buttonEditor.initButton(formItemHelper);
        }
    },

    /**
     * Loads button properties
     * @param {Ext.data.Model} record
     */
    editButton : function(record) {
        var me  = this;

        me.buttonEditor.loadDefaults(record);
        me.buttonEditor.load();
    }
});
