Ext.define('SailPoint.systemSetup.RequestAccessOptionsModal', {
    extend: 'SailPoint.systemSetup.DefaultOptionsModal',
    
    constructor : function(record) {
        this.callParent(arguments);
        if (record['options']) {
            this.allowRequestRoles = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestRoles']);
            this.allowRequestRolesAdditionalAccountRequests = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestRolesAdditionalAccountRequests']);
            this.allowRequestRolesShowPopulation = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestRolesShowPopulation']);
            this.allowRequestEntitlements = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestEntitlements']);
            this.allowRequestEntitlementsAdditionalAccountRequests = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestEntitlementsAdditionalAccountRequests']);
            this.allowRequestEntitlementsShowPopulation = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestEntitlementsShowPopulation']);
            this.allowRequestRolesRemove = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestRolesRemove']);
            this.allowRequestEntitlementsRemove = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowRequestEntitlementsRemove']);
        }

        var newPanel = Ext.create('Ext.form.Panel', {
          bodyPadding: 10,
          width: 600,
          items: [
              {
                  xtype: 'fieldcontainer',
                  defaultType: 'checkboxfield',
                  items: [
                      {
                          boxLabel  : '#{msgs.request_type_roles_request}',
                          name      : 'requestRoles',
                          id        : 'allowRequestRoles',
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestRoles" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_roles}" />',
                          checked   : this.allowRequestRoles,
                          handler   : function(checkbox, checked) {
                              if (checked) {
                                  Ext.getCmp('allowRequestRolesAdditionalAccountRequests').enable();
                                  Ext.getCmp('allowRequestRolesShowPopulation').enable();
                              }
                              else {
                                  Ext.getCmp('allowRequestRolesAdditionalAccountRequests').disable();
                                  Ext.getCmp('allowRequestRolesShowPopulation').disable();
                              }
                          }
                      },
                      {
                          boxLabel  : '#{msgs.lcm_request_roles_allow_addt_acct_requests}',
                          name      : 'allowRequestRolesAdditionalAccountRequestsCheckBox',
                          id        : 'allowRequestRolesAdditionalAccountRequests',
                          checked   : this.allowRequestRolesAdditionalAccountRequests,
                          disabled  : !this.allowRequestRoles,
                          margin: '0 0 0 20',
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestRolesAdditionalAccountRequests" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_roles_allow_addt_acct_requests}" />'
                      },
                      {
                          boxLabel  : '#{msgs.lcm_request_roles_allow_show_population_percents}',
                          name      : 'allowRequestRolesShowPopulationCheckBox',
                          id        : 'allowRequestRolesShowPopulation',
                          checked   : this.allowRequestRolesShowPopulation,
                          disabled  : !this.allowRequestRoles,
                          margin: '0 0 0 20',
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestRolesShowPopulation" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_roles_show_population}" />'
                      },
                      { xtype: 'tbspacer', height: 20 },
                      {
                          boxLabel  : '#{msgs.request_type_entitlements_request}',
                          name      : 'allowRequestEntitlementsCheckBox',
                          id        : 'allowRequestEntitlements',
                          checked   : this.allowRequestEntitlements,
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestEntitlements" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_entitlements}" />',
                          handler   : function(checkbox, checked) {
                              if (checked) {
                                  Ext.getCmp('allowRequestEntitlementsAdditionalAccountRequests').enable();
                                  Ext.getCmp('allowRequestEntitlementsShowPopulation').enable();
                              }
                              else {
                                  Ext.getCmp('allowRequestEntitlementsAdditionalAccountRequests').disable();
                                  Ext.getCmp('allowRequestEntitlementsShowPopulation').disable();
                              }
                          }
                      },
                      {
                          boxLabel  : '#{msgs.lcm_request_roles_allow_addt_acct_requests}',
                          name      : 'allowRequestEntitlementsAdditionalAccountRequestsCheckBox',
                          id        : 'allowRequestEntitlementsAdditionalAccountRequests',
                          checked   : this.allowRequestEntitlementsAdditionalAccountRequests,
                          disabled  : !this.allowRequestEntitlements,
                          margin: '0 0 0 20',
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestEntitlementsAdditionalAccountRequests" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_entitlements_allow_addt_acct_requests}" />'
                      },
                      {
                          boxLabel  : '#{msgs.lcm_request_entitlements_allow_show_population_percents}',
                          name      : 'allowRequestEntitlementsShowPopulationCheckBox',
                          id        : 'allowRequestEntitlementsShowPopulation',
                          checked   : this.allowRequestEntitlementsShowPopulation,
                          disabled  : !this.allowRequestEntitlements,
                          margin: '0 0 0 20',
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestEntitlementsShowPopulation" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_request_entitlements_show_population}" />'
                      },
                      { xtype: 'tbspacer', height: 20 },
                      {
                          boxLabel  : '#{msgs.lcm_config_allow_remove_request_roles}',
                          name      : 'allowRequestRolesRemoveCheckBox',
                          id        : 'allowRequestRolesRemove',
                          checked   : this.allowRequestRolesRemove,
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestRolesRemove" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_config_allow_remove_roles}" />'
                      },
                      {
                          boxLabel  : '#{msgs.lcm_config_allow_remove_request_entitlements}',
                          name      : 'allowRequestEntitlementsRemoveCheckBox',
                          id        : 'allowRequestEntitlementsRemove',
                          checked   : this.allowRequestEntitlementsRemove,
                          afterBoxLabelTpl: '<img id="imgHlpAllowRequestEntitlementsRemove" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_config_allow_remove_entitlements}" />'
                      }
                  ]
              }
          ]
        });
        this.items.add(newPanel);
    },
    //override to add manage account options
    getSelectedOptions : function() {
      var options = this.callParent(arguments);
      options['allowRequestRoles'] = Ext.getCmp('allowRequestRoles').getValue();
      options['allowRequestRolesAdditionalAccountRequests'] = Ext.getCmp('allowRequestRolesAdditionalAccountRequests').getValue();
      options['allowRequestRolesShowPopulation'] = Ext.getCmp('allowRequestRolesShowPopulation').getValue();
      options['allowRequestEntitlements'] = Ext.getCmp('allowRequestEntitlements').getValue();
      options['allowRequestEntitlementsAdditionalAccountRequests'] = Ext.getCmp('allowRequestEntitlementsAdditionalAccountRequests').getValue();
      options['allowRequestEntitlementsShowPopulation'] = Ext.getCmp('allowRequestEntitlementsShowPopulation').getValue();
      options['allowRequestRolesRemove'] = Ext.getCmp('allowRequestRolesRemove').getValue();
      options['allowRequestEntitlementsRemove'] = Ext.getCmp('allowRequestEntitlementsRemove').getValue();
      return options;
    },
    validate : function() {
        var parentValidate = this.callParent(arguments);
        if (!parentValidate) {
            return false;
        }
        else if (!Ext.getCmp('allowRequestRoles').getValue()
            && !Ext.getCmp('allowRequestEntitlements').getValue()
            && !Ext.getCmp('allowRequestRolesRemove').getValue()
            && !Ext.getCmp('allowRequestEntitlementsRemove').getValue()) {
          Ext.Msg.alert('#{err_dialog_title}', '#{lcm_request_access_no_options_selected_warning}');
          return false;
        } 
        else {
          return true;
        }
      }
});
