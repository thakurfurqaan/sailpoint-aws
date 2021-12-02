/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Generic class which will give dynamically generated
 * component based on requirement
 * Section - Dynamic Value component for extended attributes
 * @author Navnath.Misal
 */

Ext.define('SailPoint.form.editor.DynamicValue', {
    extend: 'Ext.form.Panel',
    alias:'widget.dynamicValue',

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////

    RULE : 'rule',

    SCRIPT : 'script',

    TRUE : 'true',

    FALSE : 'false',

    NONE_VALUE : 'none',

    FIELD_PROPERTY_COMBO :'fieldpropertyCombo',

    APPLICATION_OWNER : 'IIQApplicationOwner',

    ROLE_OWNER : 'IIQRoleOwner',

    OWNER_DEFINITION : 'owner',

    ROLE : 'role',

    APPLICATION : 'application',

    REQUESTER : 'IIQRequester',

    ALLOWED_VALUES_DEFINITION : 'allowedValues',

    TYPE_LITERAL : 'literal',

    VALIDATION : 'validation',

    VALUE : 'Value',

    DEFAULT: 'default',

    TYPE_DATE: 'date',

    CREATE: 'Create',

    DEPENDENT: 'Dependent',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    initComponent : function() {
        var me = this;

        // Default store for extended attributes
        me.fieldpropertyStore = new Ext.data.Store ({
            model: 'SailPoint.model.NameValue',
            data: [
                {name: '#{msgs.field_editor_false}', value: me.FALSE},
                {name: '#{msgs.field_editor_true}', value: me.TRUE},
                {name: '#{msgs.field_editor_rule}', value: me.RULE},
                {name: '#{msgs.field_editor_script}', value: me.SCRIPT},
            ]
        });

        // fieldpropertyCombo - properties of field
        me.fieldpropertyCombo = new Ext.form.ComboBox({
            name: me.FIELD_PROPERTY_COMBO,
            cls: 'dynamicValueCombo',
            queryMode:'local',
            triggerAction: 'all',
            displayField: 'name',
            valueField: 'value',
            value: me.FALSE,
            width: 0,
            store : me.fieldpropertyStore
          });

        // fieldpropertyCombo select event
        me.fieldpropertyCombo.on('select', function() {
            me.displayComponent(this.getValue());
        });

        // Store for rule drop down
        me.ruleStore = new Ext.data.Store ({
            model : 'SailPoint.model.NameValue',
            autoLoad: true,
            proxy : {
                type : 'ajax',
                url: CONTEXT_PATH + '/include/rulesDataSource.json',
                extraParams: {'type':'FieldValue', prompt:true},
                reader : {
                    type : 'json',
                    root: 'objects'
                }
            }
        });

        // Rule combo with rule drop down and rule editor
        me.ruleCombo = new SailPoint.Rule.Editor.RuleComboBox ({
            name: me.RULE,
            cls: 'dynamicRuleCombo',
            width: 410,
            displayField: 'name',
            valueField: 'value',
            triggerAction: 'all',
            store: me.ruleStore,
            hidden: true
        });

        // Script text area
        me.scriptTextArea = new Ext.form.TextArea ({
            cls: 'scriptTextArea',
            name: me.SCRIPT,
            grow: true,
            hidden: true
        });

        // Value component
        me.defaultValue = new Ext.form.TextField({
            name: me.VALUE,
            cls: 'dynamicField',
            hidden: true
        });

        // Default value date component
        me.defaultValueDate = new Ext.form.field.Date({
            name: me.VALUE,
            format: 'm/d/Y',
            cls: 'defaultValueDate',
            hidden: true
        });

        Ext.apply(me, {
            cls: 'dynamicValue',
            dynamicValue: true,
            items: [me.fieldpropertyCombo, me.ruleCombo, me.scriptTextArea, me.defaultValue, me.defaultValueDate]
        });

        me.callParent(arguments);
    },

    /**
     * Update dynamic value UI element based on Form Type (Application/Role/Workflow)
     * @param dynamicValueType - special type of dynamic value
     * @param  beanType - form type example - Role, Application, Work flow
     */
    updateDynamicValue : function(dynamicValueType, beanType, usage) {
        var me = this,
            fieldStore,
            fieldPropertiesArray,
            ruleType,
            defaultComboValue;

        fieldPropertiesArray = me.getDataForStore(dynamicValueType, beanType, usage);

        // Store based on dynamic value type
        if(fieldPropertiesArray) {
            me.fieldpropertyCombo.store.removeAll();
            me.fieldpropertyCombo.store.loadData(fieldPropertiesArray);
        }

        defaultComboValue = me.getDefaultComboValue(dynamicValueType);
        if(defaultComboValue) {
            me.fieldpropertyCombo.setValue(defaultComboValue);
            me.displayComponent(defaultComboValue, false);
        }

        ruleType = me.getRuleType(dynamicValueType);
        if(ruleType) {
            me.ruleStore.proxy.extraParams.type = ruleType;
            me.ruleCombo.ruleType = ruleType;
        }

        // create multi select component only for allowed values property
        if(dynamicValueType === me.ALLOWED_VALUES_DEFINITION) {
            // Multi select component
            me.valuesMultiSelect = new SailPoint.form.MultiText({
                allowedValues: [],
                width: 442,
                name: me.ALLOWED_VALUES_DEFINITION,
                cls: 'valuesMultiSelect',
                id: 'valuesMultiSelect',
                hidden: true
            });

            // add to dynamic value item list
            me.add(me.valuesMultiSelect);
        }
    },

    /**
     * Get Store data as per form type
     */
    getDataForStore : function(dynamicValueType, beanType, usage) {
        var me = this,
            dataArray;

        switch(dynamicValueType) {
            case me.OWNER_DEFINITION:
                dataArray = [
                    {name: '#{msgs.none}', value: me.NONE_VALUE},
                    {name: '#{msgs.field_editor_label_requester}', value: me.REQUESTER},
                    {name: '#{msgs.field_editor_rule}', value: me.RULE},
                    {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
                ]
                if(beanType === me.ROLE) {
                    dataArray.push({name: '#{msgs.field_editor_owner_role}', value: me.ROLE_OWNER});
                }
                if(beanType === me.ROLE || beanType === me.APPLICATION) {
                    dataArray.push({name: '#{msgs.field_editor_owner_app}', value: me.APPLICATION_OWNER});
                }
                break;
            case me.ALLOWED_VALUES_DEFINITION:
                dataArray = [
                    {name: '#{msgs.none}', value: me.NONE_VALUE},
                    {name: '#{msgs.field_editor_value}', value: me.TYPE_LITERAL},
                    {name: '#{msgs.field_editor_rule}', value: me.RULE},
                    {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
                ]
                break;
            case me.VALIDATION:
                dataArray = [
                    {name: '#{msgs.none}', value: me.NONE_VALUE},
                    {name: '#{msgs.field_editor_rule}', value: me.RULE},
                    {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
                ]
                break;
            case me.VALUE:
                dataArray = [
                    {name: '#{msgs.none}', value: me.NONE_VALUE},
                    {name: '#{msgs.field_editor_value}', value: me.VALUE},
                    {name: '#{msgs.field_editor_rule}', value: me.RULE},
                    {name: '#{msgs.field_editor_script}', value: me.SCRIPT}
                ]
                if(usage === me.CREATE && beanType === me.APPLICATION) {
                    dataArray.push({name: '#{msgs.field_editor_dependent}', value: me.DEPENDENT});
                    me.loadDependentAttribute();
                }
                break;
        }

        return dataArray;
    },

    /**
     * Default combo box value based on dynamic value type
     */
    getDefaultComboValue : function(dynamicValueType) {
        var me = this;

        switch(dynamicValueType) {
            case me.OWNER_DEFINITION:
                return me.NONE_VALUE;
                break;
            case me.ALLOWED_VALUES_DEFINITION:
                return me.NONE_VALUE;
                break;
            case me.VALIDATION:
                return me.NONE_VALUE;
                break;
            case me.VALUE:
                return me.NONE_VALUE;
                break;
            default:
                return me.FALSE;
        }
    },

    /**
     * Rule based on dynamic value type
     */
    getRuleType : function(dynamicValueType) {
        var me = this;

        switch(dynamicValueType) {
            case me.OWNER_DEFINITION:
                return 'Owner';
                break;
            case me.ALLOWED_VALUES_DEFINITION:
                return 'AllowedValues';
                break;
            case me.VALIDATION:
                return 'Validation';
                break;
        }
    },

    /**
     * @private
     * display component based on selected drop down value.
     * skipReset flag is to avoid reset of field setting panel UI component 
     */
    displayComponent : function(selectedValue, skipReset) {
        var me = this,
            fieldType = Ext.getCmp('fieldType');

        me.ruleCombo.hide();
        me.scriptTextArea.hide();
        me.valuesMultiSelect ? me.valuesMultiSelect.hide() : null;
        me.defaultValue.hide();
        me.defaultValueDate.hide();

        // Hide Dependent attribute
        if(Ext.getCmp('fieldAppDependent') && Ext.getCmp('fieldAppDependent').isVisible()) {
            Ext.getCmp('fieldAppDependent').hide();
            me.enableUIComponent();
        }

        switch (selectedValue) {
            case me.RULE:
                me.ruleCombo.show();
                break;
            case me.SCRIPT:
                me.scriptTextArea.show();
                break;
            case me.TYPE_LITERAL:
                me.valuesMultiSelect.show();
                break;
            case me.VALUE:
                if(fieldType && fieldType.getValue() === me.TYPE_DATE) {
                    me.defaultValueDate.show();
                } else {
                    me.defaultValue.show();
                }
                break;
            case me.DEPENDENT:
                Ext.getCmp('fieldAppDependent').show();
                me.disableUIComponent(skipReset);

                // Enable dependent attribute child component's
                me.enableDependent();
                break;
        }
    },

    /**
     * Load dependent attribute for value attribute under
     * dynamic value component
     */
    loadDependentAttribute : function() {
        var me = this,
            schemaAttrStore,
            appComboStore,
            dependentAppName,
            dependentAttr;

        // Schema attribute model
        Ext.define('SchemaAttr', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'name'},
                {name: 'id'},
                {name: 'displayName'},
                {name: 'attrType'}
            ]
        });

        // Dependent application name model
        Ext.define('DependentApp', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'id'},
                {name: 'displayField'},
                {name: 'displayName'}
            ]
        });

        // Store for schema attribute 
        schemaAttrStore = SailPoint.Store.createRestStore({
            model : 'SchemaAttr',
            url: SailPoint.getRelativeUrl('/rest/applications/{0}/schemaAttributes'),
            listeners: {
                // Need to set the raw value here because when we initially try to set this field value the store
                // has not been loaded so the value does not render.
                load: function() {
                    var attrField = Ext.getCmp('fieldDependentAttr');
                    if (attrField && !attrField.getRawValue() && attrField.getValue()) {
                        attrField.setRawValue(attrField.getValue());
                    }
                }
            }
        });

        // Store for dependent application names
        appComboStore = Ext.create('Ext.data.Store', {
            id: 'appComboStore',
            model: 'DependentApp',
            proxy:{
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'objects'
                }
            },
            listeners: {
                load: function(store, records, succes, opts) {
                    var recs = Ext.getCmp('applicationDependencyCmp').selectedStore.getRange();
                    //Need to manipulate the data so the SailPoint Suggest will render properly
                    for(var i=0; i<recs.length; i++) {
                        if(SailPoint.Utils.isNullOrEmpty(recs[i].get('displayName'))) {
                            recs[i].set('displayName',recs[i].get('displayField'));
                        }
                        if(SailPoint.Utils.isNullOrEmpty(recs[i].get('name'))) {
                            recs[i].set('name',recs[i].get('displayField'));
                        }
                    }
                    this.loadData(recs);
                }
            }
        });

        dependentAppName = new SailPoint.Suggest({
            id: 'fieldDependentAppName',
            name: 'dependentApp',
            cls: 'fieldDependentAppName',
            fieldLabel: '#{msgs.field_editor_dependent_app}',
            emptyText: '#{msgs.select_application}',
            labelSeparator: '',
            valueField: 'id',
            forceSelection: true,
            disabled: true,
            store: appComboStore,
            allowBlank: false,
            validateOnChange: true,
            validateOnBlur: false,
            listeners: {
                change: function(combo, newVal, oldVal, eOpts) {
                   if(SailPoint.Utils.isNullOrEmpty(newVal)) {
                       var schemaField = Ext.getCmp('fieldDependentAttr');
                       schemaField.getStore().removeAll();
                       schemaField.clearValue();
                   } else {
                       var tmp = this.getStore().findRecord('id',newVal);
                       if(tmp) {
                           var schema = Ext.getCmp('fieldDependentAttr');
                           schema.clearValue();
                           schema.getStore().removeAll();
                           schema.getStore().applyPathParams([newVal]);
                           schema.getStore().load();
                       }
                   }  
                }
            }
        });

        dependentAttr = new SailPoint.Suggest({
            id: 'fieldDependentAttr',
            name: 'dependentAttr',
            cls: 'fieldDependentAttr',
            fieldLabel: '#{msgs.field_editor_dependent_attr}',
            emptyText: '#{msgs.select_app_attr}',
            labelSeparator: '',
            valueField: 'name',
            forceSelection: true,
            disabled: true,
            store: schemaAttrStore,
            allowBlank: false,
            validateOnChange: true,
            validateOnBlur: false,
            listeners: {
                select : {
                    scope: me,
                    fn : function(combo, rec, opts) {
                        var fieldType,
                            fieldEditor = this.fieldEditor;

                        if(rec[0].get("attrType")) {
                            fieldType = rec[0].get("attrType");
                        } else {
                            fieldType = "string";
                        }
    
                        // Set field type
                        Ext.getCmp("fieldType").setValue(fieldType);

                        // Readjust the field editor attributes
                        fieldEditor.attrFactory.adjustFieldAttributes(fieldType, // field type
                                                                      fieldEditor,  // field editor
                                                                      false); // to control form type dependable attributes
                    }
                }
            }
        });

        // Dependent attribute component
        me.fieldAppDependent = Ext.form.FieldSet({
            id: 'fieldAppDependent',
            cls: 'fieldAppDependent',
            name: 'appDependent',
            hidden: true,
            items: [
                dependentAppName,
                dependentAttr
            ]
        });

        // update DynamicValue for dependent attribute
        me.add(me.fieldAppDependent);
        me.enableUIComponent();
    },

    /**
     * Enable entire attributes of a field when Dependent
     * in its value settings is not in use.
     */
    enableUIComponent : function () {

        // Enable field setting UI component
        Ext.getCmp('fieldSettingsPanel').items.each(function(item) {
            item.enable(); 
        });

        // Enable field type setting UI component
        Ext.getCmp('fieldTypeSettingsPanel').items.each(function(item) {
            if (item.isCheckBoxPanel) {
                item.items.each(function(subItem) {
                    subItem.enable();
                });
            } else if (item.dynamicValue) {
                item.fieldpropertyCombo.enable();
            } else {
                item.enable();
            }
        });

        // Enable value setting UI component
        Ext.getCmp('fieldValueSettingsPanel').items.each(function(item) {
            if(item.getId() !== 'value') {
                if (item.isCheckBoxPanel) {
                    item.items.each(function(subItem) {
                        subItem.enable();
                    });
                } else if (item.dynamicValue) {
                    item.fieldpropertyCombo.enable();
                } else {
                    item.enable();
                }
            }
        });
    },

    /**
     * Disable entire attributes of a field when Dependent
     * in its value settings is in use.
     * skipReset flag is to avoid reset of field setting panel UI component
     */
    disableUIComponent : function(skipReset) {
        var me = this;

        // Disable field setting UI component except field name and display name.
        Ext.getCmp('fieldSettingsPanel').items.each(function(item) {
            if(item.getId() !== 'displayName' && item.getId() !== 'fieldName') {
                me.disableComponent(item, skipReset);
            }
        });

        // Disable field type setting UI component
        Ext.getCmp('fieldTypeSettingsPanel').items.each(function(item) {
            if (item.isCheckBoxPanel) {
                item.items.each(function(subItem) {
                    me.disableComponent(subItem);
                });
            } else if (item.dynamicValue) {
                me.disableDynamicValueComponent(item);
            } else {
                me.disableComponent(item);
            }
        });

        // Disable value setting UI component
        Ext.getCmp('fieldValueSettingsPanel').items.each(function(item) {
            if(item.getId() !== 'value') {
                if (item.isCheckBoxPanel) {
                    item.items.each(function(subItem) {
                        me.disableComponent(subItem);
                    });
                } else if (item.dynamicValue) {
                    me.disableDynamicValueComponent(item);
                } else {
                    me.disableComponent(item);
                }
            }
        });
    },

    /**
     * Enable dependent application and
     * dependent attribute component when dependent value is selected in
     * value drop down.
     */
    enableDependent : function() {

        // Enable dependent application
        if(Ext.getCmp('fieldDependentAppName')) {
            Ext.getCmp('fieldDependentAppName').setDisabled(false);
            Ext.getCmp('fieldDependentAppName').clearInvalid();
        }

        // Enable dependent attribute
        if(Ext.getCmp('fieldDependentAttr')) {
            Ext.getCmp('fieldDependentAttr').setDisabled(false);
            Ext.getCmp('fieldDependentAttr').clearInvalid();
        }
    },

    /**
     * Reset and disable dynamic value component
     */
    disableDynamicValueComponent : function(item) {
        var me = this;

        var defaultComboValue = me.getDefaultComboValue(item.dynamicValueType);
        item.fieldpropertyCombo.setValue(defaultComboValue);
        item.fieldpropertyCombo.disable();
        item.ruleCombo.hide();
        item.scriptTextArea.hide();
        item.valuesMultiSelect ? item.valuesMultiSelect.hide() : null;
        item.defaultValue.hide();
        item.defaultValueDate.hide();
    },

    /**
     * reset and disable component
     * skipReset flag is to avoid reset of field setting panel UI component
     */
    disableComponent : function(item, skipReset) {
        if(!skipReset) {
            item.reset();
        }
        item.disable();
    }

});
