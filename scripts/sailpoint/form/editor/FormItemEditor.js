/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class defines a common panel and basic functionality across
 * formitem editors like SectionEditor, RowEditor, ButtonEditor and FieldEditor.
 *
 * Author : Ketan
 *
 */
Ext.define('SailPoint.form.editor.FormItemEditor' , {
    extend : 'Ext.form.Panel',

    PROPERTIES : 'properties',
    FORM_ITEM_TYPE : 'formItemType',
    TYPE_IDENTITY_ATTR: 'sailpoint.object.Identity',
    IDENTITY: 'Identity',
    TYPE: 'type',
    TEXT: 'text',
    CREATE: 'Create',
    APPLICATION : 'application',

    formEditor : null,

    initComponent : function() {
        var me = this;
        me.callParent(arguments);

        var applyButton = new Ext.Button({
            itemId: 'applyButton',
            cls: 'applyButton',
            text: '#{msgs.field_editor_apply_button}'
        });

        applyButton.on('click', me.apply, me);

        var applyButtonPanel = new Ext.form.Panel ({
            itemId:'applyButtonPanel',
            title: 'applyButtonPanel',
            cls: 'applyButtonPanel',
            // Custom attribute to skip unapplied changes validation
            // for this panel in FormItemHelper
            skipValidation: true,
            header: false,
            items: [applyButton]
        });

        // Keep apply button on top-right of form item editor
        me.add(applyButtonPanel);
    },

    /**
     * Save form item editor all sub-panel's
     */
    apply : function() {
        var me = this,
            record = me.record,
            node = me.formEditor.formItemPanel.getView().getNode(record),
            formItemHelper = new SailPoint.form.editor.FormItemHelper({}),
            properties = me.record.get(me.PROPERTIES),
            errors = [];

        if(me.validate(errors)) {

            // Save each panel changes to respective tree node
            me.items.each(function(panelItem) {
                me.commit(panelItem)
            });

            // Change node text
            // Check for section label and convert to localized display text.
            if (record.get(me.FORM_ITEM_TYPE) === me.SECTION &&
               Ext.isDefined(properties.label) && properties.label) {
                formItemHelper.getLocalizedDisplayText(properties.label, record, node);
            }
            // Check for field display name and convert to localized display text.
            else if (record.get(me.FORM_ITEM_TYPE) === me.FIELD &&
                    Ext.isDefined(properties.displayName) && properties.displayName) {
                formItemHelper.getLocalizedDisplayText(properties.displayName, record, node);
            } else if (record.get(me.FORM_ITEM_TYPE) === me.SECTION
                       || record.get(me.FORM_ITEM_TYPE) === me.BUTTON
                       || record.get(me.FORM_ITEM_TYPE) === me.FIELD) {

                // Set display text to section, button, field node.
                record.set(me.TEXT, me.getDisplayText());
            }

            // Set dirty icon
            if(node) {

                // Reload clicked CSS
                formItemHelper.alterNodeStyle(node);

                // Set dirty icon
                if(Ext.isDefined(record.dirtyNode) && record.dirtyNode) {
                    formItemHelper.setNodeDirty(node);
                }
            }

            // Hide error panel if visible
            if(Ext.get('errorPanel') && Ext.get('errorPanel').isVisible()) {
                me.formEditor.displayError(false,'');
            }
        } else {
            me.formEditor.displayError(true, errors);
        }
    },

    /**
     * Commit changes in the store.
     * @param {SailPoint.form.editor.DivisionPanel} panel
     * @param simulate - indicates don't apply changes to store,
     *        just return true if any unapplied change found 
     */
    commit : function(panel, simulate) {
        var me = this,
            properties = me.record ? me.record.get(me.PROPERTIES) : '',
            hasChange;

        panel.items.each(function(item) {
            // Get the actual input of UI component.
            // Helpful when a user provides any arbitrary information
            // in the ComboBox which is not there in the drop-down picker.
            if (Ext.isDefined(item.getValue)) {
                item.setValue(item.getValue());
            }

            // Mark item value undefined if its empty
            if(!item.value) {
                item.value = undefined;
            }

            if(!properties[item.name]) {
                properties[item.name] = undefined;
            }

            // Apply checkbox panel
            if (item.isCheckBoxPanel) {
                item.items.each(function(subItem) {
                    if(!me.isEqual(properties[subItem.name], subItem.value)) {
                        if(simulate) {
                            hasChange = true;
                            return false;
                        } else {
                            me.record.dirtyNode = true;
                            properties[subItem.name] = subItem.value.toString();
                        }
                    }
                });
            }
            // Apply dynamic radio
            else if (item.dynamicValue) {
                hasChange = me.setDynamicValue(item, properties, simulate);
            }
            // Extended attributes
            else if (item.isExtended) {
                if(!me.isEqual(properties.attributes[item.name], item.value)) {
                    if(simulate) {
                        hasChange = true;
                        return false;
                    } else {
                        me.record.dirtyNode = true;
                        properties.attributes[item.name] = item.value ? item.value : "";
                    }
                }
            }
            // other cases- ComboBox, TextField etc...
            else {
                if(properties[item.name] !== item.value) {
                    if(simulate) {
                        hasChange = true;
                        return false;
                    } else {
                        me.record.dirtyNode = true;
                        properties[item.name] = item.value ? item.value : "";
                    }
                }
            }

            // Break loop if simulate is true and found un applied changes
            if(simulate && hasChange) {
                return false;
            }
        });

        if(simulate) {
            return hasChange;
        }
    },

    /**
     * Reset item and clear invalid item.
     */
    resetClearItem : function(item) {
        if (item.reset) {
            item.reset();
        }
        if (item.clearInvalid) {
            item.clearInvalid();
        }
    },

    /**
     * Clears formitem properties.
     */
    clear : function() {
        var me = this;

        me.items.each(function(divisionItem) {
            divisionItem.items.each(function(item) {
                // clear checkbox panel
                if (item.isCheckBoxPanel) {
                    item.items.each(function(subItem) {
                        me.resetClearItem(subItem);
                    });
                }
                // clear dynamic radio
                else if (item.dynamicValue) {
                    item.items.each(function(dynamicItem) {
                        switch (dynamicItem.name) {
                            case item.SCRIPT :
                            case item.RULE :
                                dynamicItem.hide();

                            default :
                                me.resetClearItem(dynamicItem);
                        }
                    });
                } else {
                    me.resetClearItem(item);
                }
            });
        });
    },

    /**
     * Set dynamic value to store.
     */
    setDynamicValue : function(item, properties, simulate) {
        var me = this,
            dynamicValue,
            attributeValue,
            selectedValue = item.fieldpropertyCombo.getValue(),
            fieldType,
            hasChange;

        switch (selectedValue) {
            case item.TRUE :
                if(!Ext.isDefined(properties.attributes[item.name]) ||
                   properties.attributes[item.name].value !== selectedValue) {
                    if(simulate) {
                        hasChange = true;
                    } else {
                        me.record.dirtyNode = true;
                        attributeValue = {'valueType' : item.NONE_VALUE , 'value' : selectedValue};
                        properties.attributes[item.name] = attributeValue ? attributeValue : null;
                    }
                }
                break;
            case item.FALSE:
                if(item.isExtended) {
                    if(Ext.isDefined(properties.attributes[item.name]) &&
                       properties.attributes[item.name].value !== selectedValue) {
                        if(simulate) {
                            hasChange = true;
                        } else {
                            me.record.dirtyNode = true;
                            properties.attributes[item.name] = undefined;
                        }
                    }
                }
                break;
            case item.SCRIPT :
                hasChange = me.setScriptValue(item, properties, simulate);
                break;
            case item.RULE:
                hasChange = me.setRuleValue(item, properties, simulate);
                break;
            case item.ROLE_OWNER :
            case item.APPLICATION_OWNER :
                if(properties[item.name+'Type'] !== selectedValue) {
                    if(simulate) {
                        hasChange = true;
                    } else {
                        me.record.dirtyNode = true;
                        properties[item.name+'Type'] = selectedValue;
                        properties[item.name] = selectedValue;
                    }
                }
                break;
            case item.REQUESTER:
                if(!me.isEqual(properties[item.name+'Type'], selectedValue)) {
                    if(simulate) {
                        hasChange = true;
                    } else {
                        me.record.dirtyNode = true;
                        properties[item.name+'Type'] = item.REQUESTER;
                        properties[item.name+'Script'] = undefined;
                        properties[item.name+'Rule'] = undefined;
                        properties[item.name] = selectedValue;
                    }
                }
                break;
            case item.TYPE_LITERAL :
                properties[item.name] = Ext.isDefined(properties[item.name]) ? properties[item.name] : "";
                properties[item.name] = properties[item.name] === null ? "" : properties[item.name];
                if(properties[item.name].toString() !== item.valuesMultiSelect.getValue().toString()) {
                    if(simulate) {
                        hasChange = true;
                    } else {
                        me.record.dirtyNode = true;
                        properties[item.name+'Type'] = selectedValue;
                        properties[item.name] = item.valuesMultiSelect.getValue();
                    }
                }
                break;
            case item.VALUE :
                fieldType = Ext.getCmp('fieldType');
                    if(fieldType && fieldType.getValue() === item.TYPE_DATE) {
                        if(!me.isEqual(properties['defaultValue'], item.defaultValueDate.getRawValue())) {
                            if(simulate) {
                                hasChange = true;
                            } else {
                                me.record.dirtyNode = true;
                                properties['defaultValue'] = item.defaultValueDate.getRawValue();
                            }
                        }
                    } else if(!me.isEqual(properties['defaultValue'], item.defaultValue.value)) {
                        if(simulate) {
                            hasChange = true;
                        } else {
                            me.record.dirtyNode = true;
                            properties['defaultValue']= item.defaultValue.getValue();
                        }
                    }
                    properties['script'] = undefined;
                    properties['rule'] = undefined;
                    properties['dependentApp'] = undefined;
                    properties['dependentAttr'] = undefined;
                break;
            case item.NONE_VALUE:
                if(item.dynamicValueType === item.ALLOWED_VALUES_DEFINITION) {
                    if(Ext.isDefined(properties[item.name+'Type']) &&
                       properties[item.name+'Type'] !== selectedValue) {
                        hasChange = me.setPropertyValueforNone(simulate, properties, item.name);
                    }
                } else if(item.dynamicValueType === item.VALIDATION) {
                    var storeValue = 'none';
                    if(properties[item.name+'Script']) {
                        storeValue = item.SCRIPT;
                    } else if(properties[item.name+'Rule']) {
                        storeValue = item.RULE;
                    }
                    if(storeValue !== selectedValue) {
                        hasChange = me.setPropertyValueforNone(simulate, properties, item.name);
                    }
                } else if(item.dynamicValueType === item.VALUE) {
                    var storeValue = 'none';
                    if(properties['dependentApp'] && properties['dependentAttr']) {
                        storeValue = item.DEPENDENT;
                    } else if(properties['script']) {
                        storeValue = item.SCRIPT;
                    } else if(properties['rule']) {
                        storeValue = item.RULE;
                    } else if(properties['defaultValue']) {
                        storeValue = item.VALUE;
                    }
                    if(storeValue !== selectedValue) {
                        if(simulate) {
                            hasChange = true;
                        } else {
                            me.record.dirtyNode = true;
                            properties['script'] = undefined;
                            properties['rule'] = undefined;
                            properties['defaultValue'] = undefined;
                            properties['dependentApp'] = undefined;
                            properties['dependentAttr'] = undefined;
                        }
                    }
                } else if (item.dynamicValueType === item.OWNER_DEFINITION){
                    var storeValue = 'none';
                    if(properties[item.name+'Type']) {
                        storeValue = properties[item.name+'Type'];
                    }
                    if(storeValue !== selectedValue) {
                        if(simulate) {
                            hasChange = true;
                        } else {
                            me.record.dirtyNode = true;
                            properties[item.name+'Type'] = undefined;
                            properties[item.name+'Script'] = undefined;
                            properties[item.name+'Rule'] = undefined;
                            properties[item.name] = undefined;
                        }
                    }
                }
                break;
            case item.DEPENDENT:
                if(!me.isEqual(properties['dependentApp'], item.fieldAppDependent.items[0].getValue())) {
                    if(simulate) {
                        hasChange = true;
                    } else { 
                        me.record.dirtyNode = true;
                        properties['dependentApp'] = item.fieldAppDependent.items[0].getValue();
                    }
                }
                if(!me.isEqual(properties['dependentAttr'], item.fieldAppDependent.items[1].getValue())) {
                    if(simulate) {
                        hasChange = true;
                    } else {
                        me.record.dirtyNode = true;
                        properties['dependentAttr'] = item.fieldAppDependent.items[1].getValue();
                    }
                }
                if(!simulate && me.record.dirtyNode) {
                    properties['script'] = undefined;
                    properties['rule'] = undefined;
                    properties['defaultValue'] = undefined;
                }
                break;
        }

        return hasChange;
    },

    /**
     * Set property values to undefined when user has selected
     * None value in drop down
     */
    setPropertyValueforNone : function(simulate, properties, itemName) {
        var me = this,
            hasChange;
        if(simulate) {
            hasChange = true;
        } else {
            me.record.dirtyNode = true;
            properties[itemName+'Type'] = undefined;
            properties[itemName+'Script'] = undefined;
            properties[itemName+'Rule'] = undefined;
            properties[itemName] = undefined;
        }
        return hasChange;
    },

    /**
     * Set form item script value
     * */
    setScriptValue : function(item, properties, simulate) {
        var me = this,
            attributeValue,
            hasChange;

        if (item.dynamicValueType === item.DEFAULT) {
            if ((item.scriptTextArea.getValue() && (Ext.isDefined(properties.attributes[item.name]) &&
                properties.attributes[item.name].scriptSource !== item.scriptTextArea.getValue())) ||
                properties.attributes[item.name] === undefined) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    attributeValue = {'valueType' : item.SCRIPT ,
                        'scriptSource' : item.scriptTextArea.getValue()};
                    properties.attributes[item.name] = attributeValue ? attributeValue : undefined;
                }
            }
        } else if (item.dynamicValueType === item.OWNER_DEFINITION ||
                   item.dynamicValueType === item.ALLOWED_VALUES_DEFINITION) {
            if (item.scriptTextArea.getValue() && properties[item.name] !== item.scriptTextArea.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties[item.name+'Type'] = item.SCRIPT;
                    properties[item.name+'Script'] = item.scriptTextArea.getValue();
                    properties[item.name+'Rule'] = undefined;
                    properties[item.name] = item.scriptTextArea.getValue();
                }
            }
        } else if(item.dynamicValueType === item.VALIDATION) {
            if (item.scriptTextArea.getValue() && properties[item.name+'Script'] !== item.scriptTextArea.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties[item.name+'Script'] = item.scriptTextArea.getValue();
                    properties[item.name+'Rule'] = undefined;
                }
            }
        } else if(item.dynamicValueType === item.VALUE) {
            if (item.scriptTextArea.getValue() && properties['script'] !== item.scriptTextArea.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties['script'] = item.scriptTextArea.getValue();
                    properties['rule'] = undefined;
                    properties['defaultValue'] = undefined;
                    properties['dependentApp'] = undefined;
                    properties['dependentAttr'] = undefined;
                }
            }
        }
        return hasChange;
    },

    /**
     * Set form item rule value
     * */
    setRuleValue : function(item, properties, simulate) {
        var me = this,
            attributeValue,
            hasChange;

        if (item.dynamicValueType === item.DEFAULT) {
            if ((item.ruleCombo.getValue() && (Ext.isDefined(properties.attributes[item.name]) &&
                    properties.attributes[item.name].ruleName !== item.ruleCombo.getValue())) ||
                    !Ext.isDefined(properties.attributes[item.name])) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    attributeValue = {'valueType' : item.RULE ,
                        'ruleName' : item.ruleCombo.getValue()};
                    properties.attributes[item.name] = attributeValue ? attributeValue : undefined;
                }
            }
        } else if (item.dynamicValueType === item.OWNER_DEFINITION ||
                   item.dynamicValueType === item.ALLOWED_VALUES_DEFINITION) {
            if (item.ruleCombo.getValue() && properties[item.name] !== item.ruleCombo.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties[item.name+'Type'] = item.RULE;
                    properties[item.name+'Rule'] = item.ruleCombo.getValue();
                    properties[item.name+'Script'] = undefined;
                    properties[item.name] = item.ruleCombo.getValue();
                }
            }
        } else if(item.dynamicValueType === item.VALIDATION) {
            if (item.ruleCombo.getValue() && properties[item.name+'Rule'] !== item.ruleCombo.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties[item.name+'Rule'] = item.ruleCombo.getValue();
                    properties[item.name+'Script'] = undefined;
                }
            }
        } else if(item.dynamicValueType === item.VALUE) {
            if (item.ruleCombo.getValue() && properties['rule'] !== item.ruleCombo.getValue()) {
                if(simulate) {
                    hasChange = true;
                } else {
                    me.record.dirtyNode = true;
                    properties['rule'] = item.ruleCombo.getValue();
                    properties['script'] = undefined;
                    properties['defaultValue'] = undefined;
                    properties['dependentApp'] = undefined;
                    properties['dependentAttr'] = undefined;
                }
            }
        }
        return hasChange;
    },

    /**
     * Load formitem properties.
     */
    load : function() {
        var me = this,
            properties = me.record.get(me.PROPERTIES),
            value;

        me.items.each(function(divisionItem) {
            divisionItem.items.each(function(item) {
                // load checkbox panel
                if (item.isCheckBoxPanel) {
                    item.items.each(function(subItem) {
                        value = properties[subItem.name];
                        if (value) {
                            subItem.setValue(value);
                        }
                    });
                }
                // load dynamic radio
                else if (item.dynamicValue) {
                    me.loadDynamicValue(item , properties);
                } else {
                    if (item.isExtended) {
                        value = properties.attributes[item.name];
                    } else {
                        value = properties[item.name];
                    }

                    if (item.setValue) {
                        if (value) {
                            // case when type = identity set from back-end then
                            // handle it explicitly before loading on field editor.
                            if(item.name === me.TYPE && value.toUpperCase() === me.IDENTITY.toUpperCase()) {
                                properties[item.name] = me.TYPE_IDENTITY_ATTR;
                                item.setValue(me.TYPE_IDENTITY_ATTR);
                            } else {
                                item.setValue(value);
                            }
                        } else {
                            if (item.name === 'columns') {
                                item.setValue((value === 0 ? value : 2));
                            } else {
                                item.setValue('');
                            }
                        }
                    }
                }
            });
        });
    },

    /**
     * Get the attribute value
     */
    getAttribute : function(attr) {
        var me = this,
            properties = me.record.get(me.PROPERTIES);

        return properties[attr];
    },

    /**
     * Load dynamic value.
     */
    loadDynamicValue : function(item , properties) {
        var me = this,
            value,
            valueType;

        // For loading default dynamic value
        if (item.dynamicValueType === item.DEFAULT) {
            valueType = properties.attributes[item.name] ? properties.attributes[item.name].valueType : null;

            if(valueType === item.SCRIPT) {
                value = properties.attributes[item.name].scriptSource;
            } else if(valueType === item.RULE) {
                value = properties.attributes[item.name].ruleName;
            } else if(valueType === item.NONE_VALUE) {
                value = properties.attributes[item.name].value;
            }
        // For loading owner dynamic value
        } else if (item.dynamicValueType === item.OWNER_DEFINITION) {
            valueType = properties.ownerType;
            value = properties.owner ? properties.owner : item.NONE_VALUE;
        // For loading allowedValues dynamic value
        } else if (item.dynamicValueType === item.ALLOWED_VALUES_DEFINITION) {
            valueType = properties.allowedValuesType,
            value = properties.allowedValues ? properties.allowedValues : item.NONE_VALUE;
        // For loading allowedValues dynamic value
        } else if(item.dynamicValueType === item.VALIDATION) {
            if(properties.validationRule) {
                valueType = item.RULE;
                value = properties.validationRule;
            } else if(properties.validationScript) {
                valueType = item.SCRIPT;
                value = properties.validationScript;
            } else {
                value = item.NONE_VALUE;
            }
        // For loading value attribute
        } else if(item.dynamicValueType === item.VALUE) {
            if (properties['dependentApp'] && properties['dependentAttr']) {
                valueType = item.DEPENDENT;
                value = [properties['dependentApp'], properties['dependentAttr']]
            } else if(properties.rule) {
                valueType = item.RULE;
                value = properties.rule;
            } else if(properties.script) {
                valueType = item.SCRIPT;
                value = properties.script;
            } else if(properties.defaultValue) {
                valueType = item.VALUE;
                value = properties.defaultValue;
            } else {
                valueType = item.NONE_VALUE;
                value = item.NONE_VALUE;
            }
        }

        // load dynamic value component as per its type
        me.loadDynamicValueTypeData(valueType, item , properties, value);
    },


    /**
     * Load Dynamic Value data as per type
     */
    loadDynamicValueTypeData : function(valueType, item , properties, value) {
        var me = this;

        switch (valueType) {
            case item.NONE_VALUE :
                item.fieldpropertyCombo.setValue(value);
                break;
            case item.RULE :
                item.fieldpropertyCombo.setValue(item.RULE);
                item.ruleCombo.setValue(value);
                item.ruleCombo.store.read();
                item.displayComponent(item.RULE);
                break;
            case item.SCRIPT :
                item.fieldpropertyCombo.setValue(item.SCRIPT);
                item.scriptTextArea.setValue(value);
                item.displayComponent(item.SCRIPT);
                break;
            case item.ROLE_OWNER :
                item.fieldpropertyCombo.setValue(item.ROLE_OWNER);
                break;
            case item.APPLICATION_OWNER :
                item.fieldpropertyCombo.setValue(item.APPLICATION_OWNER);
                break;
            case item.REQUESTER:
                item.fieldpropertyCombo.setValue(item.REQUESTER);
                break;
            case item.TYPE_LITERAL :
                item.fieldpropertyCombo.setValue(item.TYPE_LITERAL);
                var records = [];
                if (value) {
                    for (var i = 0; i < value.length; ++i) {
                        var valueParam = value[i];
                        records.push({id: valueParam, displayName: valueParam});
                    }
                }
                item.valuesMultiSelect.setValue(records);
                item.displayComponent(item.TYPE_LITERAL);
                break;
            case item.VALUE :
                 // If combo box value is already set then only display child component
                 if(item.fieldpropertyCombo.getValue() === item.VALUE) {
                     item.displayComponent(item.VALUE);
                 } else {
                     item.fieldpropertyCombo.setValue(item.VALUE);
                 }

                 // set component value as per field type
                 if(properties.type === item.TYPE_DATE) {
                     item.defaultValueDate.setValue(value);
                 } else {
                     item.defaultValue.setValue(value);
                 }
                 item.displayComponent(item.VALUE);
                break;
            case item.DEPENDENT:

                item.fieldpropertyCombo.setValue(item.DEPENDENT);

                // pass skipReset true to avoid reset of field setting panel UI element
                item.displayComponent(item.DEPENDENT, true);
                item.fieldAppDependent.items[0].getStore().load();

                // load application name combo box
                item.fieldAppDependent.items[0].setValue(value[0]);

                // load attribute name combo box
                item.fieldAppDependent.items[1].setValue(value[1]);
                break;
        }
    },

    /**
     * Loads default properties.
     * @param {Ext.data.Model} record
     */
    loadDefaults : function(record) {
        var me = this,
            expandFirst = true;

        me.record = record;

        me.items.each(function(panelItem) {
            // add record to the panel
            panelItem.record = record;

            panelItem.items.each(function(item) {
                if ('dynamicValue' === item.xtype) {
                    item.updateDynamicValue(item.dynamicValueType , me.formEditor.beanType, me.formEditor.usage);
                }
            });

            // expand first panel
            if(panelItem.title !== 'applyButtonPanel') {
                if (expandFirst) {
                    panelItem.expand();
                    expandFirst = false;
                } else {
                    panelItem.collapse();
                }
            }
        });
    },

    /**
     * Perform validation , arguments are passed in as array.
     * @param arguments[0] panel - instance of DivisionPanel
     * @param arguments[1] type - type of FormItemEditor [section , field , button]
     * @param arguments[2] itemId - id of item to be validated
     * @param arguments[3] itemName - name of item to be validated
     */
    validate : function() {
        var me = this,
            panel = arguments[0],
            type = arguments[1],
            itemId = arguments[2],
            itemName = arguments[3],
            errors = arguments[4],
            isValid = true;

        if (panel.isVisible()) {
            isValid = me.validateRequired(panel , itemId, type, errors);

            if (isValid) {
                isValid = me.validateDuplicates(panel , type , itemId , itemName, errors);
            }
        }

        return isValid;
    },

    /**
     * @return false if required value is not specified.
     */
    validateRequired : function(panel , itemId, type, errors) {
        var me = this,
            currentItem = panel.items.get(itemId);

        if (currentItem && !currentItem.getValue()) {
            if(itemId === 'sectionName') {
                errors.push('#{msgs.section_editor_name_required}');
                currentItem.markInvalid('#{msgs.field_editor_field_required}');
            } else if(itemId === 'fieldName') {
                errors.push('#{msgs.field_editor_name_required}');
                currentItem.markInvalid('#{msgs.field_editor_field_required}');
            } else if(itemId === 'buttonAction') {
                errors.push('#{msgs.button_editor_action_required}');
                currentItem.markInvalid('#{msgs.field_editor_field_required}');
            } else if(itemId === 'buttonLabel') {
                errors.push('#{msgs.button_editor_label_required}');
                currentItem.markInvalid('#{msgs.field_editor_field_required}');
            }
            return false;
        }

        return true;
    },

    /**
     * @return false if this formitem edited value matches existing formitem value
     */
    validateDuplicates : function(panel , type , itemId , itemName, errors) {
        var me = this,
            currentItem = panel.items.get(itemId),
            isDuplicateFound = false,
            rootNode = me.formEditor.formItemPanel.getRootNode();

        if (currentItem) {
            var itemValue = currentItem.getValue();
            isDuplicateFound = me.hasDuplicateItem(rootNode, itemValue, itemName, type);

            if (isDuplicateFound) {
                var errorText = Ext.String.format(
                    '#{msgs.field_editor_error_duplicate_form_item}' , type , itemName)
                    errors.push(errorText);
                currentItem.markInvalid(errorText);
            }
        }

        return !isDuplicateFound;
    },

    /**
     * This method will validate dependent application name and attribute.
     * This validaton applicable for inline application form of type create
     */
    validateDependent : function(panel, errors) {
        var value = panel.items.get('value'),
            isValid = true;

        if(value) {
            if(value.fieldpropertyCombo.getValue() === value.DEPENDENT) {
                var fieldAppDependent = panel.items.get('value').fieldAppDependent;
                if(!fieldAppDependent.items[0].getValue()) {
                    errors.push('#{msgs.dependent_app_name_required}');
                    fieldAppDependent.items[0].markInvalid('#{msgs.field_editor_field_required}');
                    isValid = false;
                }
                if(!fieldAppDependent.items[1].getValue()) {
                    errors.push('#{msgs.dependent_attr_name_required}');
                    fieldAppDependent.items[1].markInvalid('#{msgs.field_editor_field_required}');
                    isValid = false;
                }
            }
        }
        return isValid;
    },

    /**
     * Check for duplicate form item value for given property
     */
    hasDuplicateItem : function(node, itemValue, itemName, type) {
        var me = this,
            isDuplicate;

        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                var firstLevelNode = node.childNodes[i];
                var item = firstLevelNode.get(me.PROPERTIES);
                if(item[itemName] === itemValue && firstLevelNode.data.formItemType === type &&
                   !firstLevelNode.nodeEditing) {
                    return true;
                }
                isDuplicate = me.hasDuplicateItem(firstLevelNode, itemValue, itemName, type);
                if (isDuplicate) {
                    break;
                }
            }
        }
        return isDuplicate;
    },

    /**
     * List all formitems of the form.
     */
    getExistingFormItems : function(type) {
        var me = this, 
            treeView = me.formEditor.formItemPanel.getView(),
            records = treeView.getRecords(treeView.getNodes()),
            formitems = [];

        for (var i = 0; i < records.length; i++) {
            if (type === records[i].get(me.FORM_ITEM_TYPE)) {
                formitems.push(records[i]);
            }
        }

        return formitems;
    },

    /**
     * Strict equal operation for 2 parameters to confirm content equality
     * here we can check equality for below type of parameters
     * 1. String
     * 2. Boolean
     * 3. Array
     */
    isEqual : function(param1, param2) {
        if((!param1 && param2 === false) || (!param2 && param1 === false)) {
            return true;
        }
        if(!param1 && param1 !== false) {
            param1 = '';
        }
        if(!param2 && param2 !== false) {
            param2 = '';
        }
        if(param1.toString() === param2.toString()) {
            return true;
        } else {
            return false;
        }
    }
});
