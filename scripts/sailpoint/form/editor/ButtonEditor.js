/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component that allows editing of button attributes
 *
 * @author rahul.borate
 */

Ext.define('SailPoint.form.editor.ButtonEditor', {
    extend: 'SailPoint.form.editor.FormItemEditor',
    requires: ['SailPoint.form.editor.DivisionPanel',
        'SailPoint.form.editor.AttributeFactory'
    ],

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////
    ACTIONS_TO_EXCLUDE: 'actionsToExclude',

    READ_ACTION_REST: '/rest/form/buttons',

    BUTTON: 'button',

    /////////////////////////////////////////////
    // functions                               //
    /////////////////////////////////////////////
    initComponent : function() {
        var me = this,
            actionStore,
            attrFactory,
            buttonSettingsPanel;

        actionStore = SailPoint.Store.createRestStore({
            fields: ['name', 'value'],
            autoLoad: true,
            method: 'POST',
            filterOnLoad: false,
            url: SailPoint.getRelativeUrl(this.READ_ACTION_REST)
        });

        // Initialize attribute factory
        attrFactory = new SailPoint.form.editor.AttributeFactory({
            // keep action store global
            actionStore: actionStore
        });

        // Settings panel
        buttonSettingsPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'buttonSettingsPanel',
            title: '#{msgs.field_editor_setting_panel}',
            formItemEditor: me,
            formEditor: me.formEditor,
        });

        // Insert component's to the Settings panel
        buttonSettingsPanel.insertComponent(attrFactory.getButtonAttributes());

        Ext.apply(me, {
            id: 'buttonEditor',
            autoScroll: true,
            actionStore: actionStore,
            items: [buttonSettingsPanel]
        });

        this.callParent(arguments);
    },

    /**
     * Create new button node in tree and open button editor panel
     */
    initButton : function(formItemHelper) {
        var me = this;

        // Create a button
        var record = formItemHelper.createNode();

        // Load button form
        me.loadDefaults(record);
        me.newButton();
        // Set node editing
        formItemHelper.markNodeForEdit(record);
        // Set dirty icon
        formItemHelper.setNodeDirty();
    },

    /**
     * Create new button
     */
    newButton : function() {
        var me = this;

        // Exclude existing actions from the action store
        me.actionStore.getProxy().extraParams[me.ACTIONS_TO_EXCLUDE] = me.getExistingActions();

        me.actionStore.loadPage(1, {
            scope: me,
            callback: function() {
                this.clear();

                if (this.actionStore.getCount() === 0) {
                    // Activate empty form
                    this.formEditor.fieldEditorPanel.getLayout().setActiveItem(0);

                    // delete newly created node
                    this.record.remove();

                    // Display an error message when no actions are available anymore
                    Ext.MessageBox.show({
                        title: '',
                        msg: '#{msgs.field_editor_error_no_actions_left}',
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.ERROR
                    });
                } else {
                    // Activate button form
                    this.formEditor.fieldEditorPanel.getLayout().setActiveItem(4);
                }
            }
        });
    },

    /**
     * Loads the button properties
     */
    load : function() {
        var me = this,
            buttonProperties = me.record.get(me.PROPERTIES);

        // exclude existing actions from the button form's action store
        me.actionStore.getProxy().extraParams[me.ACTIONS_TO_EXCLUDE] =
            me.getExistingActions(buttonProperties.action);

        me.actionStore.loadPage(1, {
            scope : me,
            callback : function() {
                this.clear();

                // make buttons from active
                this.formEditor.fieldEditorPanel.getLayout().setActiveItem(4);

                // call FormItemEditor.load() in async callback
                this.self.superclass.load.call(this);
            }
        });
    },

    /**
     * Get the display text for node
     */
    getDisplayText : function () {
        var me = this,
            properties = me.record.get(me.PROPERTIES);

        return properties.action;
    },

    /**
     * Perform validation
     */
    validate : function(errors) {
        var me = this,
            isValid = true,
            buttonSettingsPanel = me.items.items[0];

        // pass variables in arguments array
        var isValidAction = me.callParent([buttonSettingsPanel, me.BUTTON, 'buttonAction', 'action', errors]);
        if(!isValidAction) {
            isValid = false;
        }
        var isValidLabel = me.callParent([buttonSettingsPanel, me.BUTTON, 'buttonLabel', 'label', errors]);
        if(!isValidLabel) {
            isValid = false;
        }

        return isValid;
    },

    /**
     * @private
     * Returns button actions that have already been added to the form
     */
    getExistingActions: function(currentAction) {
        var me = this,
            buttons = me.getExistingFormItems(me.BUTTON),
            existingActions = [],
            buttonAction,
            i;

        for (i = 0; i < buttons.length; i++) {
            buttonAction = buttons[i].get(me.PROPERTIES).action;
            if (buttonAction !== currentAction) {
                existingActions.push(buttonAction);
            }
        }

        return existingActions;
    }
});
