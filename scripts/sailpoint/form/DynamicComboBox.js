/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DynamicComboBox', {
	extend : 'SailPoint.form.ComboBox',
	alias : 'widget.spdynamiccombo',
  
    name : '',
    
    /**
     * @cfg {String}  The class name of the FormBean that handles this form.
     */
    formBeanClass: null,

    /**
     * @cfg {Object}  An optional map of data that can be used to construct
     *                the FormBean.
     */
    formBeanState: null,


    constructor: function(config) {
        this.name = config.name;
        this.formBeanClass = config.formBeanClass;
        this.formBeanState = config.formBeanState;

        this.callParent(arguments);
    },

    initComponent : function(){
        SailPoint.form.DynamicComboBox.superclass.initComponent.apply(this, arguments);
        
        this.on('beforequery', function(qe) { delete qe.combo.lastQuery; }, this);
    },

    initStore : function(config){
      var storeFields = [{name:this.valueField}, {name:this.displayField}, {name:this.iconField}];
      
      storeFields = storeFields.concat(this.calculateExtraFields());
      this.store = SailPoint.Store.createRestStore({
        url: SailPoint.getRelativeUrl('/include/dynamicFieldValues.json'),
        fields: storeFields,
        autoLoad: false,
        autoRecord : config.autoRecord,
        totalProperty: config.totalProperty ? config.totalProperty : 'count',
        method: 'POST'
      });

      if (config.filter){
          this.store.getProxy().extraParams['filter'] = config.filter;
      }

      if (!config.suggest && !config.lazyInit)
          this.store.load({callback:this.setInitialValue, scope:this});
      
      this.store.on('beforeload', this.serializeFormValues, this);
      
      this.store.on('datachanged', this.decodeReturnValues, this);

      this.mode = 'remote';
    },
    
    /**When the data comes back from the server it is encoded and must be decoded **/
    decodeReturnValues : function() { 
        var records = this.store.getRange();
        for (i = 0, len = records.length; i < len; i++) {
            var record = records[i];
            for (var property in record.data) {
                if (record.data.hasOwnProperty(property)) {
                    record.data[property] = Ext.String.htmlDecode(record.data[property]);
                }
            }
        }
    }, 
    
    /** parses the form config and grabs the current values for each form item **/
    serializeFormValues : function() {
      var form = Ext.getCmp(this.parentFormId);
      this.store.getProxy().extraParams['data'] = Ext.JSON.encode(form.persist());
      this.store.getProxy().extraParams['fieldName'] = this.name;
      this.store.getProxy().extraParams['formBeanClass'] = this.formBeanClass;
      this.store.getProxy().extraParams['formBeanState'] = Ext.JSON.encode(this.formBeanState);
      this.store.getProxy().extraParams['formId'] = this.parentFormId;
    }

});