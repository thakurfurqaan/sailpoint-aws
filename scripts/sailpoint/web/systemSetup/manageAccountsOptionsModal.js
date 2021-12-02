Ext.define('SailPoint.systemSetup.ManageAccountsOptionsModal', {
    extend: 'SailPoint.systemSetup.DefaultOptionsModal',

    
    constructor : function(record) {
      this.callParent(arguments);
      if (record['options']) {
          this.allowManageExistingAccounts = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowManageExistingAccounts']);
          this.allowAccountOnlyRequests = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowAccountOnlyRequests']);
          this.allowManageAccountsAdditionalAccountRequests = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowManageAccountsAdditionalAccountRequests']);
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
                        boxLabel  : '#{msgs.lcm_manage_accounts_allow_manage_existing_accounts}',
                        name      : 'allowManageExistingAccountsCheckBox',
                        id        : 'allowManageExistingAccounts',
                        afterBoxLabelTpl: '<img id="imgHlpAllowManageExistingAccounts" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_manage_accounts_allow_manage_existing_accounts}" />',
                        checked   : this.allowManageExistingAccounts
                    },
                    {
                        boxLabel  : '#{msgs.lcm_manage_accounts_allow_account_only_requests}',
                        name      : 'allowAccountOnlyRequestsCheckBox',
                        id        : 'allowAccountOnlyRequests',
                        checked   : this.allowAccountOnlyRequests,
                        afterBoxLabelTpl: '<img id="imgHlpAllowAccountOnlyRequests" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_manage_accounts_allow_account_only_requests}" />',
                        handler   : function(checkbox, checked) {
                            if (checked) {
                                Ext.getCmp('allowManageAccountsAdditionalAccountRequests').enable();
                            }
                            else {
                                Ext.getCmp('allowManageAccountsAdditionalAccountRequests').setValue(false);
                                Ext.getCmp('allowManageAccountsAdditionalAccountRequests').disable();
                            }
                        }
                    },
                    {
                        boxLabel  : '#{msgs.lcm_manage_accounts_allow_addt_acct_requests}',
                        name      : 'allowManageAccountsAdditionalAccountRequestsCheckBox',
                        id        : 'allowManageAccountsAdditionalAccountRequests',
                        checked   : this.allowManageAccountsAdditionalAccountRequests,
                        afterBoxLabelTpl: '<img id="imgHlpAllowManageAccountsAdditionalAccountRequests" src="' + SailPoint.CONTEXT_PATH + '/images/icons/dashboard_help_16.png" alt="#{help.help_lcm_manage_accounts_allow_addt_acct_requests}" />',
                        disabled  : !this.allowAccountOnlyRequests
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
        options['allowManageExistingAccounts'] = Ext.getCmp('allowManageExistingAccounts').getValue();
        options['allowAccountOnlyRequests'] = Ext.getCmp('allowAccountOnlyRequests').getValue();
        options['allowManageAccountsAdditionalAccountRequests'] = Ext.getCmp('allowManageAccountsAdditionalAccountRequests').getValue();

      return options;
    },
    validate : function() {
        var parentValidate = this.callParent(arguments);
        if (!parentValidate) {
            return false;
        }
        else if (!Ext.getCmp('allowManageExistingAccounts').getValue()
            && !Ext.getCmp('allowAccountOnlyRequests').getValue()
            && !Ext.getCmp('allowManageAccountsAdditionalAccountRequests').getValue()) {
          Ext.Msg.alert('#{err_dialog_title}', '#{lcm_manage_accounts_no_options_selected_warning}');
          return false;
        } 
        else {
          return true;
        }
      }
});
