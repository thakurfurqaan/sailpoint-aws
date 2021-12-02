/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component that allows editing of field attributes
 *
 *@author rahul.borate
 */

Ext.define('SailPoint.form.editor.FieldEditor', {
    extend: 'SailPoint.form.editor.FormItemEditor',
    requires: ['SailPoint.form.editor.DivisionPanel',
        'SailPoint.form.editor.AttributeFactory'
    ],

    /////////////////////////////////////////////
    // constants                               //
    /////////////////////////////////////////////
    PROPERTIES: 'properties',

    FORM_ITEM_TYPE: 'formItemType',

    FIELD: 'field',

    TYPE_STRING: 'string',

    /////////////////////////////////////////////
    // functions                               //
    /////////////////////////////////////////////
    initComponent : function() {
        var me = this,
            attrFactory;

        // Initialize attribute factory
        attrFactory = new SailPoint.form.editor.AttributeFactory({
            beanType: me.formEditor.beanType
        });

        // Settings panel
        var fieldSettingsPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'fieldSettingsPanel',
            title: '#{msgs.field_editor_setting_panel}',
            formItemEditor: me,
            formEditor: me.formEditor
        });

        // Insert component's to the Settings panel
        fieldSettingsPanel.insertComponent(attrFactory.getFieldAttributes('Settings'));

        // Type Settings panel
        var fieldTypeSettingsPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'fieldTypeSettingsPanel',
            title: '#{msgs.field_editor_type_setting_panel}',
            collapsed: true,
            formItemEditor: me,
            formEditor: me.formEditor
        });

        // Insert component's to the Type Settings panel
        fieldTypeSettingsPanel.insertComponent(attrFactory.getFieldAttributes('TypeSettings'));

        // Value Settings panel
        var fieldValueSettingsPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'fieldValueSettingsPanel',
            title: '#{msgs.field_editor_value_setting_panel}',
            collapsed: true,
            formItemEditor: me,
            formEditor: me.formEditor
        });

        // Insert component's to the Value Settings panel
        fieldValueSettingsPanel.insertComponent(attrFactory.getFieldAttributes('ValueSettings'));

        Ext.apply(me, {
            id: 'fieldEditor',
            attrFactory: attrFactory,
            autoScroll: true,
            items: [fieldSettingsPanel,     // Settings
                    fieldTypeSettingsPanel, // Type Settings
                    fieldValueSettingsPanel // Value Settings
            ]
        });

        this.callParent(arguments);
    },

    /**
     * Create new field node in tree and open field editor panel
     */
    initField : function(formItemHelper) {
        var me = this,
            record = formItemHelper.createNode();

        me.newField(record);
        // Set node editing
        formItemHelper.markNodeForEdit(record);
        // Set dirty icon CSS
        formItemHelper.setNodeDirty();

        return record;
    },

    /**
     * Create a new field
     * @param {Ext.data.Model} record
     */
    newField : function(record) {
        var me = this;

        me.clear();
        me.loadDefaults(record, me);

        // Populate name attribute of field
        me.items.items[0].items.items[0].setValue(record.get('text'));

        // Set default field type as string
        me.items.items[0].items.items[3].setValue(me.TYPE_STRING);

        // Controls displaying of field attributes
        me.attrFactory.adjustFieldAttributes(me.TYPE_STRING,
                                             me,
                                             true); // To control form type dependable attributes

        // Activate field editor form
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(2);
    },

    /**
     * Edit the field
     * @param {Ext.data.Model} record
     */
    editField : function(record) {
        var me = this;

        me.clear();
        me.loadDefaults(record, me);
        me.load();

        // Controls displaying of field attributes
        me.attrFactory.adjustFieldAttributes(Ext.getCmp('fieldType').getValue(),
                                             me,
                                             true); // To control form type dependable attributes

        // Activate field editor form
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(2);
    },

    /**
     * Get the display text for a node
     */
    getDisplayText : function() {
        var me = this,
            properties = me.record.get(me.PROPERTIES);

        return properties.displayName ? properties.displayName : properties.name;
    },

    /**
     * Perform validation
     */
    validate : function(errors) {
        var me = this,
            isValid = true,
            fieldSettingsPanel = me.items.items[0],
            fieldValueSettingsPanel = me.items.items[2];

        // Field name validation
        isValid = me.callParent([fieldSettingsPanel, me.FIELD, 'fieldName', 'name', errors]);

        // Field type validation
        var fieldType = fieldSettingsPanel.items.get('fieldType');
        if (fieldType && !fieldType.isDisabled() && !fieldType.getValue()) {
            errors.push('#{msgs.field_editor_type_required}');
            fieldType.markInvalid('#{msgs.field_editor_field_required}');
            isValid = false;
        }

        // Validation for dependent app name and attribute
        if(me.formEditor.usage === me.CREATE && me.formEditor.beanType === me.APPLICATION) {
            var isValidDependent = me.validateDependent(fieldValueSettingsPanel, errors);
            if(!isValidDependent) {
                isValid = false;
            }
        }

        return isValid;
    }
});
