Ext.define('SailPoint.WorkItemConfigPanel', {
    extend : 'Ext.panel.Panel', 

    //workItemOwnerMultiSuggest: null,
    
    workItemConfigObj : null,
    
    workItemOpenFields: null,
    
    initComponent : function(){
      
      this.workItemOpenFields = Ext.create('Ext.panel.Panel', {
        id: 'workItemOpenFields',
        items: [
          /** Escalation **/
          {xtype: 'fieldset', title: '#{msgs.label_escalation}',id: 'workItemEscalation', cls:'',  
          items: [
            {xtype: 'radio',boxLabel: '#{msgs.item_label_none}', name:this.id, id: 'workItemEscalation_none', inputValue: 'none', labelStyle: 'display:none', listeners:{change: {fn: this.workItemEscalationStyleToggle, scope: this},s: {fn: this.workItemEscalationStyleToggle, scope: this}}},
            {xtype: 'radio',boxLabel: '#{msgs.item_label_send_reminders}', name:this.id, id: 'workItemEscalation_reminder', inputValue: 'reminder', labelStyle: 'display:none', listeners:{change: {fn: this.workItemEscalationStyleToggle, scope: this},afterrender: {fn: this.workItemEscalationStyleToggle, scope: this}}},
            {xtype: 'radio',boxLabel: '#{msgs.item_label_reminders_escalation}', name:this.id, id: 'workItemEscalation_both', inputValue: 'both', labelStyle: 'display:none', listeners:{change: {fn: this.workItemEscalationStyleToggle, scope: this},afterrender: {fn: this.workItemEscalationStyleToggle, scope: this}}},
            {xtype: 'radio',boxLabel: '#{msgs.item_label_escalation_only}', name:this.id, id: 'workItemEscalation_escalation', inputValue: 'escalation', labelStyle: 'display:none', listeners:{change: {fn: this.workItemEscalationStyleToggle, scope: this},afterrender: {fn: this.workItemEscalationStyleToggle, scope: this}}}
          ]},

            {xtype: 'fieldset', id: 'reminderFields', layout: 'vbox',
                items: [
                  /** Days Before First Reminder **/
                  {xtype:'textfield', fieldLabel:'#{msgs.label_days_before_first_reminder}',
                      name: 'workItemReminderStart', id: 'workItemReminderStart', width:140},

                  /** Reminder Frequency **/
                  {xtype:'textfield', fieldLabel:'#{msgs.label_reminder_frequency}', name: 'workItemReminderFreq',
                      id: 'workItemReminderFreq', width:140},

                  /** Reminder Email Template **/
                  {xtype: 'combo', fieldLabel:'#{msgs.label_reminder_email_template}', labelStyle:'margin-right:16px',
                   style: 'display:inline',
                   name: 'workItemReminderTemplate',
                   id: 'workItemReminderTemplate',
                   width: 350,
                   store:this.window.panel.parent.editor.stores['workItemNotificationStore']
                  }
                    ]
            },

            {xtype: 'fieldset', id: 'bothFields', layout: 'vbox',
                items: [
                    /** Reminders Before Escalation **/
                    {xtype:'textfield', fieldLabel: '#{msgs.label_reminders_before_escalation}',
                        name: 'workItemMaxReminders', id: 'workItemMaxReminders', width:140}
                ]
            },

            {xtype: 'fieldset', id:'escalationOnlyFields', layout: 'vbox',
                items: [
                /** Days Before Escalation **/
                    {xtype:'textfield', fieldLabel: '#{msgs.label_escalate_days_before}',
                        name: 'workItemEscalationStart', id: 'workItemEscalationStart', width:140}
                    ]
            },

            {xtype: 'fieldset', id:'escalationFields', layout: 'vbox',
                items: [
                    /** Escalation Owner Rule **/
                    {xtype: 'combo', style: 'display:inline', fieldLabel: '#{msgs.label_escalation_owner_rule}',
                        name: 'workItemEscalationRule',
                        id: 'workItemEscalationRule',
                        width: 350,
                        store:this.window.panel.parent.editor.stores['workItemRulesStore']
                    },

                    /** Escalation Email **/
                    {xtype: 'combo', style: 'display:inline', fieldLabel: '#{msgs.label_escalation_email}',
                        name: 'workItemEscalationTemplate',
                        id: 'workItemEscalationTemplate',
                        width: 350,
                        store:this.window.panel.parent.editor.stores['workItemNotificationStore']
                    }
                ]
            }
          

        ],
        border: false
      });        
        
      this.items = [
          {xtype: 'panel', id:'workItemOverrideContainer', border: false, cls:'',
              items: [
        {xtype:'label', text: '#{msgs.workflow_work_item_override} ', style:'margin-right:10px'},
        {xtype:'checkbox', id: 'workItemOverride', name:'workItemOverride', listeners:{change: {fn: this.workItemOverrideToggle, scope: this}, afterrender: {fn: this.workItemOverrideToggle, scope: this}}},
        
        {xtype: 'panel', id: 'workItemOverrideFields', border: false, cls:'',  
          items: [
            {xtype:'label',  text: '#{msgs.label_initial_notification_email}: '},
        
            /** Initial Notification Email **/
            {xtype: 'combo',
             name: 'workItemNotificationTemplate',
             id: 'workItemNotificationTemplate',
             width: 400,
             store:this.window.panel.parent.editor.stores['workItemNotificationStore']
            },
        
            {xtype:'box', autoEl: 'div', cls:'vis-clear spacer'},
        
            this.workItemOpenFields
          ]
        }]},
          {xtype:'panel', id:'requireEsignatureContainer', border: false, cls:'', items:[
        {xtype:'label', text: '#{msgs.workflow_approval_esig_required}', style:'margin-right:10px'},
        {xtype:'checkbox', id: 'requireEsignature', name:'requireEsignature', listeners:{change: {fn: this.requireEsignatureToggle, scope: this}, afterrender: {fn: this.requireEsignatureToggle, scope: this}}},
        
        {xtype: 'panel', id: 'requireEsignaturePanel', border: false, cls:'',  
          items: [
            {xtype:'label',  text: '#{msgs.workflow_approval_select_esig}:'},              
            {xtype: 'panel', id: 'meaningComboPanel',
                border : false,
                layout: {
                    type: 'hbox'
                },
                items : [ 
                  {xtype: 'combo',
                    name: 'eSignatures',
                    listeners: {
                      change: this.handleMeaningChange                      
                    },                                 
                    id: 'eSignatures',
                    width: 400,
                    store:this.window.panel.parent.editor.stores['esignatureStore']
                },
                {xtype:'image', id : 'imgHlpMeaningHelp' , style:'margin-left:30px;vertical-align: middle;display:none;', src: SailPoint.CONTEXT_PATH+'/images/icons/info.png'}
              ]}// wrapper panel
            ]
          }
              ]}
                  
      ];
    
      Ext.QuickTips.init();
      SailPoint.WorkItemConfigPanel.superclass.initComponent.apply(this);
    },

    workItemOverrideToggle : function() {
      var checkbox = Ext.getCmp('workItemOverride');
      var wof = Ext.getDom('workItemOverrideFields');
      if(checkbox.getValue()){
          if(wof){
              wof.style.display = '';
          }
      } else {
          wof.style.display = 'none';
      }
      Ext.getCmp('workItemOverrideContainer').updateLayout();
    },
    
    workItemEscalationStyleToggle : function() {
      var toShow = [];
      var style = 'none';
      
      /** Get the box that surrounds the escalation options so we can limit our DomQuery **/
      var workItemOpenFields = Ext.getDom("workItemOpenFields");
      
      if(Ext.getCmp('workItemEscalation_none').getValue()) {
        toShow = [];
        style = 'none';
      } else if(Ext.getCmp('workItemEscalation_reminder').getValue()) {
        toShow=[Ext.getCmp('reminderFields')];
        style = 'reminder';
      } else if(Ext.getCmp('workItemEscalation_both').getValue()) {
        toShow=[Ext.getCmp('reminderFields'), Ext.getCmp('escalationFields'), Ext.getCmp('bothFields')];
        style = 'both';
      } else if(Ext.getCmp('workItemEscalation_escalation').getValue()) {
        toShow=[Ext.getCmp('escalationOnlyFields'), Ext.getCmp('escalationFields')];
        style = 'escalation';
      }
      
      this.workItemConfigObj.escalationStyle = style;
      
      /** Hide All **/

        Ext.Array.each(Ext.getCmp('reminderFields').query(), function(component) {
            component.setVisible(false);
        });

        Ext.Array.each(Ext.getCmp('escalationFields').query(), function(component) {
            component.setVisible(false);
        });

        Ext.Array.each(Ext.getCmp('escalationOnlyFields').query(), function(component) {
            component.setVisible(false);
        });

        Ext.Array.each(Ext.getCmp('bothFields').query(), function(component) {
            component.setVisible(false);
        });
      for (var i = 0 ; i < toShow.length ; i++) {
          Ext.Array.each(toShow[i].query(), function(component) {
              component.setVisible(true);
          });
      }
      
      Ext.getCmp('workItemOpenFields').updateLayout();
      
    },
    
    load : function(workItemConfigObj) {
      this.workItemConfigObj = workItemConfigObj;
      
      if(this.isOverride()) {
          Ext.getCmp('workItemOverride').setValue(true);
      }
        
      /** Set the email notification values **/
      Ext.getCmp('workItemNotificationTemplate').setValue(this.workItemConfigObj.notificationEmail);
      
      //Ext.getCmp('workItemEnabled').setValue(this.workItemConfigObj.workItemEnabled);
      Ext.getCmp('workItemReminderTemplate').setValue(this.workItemConfigObj.reminderEmail);
      Ext.getCmp('workItemEscalationTemplate').setValue(this.workItemConfigObj.escalationEmail);
      Ext.getCmp('workItemEscalationRule').setValue(this.workItemConfigObj.escalationRule);
      
      Ext.getCmp('workItemEscalation_'+this.workItemConfigObj.escalationStyle).setValue(true);
      
      if(this.workItemConfigObj.daysTillReminder>0)
        Ext.getCmp('workItemReminderStart').setValue(this.workItemConfigObj.daysTillReminder);
      
      if(this.workItemConfigObj.daysBetweenReminders>0)
        Ext.getCmp('workItemReminderFreq').setValue(this.workItemConfigObj.daysBetweenReminders);
      
      if(this.workItemConfigObj.maxReminders>0)
        Ext.getCmp('workItemMaxReminders').setValue(this.workItemConfigObj.maxReminders);
      
      if(this.workItemConfigObj.daysTillEscalation>0)
        Ext.getCmp('workItemEscalationStart').setValue(this.workItemConfigObj.daysTillEscalation);          

      this.workItemEscalationStyleToggle();

      if ( this.workItemConfigObj.electronicSignature != null ) {
          Ext.getCmp('requireEsignature').setValue(true);
          Ext.getCmp("eSignatures").setValue(this.workItemConfigObj.electronicSignature);
      } else {
          Ext.getCmp('requireEsignature').setValue(false);
      }
      
    },
    
    save : function() {
      if(Ext.getCmp('workItemOverride').getValue()) {
        this.workItemConfigObj.workItemOverride = Ext.getCmp('workItemOverride').getValue();
        this.workItemConfigObj.notificationEmail = Ext.getCmp('workItemNotificationTemplate').getValue();
        this.workItemConfigObj.reminderEmail = Ext.getCmp('workItemReminderTemplate').getValue();
        this.workItemConfigObj.escalationEmail = Ext.getCmp('workItemEscalationTemplate').getValue();
        this.workItemConfigObj.escalationRule = Ext.getCmp('workItemEscalationRule').getValue();
        this.workItemConfigObj.daysTillReminder = Ext.getCmp('workItemReminderStart').getValue();
        this.workItemConfigObj.daysBetweenReminders = Ext.getCmp('workItemReminderFreq').getValue();
        this.workItemConfigObj.maxReminders = Ext.getCmp('workItemMaxReminders').getValue();
        this.workItemConfigObj.daysTillEscalation = Ext.getCmp('workItemEscalationStart').getValue();
      } else {          
          this.clearAll();
      }
      
      // these have a different setion in the ui, we use the same DTO but these
      // end up in the arg list for the Approval step
      if(Ext.getCmp('requireEsignature').getValue()) {
          this.workItemConfigObj.electronicSignature = Ext.getCmp("eSignatures").getValue();
      } else {
          this.workItemConfigObj.electronicSignature = null;
      }
    },
    
    clearAll : function() {
        this.workItemConfigObj.workItemOverride = Ext.getCmp('workItemOverride').getValue();
        this.workItemConfigObj.notificationEmail = null;
        this.workItemConfigObj.reminderEmail = null;
        this.workItemConfigObj.escalationEmail = null;
        this.workItemConfigObj.escalationRule = null;
        
        this.workItemConfigObj.escalationStyle = 'none';
        
        this.workItemConfigObj.daysTillReminder = null;
        
        this.workItemConfigObj.daysBetweenReminders = null;
        
        this.workItemConfigObj.maxReminders = null;
        
        this.workItemConfigObj.daysTillEscalation = null;  
    },
    
    isOverride : function() {
        if(this.workItemConfigObj.notificationEmail || (this.workItemConfigObj.escalationStyle != 'none')) {
            return true;
        } else {
            return false;
        }
    },    
    
    /*
     * Hide and show the esig panel based on the 'requiresESignature'
     * checkbox.
     */
    requireEsignatureToggle : function() {
        var checkbox = Ext.getCmp('requireEsignature');
        if(checkbox.getValue()){            
            if( Ext.getDom('requireEsignaturePanel') ) {
                Ext.getDom('requireEsignaturePanel').style.display = '';
                   
            }
        } else {
            Ext.getDom('requireEsignaturePanel').style.display = 'none';
        }

        Ext.getCmp('requireEsignatureContainer').updateLayout();
    },
    
    /*
     * When the combo changes call a rest resource and get the localized
     * meaning for the newly selected value.
     */
    handleMeaningChange : function(combo, newValue, oldValue) {        
      var params = {
        name : newValue
      };
      Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/electronicSignatures/meanings/' + newValue),
        method: 'GET',
        params : params,
        success: function(response) {                            
          var result = Ext.JSON.decode(response.responseText);
          if( result == null || result.errors != null ) {
              var errStr = "";
              if ( result != null && ( result.errors != null && result.errors.length > 0 ) ) {
                  // build a csv of the errors
                  errStr = result.errors.join();
              }              
              SailPoint.FATAL_ERR_ALERT.call(this, '#{msgs.workflow_error_signature_text}' + "." + errStr);
          }
          var object = result.object;
          //get meaning off the result's object
          var localizedMeaning = "";
          if ( object != null ) {
              localizedMeaning = object;
          }          
          var meaningHelp = Ext.getCmp("imgHlpMeaningHelp");
          if ( meaningHelp != null ) {
              meaningHelp.style.display = '';
              meaningHelp.getEl().show();
              Ext.QuickTips.register({
                target: meaningHelp.id,
                title: '',
                text: localizedMeaning,
                enabled: true
              });
          } 
        },                            
        failure: function(response) {
            SailPoint.FATAL_ERR_ALERT.call(this, '#{msgs.workflow_error_signature_text}');
        }
      });        
    }    
});
