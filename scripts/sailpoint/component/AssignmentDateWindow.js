/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.AssignmentDateForm', {
	extend : 'Ext.panel.Panel',
  
  sunriseDate : null,
  
  sunsetDate : null,
  
  sunriseHour : null,
  
  sunriseMin : null,
  
  sunsetHour : null,
  
  sunsetMin : null,
  
  now : null,
  
  initComponent : function() {
      
      this.now = new Date();
      /** Zero out the hour,min,sec, fields **/
      this.now.setHours(0);
      this.now.setMinutes(0);
      this.now.setSeconds(0);
      this.now.setMilliseconds(0);
      
      // Bug 28869 - Using SailPoint.form.DateField to standardize the date format used
      this.sunriseDate = new SailPoint.form.DateField({
        name:'sunrise', 
        id:'sunriseExt',
        labelStyle:'text-align:right;width:140px',
        vtype: 'daterange',
        labelSeparator: ' ',
        minValue: this.now,
        endDateField: 'sunsetExt'
      });
      
      // Bug 28869 - Using SailPoint.form.DateField to standardize the date format used
      this.sunsetDate = new SailPoint.form.DateField({
        name:'sunset', 
        id:'sunsetExt', 
        labelStyle:'text-align:right;width:140px',
        vtype: 'daterange',
        labelSeparator: ' ',
        minValue: this.now,
        startDateField: 'sunriseExt'
      });

        this.items = [
          {xtype:'label', text:'#{msgs.activate}: ', id: 'activateLabel'},
          this.sunriseDate,
          {xtype:'label', text:'#{msgs.deactivate}: ', id: 'deactivateLabel'},
          this.sunsetDate
        ];

    SailPoint.AssignmentDateForm.superclass.initComponent.apply(this, arguments);
  },
  
  validate : function() {
    if(this.sunriseDate) 
      return (this.sunriseDate.isValid() && this.sunsetDate.isValid());
    
    return true;
  }
});

Ext.define('SailPoint.AssignmentDateWindow', {
	extend : 'Ext.Window',
  form: null,
  
  /**
   * You can pass in a save method to execute when the window's save button is clicked
   */
  saveAction : undefined,
  
  roleId: undefined,

  entId: undefined,
  entAttribute: undefined,
  entValue: undefined,
  entApplication: undefined,
  entNativeId: undefined,
  entInstance: undefined,

  //Role or Entitlement
  type: undefined,

  initComponent : function() {
    this.form = new SailPoint.AssignmentDateForm({
      baseCls: 'x-plain',
      style:'padding:10px;background-color:#FFFFFF',
      labelWidth: 140
    });
    this.modal = true;

    this.items = [this.form];
    
    this.buttons = [
      {
        window : this,
        text: "#{msgs.button_save}",
        handler: function() {
          this.window.save();
        }
      },{
        window : this,
        text: "#{msgs.button_cancel}",
        cls : 'secondaryBtn',
        handler: function(){this.window.close(); }
      }
    ];
    
    SailPoint.AssignmentDateWindow.superclass.initComponent.apply(this, arguments);
  },
  
  save : function() {
    if(this.form.validate()) {
      
      if(this.saveAction)
        this.saveAction(this.roleId);
      
      this.close();
    } else {
      
      Ext.MessageBox.show({
        title: this.type == 'entitlement' ? '#{msgs.error_saving_ent}' : '#{msgs.error_saving_role}',
        msg: this.type == 'entitlement' ? '#{msgs.error_saving_ent_desc}' : '#{msgs.error_saving_role_descr}',
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox.ERROR
      });
      
    }
    
  },  
  
  setType : function(type) {
    this.type = type;
  }
});
