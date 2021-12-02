/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Form editor attribute factory. Defines field
 * attributes with its visual aspect on form editor. 
 *
 * @author rahul.borate
 */

Ext.define('SailPoint.form.editor.AttributeFactory', {
    requires: 'SailPoint.form.editor.DynamicValue',

    /////////////////////////////////////////////
    // constants                               //
    /////////////////////////////////////////////
    // Panel name constants
    BASIC: 'Basic',
    SETTINGS: 'Settings',
    TYPE_SETTINGS: 'TypeSettings',
    VALUE_SETTINGS: 'ValueSettings',

    // Attributes name constants
    NAME: 'name',
    LABEL: 'label',
    SUBTITLE: 'subtitle',
    ACTION: 'action',
    DISPLAYNAME: 'displayName',
    HELPKEY: 'helpKey',
    PARAMETER: 'parameter',
    PARAMETER_VALUE: 'value',
    TYPE: 'type',
    MULTI: 'multi',
    REQUIRED: 'required',
    REVIEWREQUIRED: 'reviewRequired',
    POSTBACK: 'postBack',
    DISPLAYONLY: 'displayOnly',
    AUTHORITATIVE: 'authoritative',
    READONLY: 'readOnly',
    HIDDEN: 'hidden',
    HIDENULLS: 'hideNulls',
    SKIPVALIDATION: 'skipValidation',
    OWNERDEFINITION: 'owner',
    FILTER: 'filter',
    DYNAMIC: 'dynamic',
    VALUE: 'Value',
    ALLOWEDVALUESDEFINITION: 'allowedValues',
    VALIDATIONSCRIPT: 'validationScript',
    VALIDATIONRULE: 'validationRule',
    VALIDATION: 'validation',
    DEFAULT: 'default',
    RULE: 'rule',
    SCRIPT: 'script',
    NONE_VALUE: 'none',
    CREATE: 'Create',
    DEPENDENT: 'Dependent',
    APPLICATION : 'application',

    // Miscellaneous
    LABEL_SEPERATOR: '',
    SP_OBJECT_PREFIX: 'sailpoint.object',
    TYPE_STRING: 'string',
    TYPE_BOOLEAN: 'boolean',
    TYPE_DATE: 'date',
    TYPE_SECRET: 'secret',
    PROPERTIES : 'properties',

    /////////////////////////////////////////////
    // functions                               //
    /////////////////////////////////////////////
    constructor: function (config) {
        var me = this;

        Ext.apply(me, config);
    },

    /**
     * Creates Section attributes UI components
     * @param {string} panleType
     * @returns {Array} UI components
     */
    getSectionAttributes : function(panleType) {
        var me = this;

        switch (panleType) {
            case me.BASIC:
                return me.addSectionBasics();
                break;
            case me.SETTINGS:
                return me.addSectionSettings();
                break;
        }
    },

    /**
     * Creates Field attributes UI components
     * @param {string} panleType
     * @returns {Array} UI components
     */
    getFieldAttributes : function(panleType) {
        var me = this;

        switch (panleType) {
            case me.SETTINGS:
                return me.addFieldSettings();
                break;
            case me.TYPE_SETTINGS:
                return me.addFieldTypeSettings();
                break;
            case me.VALUE_SETTINGS:
                return me.addFieldValueSettings();
                break;
        }
    },

    /**
     * Creates Button attributes UI components
     * @returns {Array} UI components
     */
    getButtonAttributes : function() {
        var me = this;

        return me.addButtonSettings();
    },

    /**
     * Controls what attributes are shown on the field editor.
     * @param {String} fieldType The type of the field
     * @param {Ext.form.Panel} fieldEditor The field editor panel
     * @param {Boolean} controlFormTypeDependableAttr A flag to control
     * form type dependable attributes
     */
    adjustFieldAttributes : function(fieldType, fieldEditor, controlFormTypeDependableAttr) {
        var me = this;

        // Type Setting panel
        me.adjustTypeSettingsAttributes(fieldType,
                                        fieldEditor.items.getAt(1),
                                        fieldEditor.formEditor,
                                        controlFormTypeDependableAttr);

        // Value Setting panel
        me.adjustValueSettingsAttributes(fieldType,
                                         fieldEditor.items.getAt(2),
                                         fieldEditor.formEditor,
                                         !controlFormTypeDependableAttr);
     },

    /**
     * @private
     * Creates UI components to be displayed on Section Basic panel
     * @returns {Array} UI components
     */
    addSectionBasics : function() {
        var me = this;

        return [{id: "sectionName", name: me.NAME, cls: 'textfield', fieldLabel: '#{msgs.field_editor_name}',
                 labelSeparator: me.LABEL_SEPERATOR, labelAlign: 'top', allowBlank: false
        },
            {id: "sectionLabel", name: me.LABEL, cls: 'textfield', fieldLabel: '#{msgs.field_editor_label}',
                labelSeparator: me.LABEL_SEPERATOR, labelAlign: 'top'}, // isExtended - to indicates extended attribute
            {id: "sectionSubtitle", name: me.SUBTITLE, isExtended: true,
                cls: 'textfield', fieldLabel: '#{msgs.field_editor_subtitle}',
                labelSeparator: me.LABEL_SEPERATOR, labelAlign: 'top'}
        ];
    },

    /**
     * @private
     * Creates UI components to be displayed on section Settings panel
     * @returns {Array} UI components
     */
    addSectionSettings : function() {
        var me = this;

        // isExtended - To indicates extended attribute
        // dynamicValue - Alias of dynamic value class SailPoint.form.editor.DynamicValue
        return [{id: 'hiddenSection', name: me.HIDDEN, isExtended: true,
                 dynamicValueType: me.DEFAULT, cls: 'field', xtype: 'dynamicValue',
                title: '#{msgs.field_editor_hidden}'},
            {id: 'readOnlySection', name: me.READONLY, isExtended: true,
                dynamicValueType: me.DEFAULT,  cls: 'field', xtype: 'dynamicValue',
                title: '#{msgs.field_editor_readonly}'},
            {id: 'hideNullsSection', name: me.HIDENULLS, isExtended: true,
                dynamicValueType: me.DEFAULT,  cls: 'field', xtype: 'dynamicValue',
                title: '#{msgs.field_editor_hidenulls}'}
        ];
    },

    /**
     * @private
     * Creates UI components to be displayed on field Settings panel
     * @returns {Array} UI components
     */
    addFieldSettings : function() {
        var me = this,
            nameStore,
            nameField,
            typeStore,
            typeCombo,
            identityAttrs;

        if (me.beanType === 'identity') {

            ////////////////////////////////////////
            // name attribute                     //
            ////////////////////////////////////////
            identityAttrs = Ext.JSON.decode(Ext.getDom('createAttributes').value);

            Ext.define('SailPoint.model.ProvPolicyField', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name', 'displayName', 'type']
            });

            nameStore = SailPoint.Store.createStore({
                model: 'SailPoint.model.ProvPolicyField',
                proxyType: 'memory',
                data: identityAttrs
            });

            nameField = Ext.create('Ext.form.ComboBox', {
                id: 'fieldName',
                cls: 'field',
                fieldLabel: '#{msgs.attribute}',
                allowBlank: false,
                labelSeparator: me.LABEL_SEPERATOR,
                labelAlign: 'top',
                emptyText: '#{msgs.select_identity_attr}',
                name: me.NAME,
                displayField: 'name',
                valueField: 'name',
                triggerAction: 'all',
                typeAhead: true,
                queryMode: 'local',
                allowBlank: true,
                selectOnFocus: true,
                forceSelection: false,
                minChars: 1,
                width: 0, // this looks odd, but this trick works
                parent: me,
                store: nameStore,
                listeners: {
                    select: {
                        scope: me,
                        fn : function(combo, record, index) {
                            this.selectAttribute(record[0], combo.ownerCt.ownerCt);
                        }
                    }
                }
            });
        } else {
            nameField = new Ext.form.TextField({id: "fieldName", name: me.NAME, cls: 'field',
                                fieldLabel: '#{msgs.field_editor_name}', labelSeparator: me.LABEL_SEPERATOR,
                                labelAlign: 'top', allowBlank: false
                        });
        }

        ////////////////////////////////////////
        // type attribute                     //
        ////////////////////////////////////////
        typeStore = SailPoint.Store.createStore({
            model: 'SailPoint.model.NameValue',
            autoLoad: true,
            url: CONTEXT_PATH + '/include/form/editor/formFieldTypesDataSource.json',
            root: 'objects'
        });

        typeCombo = Ext.create('Ext.form.ComboBox', {
            id: 'fieldType',
            cls: 'field',
            fieldLabel: '#{msgs.field_editor_field_type}',
            name: me.TYPE,
            labelSeparator: me.LABEL_SEPERATOR,
            labelAlign: 'top',
            emptyText: '#{msgs.select_type}',
            displayField: 'name',
            valueField: 'value',
            queryMode: 'local',
            triggerAction: 'all',
            minChars: 1,
            typeAhead: true,
            allowBlank: false,
            selectOnFocus: true,
            forceSelection: true,
            width: 0, // this looks odd, but this trick works
            store: typeStore,
            listeners: {
                select: {
                    scope: me,
                    fn: function(combo, record, eOpts) {

                        // Readjust the field editor attributes
                        this.adjustFieldAttributes(combo.getValue(), // field type
                                                   combo.ownerCt.ownerCt,  // field editor
                                                   false); // to control form type dependable attributes
                    }
                }
            }
        });

        return [nameField,
            {id: "displayName", name: me.DISPLAYNAME, cls: 'field', fieldLabel: '#{msgs.field_editor_display_name}',
                labelSeparator: me.LABEL_SEPERATOR, labelAlign: 'top'},
            {id: "helpKey", name: me.HELPKEY, cls: 'field', fieldLabel: '#{msgs.field_editor_help_key}',
                labelSeparator: me.LABEL_SEPERATOR, labelAlign: 'top'},
            typeCombo
        ];
    },

    /**
     * @private
     * Creates UI components to be displayed on field Type Settings panel
     * @returns {Array} UI components
     */
    addFieldTypeSettings : function() {
        var me = this,
            checkBoxPanel;

        // Keep checkbox attributes inside one panel
        checkBoxPanel = new Ext.form.Panel ({
            layout: 'column',
            cls: 'field',
            isCheckBoxPanel: true,
            items: [{id: 'fieldMulti', name: me.MULTI, columnWidth: .33,
                    xtype: 'checkbox', boxLabel: '#{msgs.multi_valued}'},
                {id: 'fieldPostBack', name: me.POSTBACK, columnWidth: .33,
                    xtype: 'checkbox', boxLabel: '#{msgs.field_editor_post_back}'},
                {id: 'fieldAuthoritative', name: me.AUTHORITATIVE, columnWidth: .33,
                    xtype: 'checkbox', boxLabel: '#{msgs.field_editor_authoritative}'},
                {id: 'fieldRequired', name: me.REQUIRED, columnWidth: .33,
                    xtype: 'checkbox', boxLabel: '#{msgs.required}'},
                {id: 'fieldReviewRequired', name: me.REVIEWREQUIRED, columnWidth: .33,
                    xtype:'checkbox', boxLabel: '#{msgs.field_editor_review_required}'},
                {id: 'fieldDisplayOnly', name: me.DISPLAYONLY, columnWidth: .33,
                    xtype: 'checkbox', boxLabel: '#{msgs.field_editor_display_only}'}
            ]
        });

        return [checkBoxPanel,
            {id: 'readOnlyField', name: me.READONLY, isExtended: true,
                cls: 'field', dynamicValueType : me.DEFAULT, xtype: 'dynamicValue',
                title: '#{msgs.field_editor_readonly}'},
            {id: 'hiddenField', name: me.HIDDEN, isExtended: true,
                cls: 'field', dynamicValueType : me.DEFAULT, xtype: 'dynamicValue',
                title: '#{msgs.field_editor_hidden}'},
            {id: 'owner', name: me.OWNERDEFINITION, cls: 'field',
                dynamicValueType : me.OWNERDEFINITION, xtype: 'dynamicValue',
                title: '#{msgs.template_editor_owner}'},
            {id: 'fieldFilter', name: me.FILTER, cls: 'field', labelSeparator: me.LABEL_SEPERATOR,
                labelAlign: 'top', fieldLabel: '#{msgs.label_filter}'}
        ];
    },

    /**
     * @private
     * Controls displaying of attributes from the fields
     * Type Settings panel.
     * @param {String} fieldType The type of the field
     * @param {Ext.form.Panel} typeSettingsPanel The type settings panel
     * @param {Ext.form.Panel} formEditor The form editor
     * @param {Boolean} controlFormTypeDependableAttr A flag to control
     * form type dependable attributes
     */
    adjustTypeSettingsAttributes : function(fieldType, typeSettingsPanel,
                                            formEditor, controlFormTypeDependableAttr) {
        var me = this,
            multi = typeSettingsPanel.items.items[0].items.get('fieldMulti'),
            properties = typeSettingsPanel.record.get(me.PROPERTIES),
            filter = typeSettingsPanel.items.get('fieldFilter');

        if(!controlFormTypeDependableAttr) {
            filter.reset();
            properties[me.FILTER] = null;
            multi.reset();
            properties[me.MULTI] = null;
        }
        if (fieldType) {
            if (fieldType === me.TYPE_STRING) {
                multi.show();
                filter.hide();
            } else if (fieldType.substring(0, me.SP_OBJECT_PREFIX.length) === me.SP_OBJECT_PREFIX) {
                multi.show();
                filter.show();
            } else {
                multi.hide();
                filter.hide();
            }
        } else {
            multi.hide();
            filter.hide();
        }

        if (controlFormTypeDependableAttr) {
            // hide/show reviewRequired attribute
            me.adjustReviewRequiredOptions(formEditor, typeSettingsPanel);
        }
    },

    /**
     * @private
     * Controls displaying of the reviewRequired attribute on the field editor.
     * @param {Ext.panel.Panel} formEditor The form editor
     * @param {Ext.form.Panel} panel The type settings panel
     */
    adjustReviewRequiredOptions : function(formEditor, panel) {
        var reviewRequired = panel.items.items[0].items.get('fieldReviewRequired'),
            // Usages for provisioning policies
            USAGES_WITH_REVIEW_REQUIRED = ['Create', 'Update', 'Delete', 'ChangePassword',
                                           'Enable', 'Unlock', 'Disable', 'Assign', 'Deassign'];
        // keep invisible
        reviewRequired.hide();

        if(formEditor.beanType === 'application') {
            // Check for Standalone(centralize) forms
            if (formEditor.usage === 'Standalone') {
                reviewRequired.show();
            } else {
                // Check for inline forms
                for (i = 0; i < USAGES_WITH_REVIEW_REQUIRED.length; i++) {
                    if (formEditor.usage === USAGES_WITH_REVIEW_REQUIRED[i]) {
                        reviewRequired.show();
                        break;
                    }
                }
            }
        } else if (formEditor.beanType === 'role') {
            reviewRequired.show();
        }
    },

    /**
     * @private
     * Creates UI components to be displayed on field Value Settings panel
     * @returns {Array} UI components
     */
    addFieldValueSettings : function() {
        var me = this;

        return [{id:'fieldDynamic', name: me.DYNAMIC, cls: 'field', xtype: 'checkbox',
                boxLabel: '#{msgs.field_editor_dynamic}'},
            {id: 'value', name: me.VALUE, cls: 'field', dynamicValueType : me.VALUE,
                xtype: 'dynamicValue', title: '#{msgs.template_editor_value}'},
            {id: 'allowedValues', name: me.ALLOWEDVALUESDEFINITION, cls: 'field',
                dynamicValueType : me.ALLOWEDVALUESDEFINITION, xtype: 'dynamicValue',
                title: '#{msgs.template_editor_allowed_values}'},
            {id: 'validation', name: me.VALIDATION, cls: 'field',
                dynamicValueType : me.VALIDATION, xtype: 'dynamicValue',
                title: '#{msgs.template_editor_validation}'},
        ];
    },

    /**
     * @private
     * Controls displaying of attributes from the fields
     * Value Settings panel when a field type is chosen.
     * @param {String} fieldType The type of field
     * @param {Ext.form.Panel} panel The value settings panel
     */
    adjustValueSettingsAttributes : function (fieldType, valueSettingsPanel, formEditor, controlFormTypeDependableAttr) {
        var me = this,
            value = valueSettingsPanel.items.get('value'),
            allowedValues = valueSettingsPanel.items.get('allowedValues'),
            defaultComboValue = me.NONE_VALUE,
            properties = valueSettingsPanel.record.get(me.PROPERTIES),
            valuePropertiesArray = [
                {name: '#{msgs.none}', value: me.NONE_VALUE},
                {name: '#{msgs.field_editor_value}', value: me.VALUE},
                {name: '#{msgs.field_editor_rule}', value: me.RULE},
                {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
            ];

        if (controlFormTypeDependableAttr) {
            // Value manipulation
            value.defaultValue.reset();
            value.defaultValueDate.reset();
            if (properties.defaultValue) {
                properties.defaultValue = null;
            }
            value.scriptTextArea.reset();
            if (properties.script) {
                properties.script = null;
            }
            value.ruleCombo.clearValue();
            if (properties.rule) {
                properties.rule = null;
            }

            // Allowed Value manipulation
            allowedValues.valuesMultiSelect.clear();
            if (properties.allowedValues) {
                properties.allowedValues = null;
            }
            allowedValues.scriptTextArea.reset();
            if (properties.allowedValuesScript) {
                properties.allowedValuesScript = null;
            }
            allowedValues.ruleCombo.clearValue();
            if (properties.allowedValuesRule) {
                properties.allowedValuesRule = null;
            }
            if (properties.allowedValuesType) {
                properties.allowedValuesType = 'none';
            }

            // Set allowed value combo to none
            allowedValues.fieldpropertyCombo.setValue(me.NONE_VALUE);

            // Since allowedValue is none, then don’t show any dependency
            allowedValues.displayComponent(me.NONE_VALUE, null);
        }

        if (fieldType === me.TYPE_BOOLEAN || fieldType === me.TYPE_DATE
            || fieldType === me.SP_OBJECT_PREFIX + '.Identity'
            || fieldType === me.TYPE_SECRET) {
            allowedValues.hide();
        } else {
            allowedValues.show();
        }

        // Update value store as per fieldType
        if (fieldType &&
            fieldType.substring(0, me.SP_OBJECT_PREFIX.length) === me.SP_OBJECT_PREFIX) {
            valuePropertiesArray = [
                {name: '#{msgs.none}', value: me.NONE_VALUE},
                {name: '#{msgs.field_editor_rule}', value: me.RULE},
                {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
                
            ];
            if(controlFormTypeDependableAttr) {
                defaultComboValue = me.NONE_VALUE;
                value.defaultValue.reset();
                value.scriptTextArea.reset();
            }
        }

        // update drop down with dependent attribute option
        if(formEditor.usage === me.CREATE && formEditor.beanType === me.APPLICATION) {
            if(value.fieldpropertyCombo.getValue() === me.DEPENDENT) {
                defaultComboValue = me.DEPENDENT;
            }
            valuePropertiesArray.push({name: '#{msgs.field_editor_dependent}', value: me.DEPENDENT});
        }

        // update field store data
        value.fieldpropertyCombo.store.removeAll();
        value.fieldpropertyCombo.store.loadData(valuePropertiesArray);

        if(controlFormTypeDependableAttr) {
            value.fieldpropertyCombo.setValue(defaultComboValue);

            // pass skipReset true to avoid reset of field setting panel UI element
            value.displayComponent(defaultComboValue, true);
        }
    },

    /**
     * @private
     * Controls displaying of attributes from
     * the Identity provisioning policy form.
     *
     * @param {Ext.data.Model} record A record containing Identity attributes data
     * @param {Ext.form.Panel} fieldEditor The field editor panel
     */
    selectAttribute : function(record, fieldEditor) {
        var me = this,
            type;

        // Set display name
        Ext.getCmp('displayName').setValue(record.get('displayName'));

        // Decide the field type
        type = record.get('type');
        if(!type) {
            type = 'string';
        }
        Ext.getCmp('fieldType').setValue(type);

        // Readjust the field editor's UI according to the new field type
        me.adjustFieldAttributes(type, // field type
                                 fieldEditor, // field editor
                                 false); // to control form type dependable attributes

        // Mark required
        if(record.get('name') === 'name') {
            Ext.getCmp('fieldRequired').setValue(true);
        } else {
            Ext.getCmp('fieldRequired').setValue(false);
        }
    },

    /**
     * @private
     * Creates UI components to be displayed on button Settings panel
     * @returns {Array} UI components
     */
    addButtonSettings : function() {
        var me = this,
            actionField,
            checkBoxPanel;

        actionField = Ext.create('Ext.form.ComboBox', {
            id: 'buttonAction',
            cls: 'field',
            fieldLabel: '#{msgs.field_editor_action}',
            labelAlign: 'top',
            labelSeparator: me.LABEL_SEPERATOR,
            emptyText: '#{msgs.select_btn_action}',
            allowBlank: false,
            name: me.ACTION,
            displayField: 'name',
            valueField: 'value',
            triggerAction: 'all',
            typeAhead: true,
            queryMode: 'local',
            minChars: 1,
            selectOnFocus: true,
            forceSelection: true,
            width: 0, // this looks odd, but this trick works
            store: me.actionStore,
            listeners : {
                // set default value to label
                select : function(combo , records) {
                    var buttonLabel = combo.ownerCt.items.get('buttonLabel');

                    buttonLabel.setValue(records[0].get('name'));
                }
            }
        });

        // To keep ReadOnly and Skip Validation properties inside one panel
        checkBoxPanel = new Ext.form.Panel ({
            layout: 'column',
            cls:'field',
            isCheckBoxPanel: true,
            items: [{id: 'buttonReadOnly', boxLabel: "#{msgs.field_editor_readonly}", xtype: 'checkbox',
                    name: me.READONLY, columnWidth: .5},
                {id: 'buttonSkipValidation', boxLabel: "#{msgs.field_editor_skip_validation}", xtype: 'checkbox',
                    name: me.SKIPVALIDATION, columnWidth: .5}
            ]
        });

        return [actionField, checkBoxPanel,
            {id: 'buttonLabel', cls: 'field', fieldLabel: "#{msgs.field_editor_label}",
                labelSeparator: me.LABEL_SEPERATOR, name: me.LABEL, labelAlign: 'top', allowBlank: false
            },
            {id: 'buttonParameter', cls: 'field', fieldLabel: "#{msgs.field_editor_parameter}",
                labelSeparator: me.LABEL_SEPERATOR, name: me.PARAMETER, labelAlign: 'top'},
            {id: 'buttonValue', cls: 'field', fieldLabel: "#{msgs.field_editor_value}",
                labelSeparator: me.LABEL_SEPERATOR, name: me.PARAMETER_VALUE, labelAlign: 'top'}
        ];
    }
});
