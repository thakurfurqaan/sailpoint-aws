/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.systemSetup', 'SailPoint.systemSetup.lcm');

SailPoint.systemSetup.lcm.SELECTOR_TYPES = {
    role: 'role',
    application: 'application',
    managedAttribute: 'managedAttribute'
};

Ext.define('SailPoint.systemSetup.lcm.ActionsPanelControls', {
    extend : 'Ext.Component',
    actionPanel: null,
    attributeFilterBuilder: null,
    
    constructor: function(config) {
        this.actionPanel = config.actionPanel;
        this.type = config.type;
        this.rowsToHide = {};
        
        this.callParent(arguments);
    }, 
    
    load: function() {
        if (this.type !== 'selfService') {
            this.attributeFilterBuilder = new SailPoint.systemSetup.lcm.AttributeFilterBuilder({
                renderTo: this.type + 'AttributeSelectorPanel',
                filterBinding: 'editForm:' + this.type + 'AttributeControlFilter',
                errorPanel: this.type + 'AttributeSelectorErrors'
            });
            this.applyAttributeControl();
            if (this.type === 'manager') {
                this.applySubordinateControl();
            }
            this.applyCustomControl();
            this.applyAllowAll();
            this.applyPopulationDisplayControl();
        }
        
        this.roleRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'RoleSelectorRuleDiv', null, '#{msgs.select_rule}', { 
                id: this.type + 'RoleRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'RoleSelectorRule',
                formBinding: 'editForm',
                renderTo: this.type + 'RoleSelectorRuleDiv'
            });
        this.setInitialValue(this.roleRuleSelector, Ext.getDom('editForm:' + this.type + 'RoleSelectorRule'), Ext.getDom('editForm:' + this.type + 'RoleSelectorRuleName'));

        this.applicationRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'ApplicationRoleSelectorRuleDiv', null, '#{msgs.select_rule}', {
                id: this.type + 'ApplicationRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'ApplicationSelectorRule',
                formBinding: 'editForm',
                renderTo: this.type + 'ApplicationSelectorRuleDiv'
            });
        this.setInitialValue(this.applicationRuleSelector, Ext.getDom('editForm:' + this.type + 'ApplicationSelectorRule'), Ext.getDom('editForm:' + this.type + 'ApplicationSelectorRuleName'));

        this.managedAttributeRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', this.type + 'ManagedAttributeRoleSelectorRuleDiv', null, '#{msgs.select_rule}', {
                id: this.type + 'ManagedAttributeRuleSelectorSuggest',
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: this.type + 'ManagedAttributeSelectorRule',
                formBinding: 'editForm',
                renderTo: this.type + 'ManagedAttributeSelectorRuleDiv'
            });
        this.setInitialValue(this.managedAttributeRuleSelector, Ext.getDom('editForm:' + this.type + 'ManagedAttributeSelectorRule'), Ext.getDom('editForm:' + this.type + 'ManagedAttributeSelectorRuleName'));
        
        this.applyRuleSelectorControls();
    },
    
    setInitialValue : function(ruleSuggest, idElement, nameElement) {
        var id = idElement.value;
        if (id && id.length > 0) {
            var name = nameElement.value;
            ruleSuggest.setValue(id);
            ruleSuggest.setRawValue(name);            
        }
    },
    
    applyAllowAll: function() {
        // Hide or show all the requst control options depending on whether we're going to allow or disallow
        // anyone to make requests for anyone else
        var popDefType = getSelectedRadioInput('editForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');
        var optionsTable = Ext.getDom(this.type + 'RequestControlOptionsTbl');
        optionsTable.style['display'] = isAllowAll ? 'none' : '';
    },
    
    applyAttributeControl: function() {
        var enableAttributeControl = Ext.getDom('editForm:' + this.type + 'EnableAttributeControl').checked;

        if (enableAttributeControl) {
            Ext.getDom(this.type + 'AttributeSelectorRow').style['display'] = '';
            this.rowsToHide[this.type + 'AttributeSelectorRow'] = false;
        } else {
            Ext.getDom(this.type + 'AttributeSelectorRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'AttributeSelectorRow'] = true;
        }   
    },
    
    applySubordinateControl: function() {
        var enableSubordinateControl = Ext.getDom('editForm:' + this.type + 'EnableSubordinateControl').checked;
        var subordinateChoice = getSelectedRadioInput('editForm:' + this.type + 'SubordinateChoice');
        
        if (enableSubordinateControl) {
            Ext.getDom(this.type + 'SubordinateChoicesRow').style['display'] = '';
            this.rowsToHide[this.type + 'SubordinateChoicesRow'] = false;
            if (subordinateChoice === 'directOrIndirect') {
                Ext.getDom(this.type + 'SubordinateHierarchyLevelRow').style['display'] = '';
                this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = false;
            } else {
                Ext.getDom(this.type + 'SubordinateHierarchyLevelRow').style['display'] = 'none';
                this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = true;                
            }
        } else {
            Ext.getDom(this.type + 'SubordinateChoicesRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'SubordinateChoicesRow'] = true;
            Ext.getDom(this.type + 'SubordinateHierarchyLevelRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'SubordinateHierarchyLevelRow'] = true;
        }
    },
    
    applyCustomControl: function() {
        var enableCustomControl = Ext.getDom('editForm:' + this.type + 'EnableCustomControl').checked;

        if (enableCustomControl) {
            Ext.getDom(this.type + 'CustomFilterRow').style['display'] = '';
            this.rowsToHide[this.type + 'CustomFilterRow'] = false;
        } else {
            Ext.getDom(this.type + 'CustomFilterRow').style['display'] = 'none';
            this.rowsToHide[this.type + 'CustomFilterRow'] = true;            
        }
    },
    
    applyPopulationDisplayControl: function() {
        var enablePopulationDisplayControl = this.isPopulationDisplayEnabled();
        if (this.type !== 'selfService') {
            Ext.getDom(this.type + 'RequestControlsTable').style['display'] = enablePopulationDisplayControl ? '' : 'none';
        }
    },
    
    applyRuleSelectorControls: function() {
        var isRequestAccessEnabled = Ext.getDom('editForm:' + this.type + 'RequestAccess').checked;
        var isRoleRequestEnabled = Ext.getDom('editForm:' + this.type + 'RequestRoles').checked;
        var isEntitlementRequestEnabled = 
            Ext.getDom('editForm:' + this.type + 'RequestEntitlements').checked;
            
        var rowsToShowOrHide;
        var i;
        
        if (isRequestAccessEnabled && (isRoleRequestEnabled || isEntitlementRequestEnabled)) {
            Ext.getDom(this.type + 'ObjectControlsTable').style['display'] = '';
        } else {
            Ext.getDom(this.type + 'ObjectControlsTable').style['display'] = 'none';
        }
        
        rowsToShowOrHide = Ext.DomQuery.select('tr[class*=' + this.type + 'RoleControlsTable]', Ext.getDom(this.type + 'ObjectControlsTable'));
        if (isRoleRequestEnabled) {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = '';
            }
        } else {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = 'none';
            }
        }
        
        rowsToShowOrHide = Ext.DomQuery.select('tr[class*=' + this.type + 'EntitlementControlsTable]', Ext.getDom(this.type + 'ObjectControlsTable'));
        if (isEntitlementRequestEnabled) {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = '';
            }
        } else {
            for (i = 0; i < rowsToShowOrHide.length; ++i) {
                rowsToShowOrHide[i].style['display'] = 'none';
            }
        }
    },
    
    /**
     * This is called when the "Request Entitlements" checkbox is toggled.
     */
    requestEntitlementsToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.actionToggled('RequestEntitlements', checkbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.application);
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.managedAttribute);
        }
        
        this.requestAccessOptionToggled();
    },
    
    
    /**
     * This is called when the "Request Roles" checkbox is toggled.
     */
    requestRolesToggled: function() {
        var requestRolesCheckbox = Ext.getDom('editForm:' + this.type + 'RequestRoles');
        
        var isEnabled = requestRolesCheckbox.checked;
        this.actionToggled('RequestRoles', requestRolesCheckbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.role);
        }
        
        this.requestAccessOptionToggled();
    },
    
    
    /**
     * One of the request access options was toggled, show/hide the warning
     * appropriately.
     */
    requestAccessOptionToggled: function() {

        var warn = false;
        
        // If "Request Access" is not enabled, don't show the warning.
        var requestAccessCheckbox = Ext.getDom('editForm:' + this.type + 'RequestAccess');
        if (requestAccessCheckbox.checked) {
            var requestRolesCheckbox = Ext.getDom('editForm:' + this.type + 'RequestRoles');
            var requestEntitlementsCheckbox = Ext.getDom('editForm:' + this.type + 'RequestEntitlements');
    
            // Show a warning if neither option is enabled.
            warn = !requestRolesCheckbox.checked && !requestEntitlementsCheckbox.checked;
        }

        Ext.getDom(this.type + 'RequestAccessWarning').style['display'] = (warn) ? '' : 'none';
        this.applyRuleSelectorControls();
    },
    
    /**
     * This is called when the "Request Access" checkbox is toggled.
     */
    requestAccessToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.actionToggled('RequestAccess', checkbox);
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.access);
            // Auto-check the "request roles" checkbox when this
            // is enabled.  This should be the default behavior.
            var requestRolesCheckbox = Ext.getDom('editForm:' + this.type + 'RequestRoles');
            requestRolesCheckbox.checked = true;
        }
        
        // Pretend like this option was toggled since we may have just changed
        // the value.  Even if it wasn't changed, we still want to call this so
        // the the warning will get shown/hidden based on whether Request Access
        // is enabled or not.
        this.requestRolesToggled();
    },

    /**
     * This is called when the "Manage Accounts" checkbox is toggled.
     */
    manageAccountsToggled: function(checkbox) {
        this.actionToggled('ManageAccounts', checkbox);

        // Auto-check the "allow managing existing accounts" checkbox when this
        // is enabled.  This should be the default behavior.
        if (checkbox.checked) {
            var existingAcctCheckbox = Ext.getDom('editForm:' + this.type + 'AllowManageExistingAccounts');
            existingAcctCheckbox.checked = true;
        }

        // Pretend like this option was toggled since we may have just changed
        // the value.  Even if it wasn't changed, we still want to call this so
        // the the warning will get shown/hidden based on whether Manage Accounts
        // is enabled or not.
        this.manageExistingAccountsToggled();
    },
    
    /**
     * The action with the given name was toggled.
     */
    actionToggled: function(action, checkbox) {

        // Show the population controls if this is enabled. 
        this.applyPopulationDisplayControl();
        
        // Show the rule controls if this is enabled.
        this.applyRuleSelectorControls();

        // Show/hide the sub-options for the action if this is enabled/dissabled.
        var suboptions = Ext.getDom(this.type + action + 'Suboptions');
        if (suboptions) {
            suboptions.style['display'] = checkbox.checked ? '' : 'none';
        }
    },
    
    /**
     * This is called when the "allow managing existing accounts" checkbox is
     * toggled, and will show/hide a warning appropriately.
     */
    manageExistingAccountsToggled: function() {
        this.manageAccountsOptionToggled();
    },
    
    /**
     * This is called when the "allow managing existing accounts" checkbox is
     * toggled, and will show/hide a warning appropriately.
     */
    allowAccountOnlyRequestsToggled: function(checkbox) {
        var isEnabled = checkbox.checked;
        this.manageAccountsOptionToggled();
        
        // Enable/disable the "additional account request" control appropriately.
        var addtAccts = this.getManageAccountsAddtAccountCheckbox();
        if (!checkbox.checked) {
            addtAccts.originalChecked = addtAccts.checked;
            addtAccts.checked = false;
            addtAccts.disabled = true;
            this.setManageAccountsAdditionalAccountRequestProxy();
        } else {
            if (addtAccts.originalChecked) {
                addtAccts.checked = addtAccts.originalChecked;
            }
            addtAccts.disabled = false;
            this.setManageAccountsAdditionalAccountRequestProxy();
        }
        if (addtAccts.checked) {
          addtAccts.removeAttribute('checked');
        }
        if (isEnabled) {
            this.applyDefaultToSelector(SailPoint.systemSetup.lcm.SELECTOR_TYPES.application);
        }
    },
    
    /**
     * One of the manage accounts options was toggled, show/hide the warning
     * appropriately.
     */
    manageAccountsOptionToggled: function() {

        var warn = false;
        
        // If "Manage Accounts" is not enabled, don't show the warning.
        var manageAcctsCheckbox = Ext.getDom('editForm:' + this.type + 'ManageAccounts');
        if (manageAcctsCheckbox.checked) {
            var existingAcctCheckbox = Ext.getDom('editForm:' + this.type + 'AllowManageExistingAccounts');
            var newAcctCheckbox = this.getAccountOnlyCheckbox();
    
            // Show a warning if neither option is enabled.
            warn = !existingAcctCheckbox.checked && !newAcctCheckbox.checked;
        }

        Ext.getDom(this.type + 'ManageAccountsWarning').style['display'] = (warn) ? '' : 'none';
        this.applyRuleSelectorControls();
    },
    
    setManageAccountsAdditionalAccountRequestProxy: function() {
      var proxy = Ext.getDom('editForm:' + this.type + 'ManageAccountsAllowAdditionalAccountRequestsProxy');

      var val = this.getManageAccountsAddtAccountCheckbox();
      
      proxy.value = val.checked;
    },

    getAccountOnlyCheckbox: function() {
        return Ext.getDom('editForm:' + this.type + 'AllowAccountOnlyRequests');
    },

    getRequestRolesAddtAccountCheckbox: function() {
        return Ext.getDom('editForm:' + this.type + 'RequestRolesAllowAdditionalAccountRequests');
    },

    getRequestEntitlementsAddtAccountCheckbox: function() {
        return Ext.getDom('editForm:' + this.type + 'RequestEntitlementsAllowAdditionalAccountRequests');
    },

    getManageAccountsAddtAccountCheckbox: function() {
        return Ext.getDom('editForm:' + this.type + 'ManageAccountsAllowAdditionalAccountRequests');
    },
    
    getCustomCriteria: function() {
        var enableCustomControl;
        var customCriteria;
        if (this.type === 'selfService') {
            enableCustomControl = false;
        } else {
            enableCustomControl = Ext.getDom('editForm:' + this.type + 'EnableCustomControl').checked;
        }
        if (enableCustomControl) {
            customCriteria = Ext.getDom('editForm:' + this.type + 'CustomFilterInput').value;
        } else {
            customCriteria = ''; 
        }

        return customCriteria;
    },
    
    getCustomCriteriaComponentId: function() {
        return this.type + 'CustomFilterError';
    }, 

    save: function() {
        if (this.attributeFilterBuilder) {
            this.attributeFilterBuilder.save();
        }
    },
    
    validate: function(errors, warnings) {
        var enabledOptions = this.getEnabledOptions();
        var popDefType = getSelectedRadioInput('editForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');
        var i;
        
        // If the population controls are enabled then at least one needs to be configured
        if (enabledOptions.numEnabledOptions === 0 && this.isPopulationDisplayEnabled()) {
            errors.push('#{msgs.err_lcm_config_population_control_options_unspecified}');
        }
        
        if (this.isPopulationDisplayEnabled() && !isAllowAll) {
            if (Ext.getDom('editForm:' + this.type + 'EnableAttributeControl').checked) {
                var builderErrors = this.attributeFilterBuilder.validate();
                for (i = 0; i < builderErrors.length; i++) {
                    errors.push(builderErrors[i]);
                }
            }
    
            if (this.type === 'manager' && Ext.getDom('editForm:' + this.type + 'EnableSubordinateControl').checked) {
                if (isNaN(Ext.getDom('editForm:' + this.type + 'SubordinateMaxHierarchy').value)) {
                    errors.push('#{msgs.err_lcm_config_max_hierachy_value_nan}');
                }
            }
            
            if (Ext.getDom('editForm:' + this.type + 'EnableCustomControl').checked
                && (!Ext.getDom('editForm:' + this.type + 'CustomFilterInput').value
                    || Ext.getDom('editForm:' + this.type + 'CustomFilterInput').value.length === 0)) {
                errors.push('#{msgs.err_lcm_config_custom_filter_requires_input}');
            }
        }
        
        // Error if additional accounts are enabled but none have been selected.
        if ((this.getRequestEntitlementsAddtAccountCheckbox().checked ||
             this.getManageAccountsAddtAccountCheckbox().checked) &&
            !Ext.getCmp(SailPoint.systemSetup.lcm.ADDITIONAL_ACCOUNT_APPS_COMPONENT).hasValue() &&
            !this.actionPanel.hasAddtAcctError) {
            warnings.push('#{msgs.err_lcm_config_no_addt_acct_apps}');
            this.actionPanel.hasAddtAcctError = true;
        }

        // Error if account only is enabled but no apps have been selected.
        if (this.getAccountOnlyCheckbox().checked &&
            !Ext.getCmp(SailPoint.systemSetup.lcm.ACCOUNT_ONLY_APPS_COMPONENT).hasValue() &&
            !this.actionPanel.hasAcctOnlyError) {
            warnings.push('#{msgs.err_lcm_config_no_acct_only_apps}');
            this.actionPanel.hasAcctOnlyError = true;
        }
    },

    getEnabledOptions: function() {
        var enabledOptions = {};
        var numEnabledOptions = 0;
        var popDefType = getSelectedRadioInput('editForm:' + this.type + 'PopulationDefinitionType');
        var isAllowAll = (popDefType === 'allowAnythingFromAnyone');

        if (this.type !== 'selfService') {
            if (isAllowAll) {
                enabledOptions['allowAll'] = true;
                numEnabledOptions++;
            }
            
            if (Ext.getDom('editForm:' + this.type + 'EnableAttributeControl').checked) {
                enabledOptions['enableAttributeControl'] = true;
                numEnabledOptions++;
            }
            
            
            if (this.type === 'manager' && Ext.getDom('editForm:' + this.type + 'EnableSubordinateControl').checked) {
                enabledOptions['enableSubordinateControl'] = true;
                numEnabledOptions++;
            }
            
            if (Ext.getDom('editForm:' + this.type + 'EnableAttributeControl').checked) {
                enabledOptions['enableAttributeControl'] = true;
                numEnabledOptions++;
            }
            
            if (Ext.getDom('editForm:' + this.type + 'EnableCustomControl').checked) {
                enabledOptions['enableCustomControl'] = true;
                numEnabledOptions++;
            }
        }
        
        enabledOptions['numEnabledOptions'] = numEnabledOptions;
        
        return enabledOptions;
    },
    
    isPopulationDisplayEnabled: function() {
        var enablePopulationDisplayControl = false;
        
        var actions = Ext.DomQuery.select('.quickLinkCheckbox', Ext.getDom(this.type + 'ActionsTable'));
        var i;
        
        if (this.type !== 'selfService') {
            for (i = 0; i < actions.length; ++i) {
                enablePopulationDisplayControl |= actions[i].checked;
            }
        }
        
        return enablePopulationDisplayControl;
    },
    
    updateRuleSelector: function() {
        this.roleRuleSelector.getStore().load();
        this.applicationRuleSelector.getStore().load();
        this.managedAttributeRuleSelector.getStore().load();
    },
    
    /**
     * Forces the selector to pick the default 'Requestor's Controlled Scopes' rule if no rule
     * has been selected.  This should only be called when a request capability for a population
     * is newly enabled.  Note that this is only being done at that time because we dont' want to mess
     * with configurations that were established in previous versions of Identity IQ
     */
    applyDefaultToSelector: function(type) {
        var ruleSelector;
        var defaultRuleName;
        var ruleId;
        var match;
        var defaultRule;
        
        if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.role) {
            ruleSelector = this.roleRuleSelector;
            defaultRuleName = 'Objects in Requestor\'s Authorized Scopes';
        } else if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.application) {
            ruleSelector = this.applicationRuleSelector;
            defaultRuleName = 'Objects in Requestor\'s Authorized Scopes';
        } else if (type === SailPoint.systemSetup.lcm.SELECTOR_TYPES.managedAttribute) {
            ruleSelector = this.managedAttributeRuleSelector;
            defaultRuleName = 'All Objects';
        }
        
        if (ruleSelector) {
            ruleId = ruleSelector.getValue();
            if (!ruleId || ruleId.length === 0) {
                match = ruleSelector.getStore().find('displayName', defaultRuleName);
                if (match > -1) {
                    defaultRule = ruleSelector.getStore().getAt(match);
                    ruleSelector.setValue(defaultRule.id);
                    ruleSelector.binding.value = defaultRule.id;
                }
            }
        }
    }
});
