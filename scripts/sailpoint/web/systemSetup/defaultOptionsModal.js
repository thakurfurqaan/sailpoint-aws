Ext.define('SailPoint.systemSetup.DefaultOptionsModal', {
    extend: 'Ext.window.Window',
    
    closable: false,
    resizable: false,
    draggable: false,
    modal: true,
    isSelfCapable: true,
    isOtherCapable: true,
    isBulkCapable: true,
    allowSelf : false,
    allowOther : false,
    allowBulk : false,
    quickLinkId : null,
    padding: 0,
    border: 0,
    header: {
      height: 50,
      padding: 10  
    },
    
    dockedItems: [{
      xtype: 'toolbar',
      dock: 'bottom',
      padding: 10,
      border: 0,
      items: [
              {
                text: '#{msgs.nav_save}',
                cls : 'primaryBtn',        
                handler: function() {
                  Ext.getCmp('qlpOptionsPopup').save();
                }
              },{
                text: '#{msgs.nav_cancel}',
                cls : 'secondaryBtn',
                margin: '0 0 0 10',
                handler: function() {
                  Ext.getCmp('qlpOptionsPopup').close();
                }
              }
      ]
    }],
    statics: {
        isTrue: function(obj) {
            return (obj === true || obj === "true") ? true : false;
        }
    },
        
    constructor : function(record) {
        this.callParent(arguments);
        this.quickLinkId = record['quickLinkId'];
        if (record['options']) {
          this.allowSelf = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowSelf']);
          this.allowOther = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowOther']);
          this.allowBulk = SailPoint.systemSetup.DefaultOptionsModal.isTrue(record['options']['allowBulk']);
        }
        var mainPanel = Ext.create('Ext.form.Panel', {
          bodyPadding: 10,
          width: 600,
          items: [
                  {
                    xtype: 'fieldcontainer',
                    defaultType: 'checkboxfield',
                    items: [
                        {
                            boxLabel  : '#{msgs.qlp_popup_for_self}',
                            name      : 'allowSelf',
                            id        : 'allowSelf',
                            type      : 'checkboxfield', 
                            checked   : this.allowSelf,
                            hidden    : !this.isSelfCapable
                        }, { xtype: 'tbspacer', height: 5 }, {
                            boxLabel  : '#{msgs.qlp_popup_for_others}',
                            name      : 'allowOthers',
                            id        : 'allowOthers',
                            type      : 'checkboxfield', 
                            checked   : this.allowOther || this.allowBulk,
                            handler: function() {
                              if (!this.checked) {
                                Ext.getCmp('allowOther').setValue(false);
                                Ext.getCmp('allowBulk').setValue(false);
                              }
                            }
                        }
                    ]
                },
                {
                  xtype: 'fieldcontainer',
                  layout: 'hbox',
                  width: 150,
                  margin: '0 0 0 20',
                  defaults: {
                    flex: 1
                  },
                  defaultType: 'radiofield',
                  items: [
                      {
                          boxLabel  : '#{msgs.qlp_popup_for_others_single}',
                          name      : 'allowOthersRadio',
                          id        : 'allowOther',
                          inputValue: 'allowOther',
                          type      : 'radiofield', 
                          checked   : this.allowOther,
                          hidden    : !this.isOtherCapable,
                          handler: function() {
                            if (this.checked) {
                              Ext.getCmp('allowOthers').setValue(true);
                            }
                          }
                      }, {
                          boxLabel  : '#{msgs.qlp_popup_for_others_bulk}',
                          name      : 'allowOthersRadio',
                          id        : 'allowBulk',
                          inputValue: 'allowBulk',
                          type      : 'radiofield', 
                          checked   : this.allowBulk,
                          hidden    : !this.isBulkCapable,
                          handler: function() {
                            if (this.checked) {
                              Ext.getCmp('allowOthers').setValue(true);
                            }
                          }
                      }
                  ]
              }
              
          ]
        });
        this.items.add(mainPanel);
    },
    
    getSelectedOptions : function() {
      var options = {};
      options['allowSelf'] = Ext.getCmp('allowSelf').getValue();
      options['allowOther'] = Ext.getCmp('allowOther').getValue();
      options['allowBulk'] = Ext.getCmp('allowBulk').getValue();
      return options;
    },
    
    validate : function() {
      if (Ext.getCmp('allowOthers').getValue() 
          && ! Ext.getCmp('allowOther').getValue()
          && ! Ext.getCmp('allowBulk').getValue()) {
        Ext.Msg.alert('#{err_dialog_title}', '#{qlp_popup_error_msg_select_one_for_others}');
        return false;
      } else if (!Ext.getCmp('allowSelf').getValue() 
          && ! Ext.getCmp('allowOther').getValue()
          && ! Ext.getCmp('allowBulk').getValue()) {
        Ext.Msg.alert('#{err_dialog_title}', '#{qlp_popup_error_msg_select_one}');
        return false;
      } else {
        return true;
      }
    },
    
    save : function() {
      if (!this.validate()) {
        return;
      }
      var options = this.getSelectedOptions();
      Ext.getCmp('qlpQuicklinksGrid').setSelectedQlo(this.quickLinkId, options);
      this.close();
    }
});
