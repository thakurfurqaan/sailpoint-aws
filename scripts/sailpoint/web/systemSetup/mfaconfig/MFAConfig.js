/* (c) Copyright 2017 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This component will display and collect configuration information for a single 
 * multi-factor authentication workflow and its populations.  
 */
Ext.define('SailPoint.systemSetup.mfaconfig.MFAConfig', {
    extend : 'Ext.container.Container',
    mfaConfigObject : null,
    populationMultiSuggest : null,
    workflowEnabledCheckBox : null,
    mfaPopulationsLabel : null,
    mfaPopulationsHelp : null,
    mfaConfigIndex : 0,
    
    layout : {
        type : 'fit'
    },
        
    initComponent : function() {
        
        var populationRecords = [],
            workflowEnabledContainer = Ext.create('Ext.container.Container', {
                id: 'mfa_workflow_enabled_container_' + this.mfaConfigIndex,
                layout: 'column'
            });
        
        this.callParent(arguments);
        this.workflowEnabledCheckBox = Ext.create('Ext.form.field.Checkbox', {
            id: 'mfa_workflow_enabled_checkbox_' + this.mfaConfigIndex,
            checked : this.mfaConfigObject.enabled,

            padding: '2 0 0 0',
            listeners : {
                change : function() {
                    this.parentContainer.populationsPanel.setVisible(this.value);
                    if (this.parentContainer.warningPanel) {
                        this.parentContainer.warningPanel.setVisible(this.value);
                    }
                    this.parentContainer.doLayout();
                    SailPoint.SystemSetup.Login.updateLoginPanel();
                }
            },
            parentContainer : this
        });
        
        workflowEnabledContainer.add(Ext.create('Ext.form.Label', {
            id: 'mfa_workflow_enabled_label_' + this.mfaConfigIndex,
            text: this.mfaConfigObject.workflowName,
            padding: '0 20 0 0'
        }))
        workflowEnabledContainer.add(Ext.create('Ext.Component', {
            id: 'mfa_workflow_enabled_help_' + this.mfaConfigIndex,
            html: '<img src="../images/icons/dashboard_help_16.png" id="mfa_workflow_enabled_help_icon_"'
                + this.mfaConfigIndex + ' alt="" title="' +
                this.mfaPopulationsHelp + '" style="cursor: pointer;"/>',
            padding: '0 20 0 0'
        }))
        workflowEnabledContainer.add(this.workflowEnabledCheckBox)
        this.add(workflowEnabledContainer);

        Ext.define('DynamicScopeModel', {
            extend : 'Ext.data.Model',
            fields : [ {
                name : 'id',
                type : 'string'
            }, {
                name : 'displayName',
                type : 'int',
                convert : null
            }, {
                name : 'displayField',
                type : 'string'
            }, ]
        });

        Ext.each(this.mfaConfigObject.populations, function(population) {
            populationRecords.push(Ext.create('DynamicScopeModel', {
                id : population.id,
                displayName : population.name,
                displayField : population.name
            }));
        });
        
        this.populationsPanel = Ext.create('Ext.panel.Panel', {
            id: 'mfa_populations_panel_' + this.mfaConfigIndex,
            title: this.mfaPopulationsLabel
        });
        
        this.populationMultiSuggest = Ext.create('SailPoint.MultiSuggest', {
            id: 'mfa_populations_suggest_' + this.mfaConfigIndex,
            suggestType : 'dynamicScope',
            jsonData : {
                totalCount : 0,
                objects : null
            },
            margin: '10 10 10 10',
            width : 300
        });
        this.populationsPanel.setVisible(this.workflowEnabledCheckBox.value)
        this.populationMultiSuggest.selectedStore.add(populationRecords)
        this.populationsPanel.add(this.populationMultiSuggest);
        this.add(this.populationsPanel);
        
        if (!this.mfaConfigObject.fullyConfigured) {
            this.warningPanel = Ext.create('Ext.panel.Panel', {
                id: 'mfa_warning_panel_' + this.mfaConfigIndex,
                title: '#{msgs.warning_dialog_title}'
            });
            this.warningPanel.setVisible(this.workflowEnabledCheckBox.value);
            this.warningPanel.add(Ext.create('Ext.Component', {
                html: Ext.String.format('#{msgs.mfa_incomplete_configuration_warning}', this.mfaConfigObject.workflowName),
                padding: '0 20 0 0'
            }))
            this.warningPanel.add(Ext.create('Ext.Component', {
                html: '<a onclick="javascript:document.getElementById(\'configForm:jumpToBPELink\').click();">#{msgs.title_workflows}</a>',
                padding: '0 20 0 0'
            }))

            this.add(this.warningPanel);
        }
    },

    prepareToPersist : function() {
        var populationCount = 
            this.populationMultiSuggest.selectedStore.getCount();
            mfaPopulations = [];
            
        this.mfaConfigObject.enabled = this.workflowEnabledCheckBox.value;

        for (var i = 0; i < populationCount; i++) {
            var population = {},
                populationRecord = this.populationMultiSuggest.selectedStore
                    .getAt(i);
            population.id = populationRecord.get('id');
            population.name = populationRecord.get('displayField');
            mfaPopulations.push(population);
        }
        this.mfaConfigObject.populations = mfaPopulations;
    }
});