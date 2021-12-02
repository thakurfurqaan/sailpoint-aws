/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */
Ext.define('SailPoint.systemSetup.QuicklinkGrid', {
  extend : 'SailPoint.grid.PagingCheckboxGrid',
    
    selectedQloList : [],
    
    // pulling default values in from quicklink population editor
    flex: 10,
    margin: 20,
    viewConfig : {
        stripeRows: false
    },
    cls: 'smallFontGrid wrappingGrid',
    stateful: true,
    stateId: 'quicklinkPopulationQuicklinkListGridState',
    loadMask: true,
    enableColumnMove: false,
    enableColumnHide: false,
    
    statics : {
      /**
       * QL_INIT_CONFIG manages the initializaton configuration of the quicklink. All quicklinks fall
       * into 3 different categories. 1) some configuration is not valid i.e. you can't manage accounts 
       * in a bulk manner 2) only one option is valid i.e. configurable=false and you can only 
       * view a certification as yourself or 3) all options are valid i.e. this is the default and no 
       * QL_INIT_CONFIG entry will exist for this category.
       */
      QL_INIT_CONFIG: {
          'manageAccounts': { isBulkCapable: false },
          'managePasswords': { isBulkCapable: false },
          'viewIdentity': { isBulkCapable: false },
          'manageAttributes': { isBulkCapable: false },
          'viewAccessRequests': { configurable:false, option: { allowSelf:true } },
          'createIdentity': { configurable:false, option: { allowOther:true } },
          'viewCertifications': { configurable:false, option: { allowSelf:true } },
          'manageWorkItems': { configurable:false, option: { allowSelf:true } },
          'listViolations': { configurable:false, option: { allowSelf:true } },
          'viewApprovals': { configurable:false, option: { allowSelf:true } },
      },
      renderQuickLinkOptionsLink: function(value, metaData, record, rowIdx, colIdx, store, view) {
          var action = record.get('action'),
              quicklinkId = record.get('id'),
              quicklinkName = record.get('name');
          
          if (SailPoint.systemSetup.QuicklinkGrid.isNotConfigurable(action)) {
              return '<i class="fa fa-gear">&nbsp;</i>#{msgs.button_configure}';
          }
          
          return '<a href="javascript:Ext.getCmp(\'qlpQuicklinksGrid\').showOptions(\'' + action + '\', \'' + quicklinkId  + '\', \'' + quicklinkName + '\');"><i class="fa fa-gear">&nbsp;</i>#{msgs.button_configure}</a>';
      },
      isNotConfigurable: function(action) {
          return (SailPoint.systemSetup.QuicklinkGrid.QL_INIT_CONFIG[action] &&
                  SailPoint.systemSetup.QuicklinkGrid.QL_INIT_CONFIG[action].configurable === false);
      },
      getCapabilities: function(action) {
          return SailPoint.systemSetup.QuicklinkGrid.QL_INIT_CONFIG[action];
      },
      getOption: function(action) {
          return SailPoint.systemSetup.QuicklinkGrid.QL_INIT_CONFIG[action].option;
      }
    },
    
    initComponent : function(config) {

      Ext.apply(this, {
          selType: 'qlcheckmultiselmodel',
          selModel: {
              showHeaderCheckbox: false,
              ignoreRightMouseSelection: true,
              headerText: '#{msgs.enabled}',
              headerTextWidth: 65,
              mode: 'MULTI'
          }
      });
      
      this.store = SailPoint.Store.createRestStore({
        storeId : 'qlpQuicklinkListStore',
        autoLoad: true,
        url: SailPoint.getRelativeUrl('/rest/quicklinks'),
        extraParams: {colKey: this.colKey},
        fields : this.fields,
        sorters : [{property : 'name', direction : 'ASC'}],
        method: 'GET',
        remoteSort: true,
        simpleSortMode: true
      });

      this.store.on('load', function(store, records) {
        this.applySelectedQloList();
      }, this);
      
      // bug#26450 - update column config for the Category and Options columns to support small screen sizes
      Ext.Array.forEach(this.columns, function(i, idx) {
         if (i) {
             if (i.dataIndex === 'category') {
                 i.minWidth = 70;
             } else if (i.dataIndex === 'options') {
                 i.tdCls = 'qlpNoWrap';
             }
         } 
      });
      
      this.callParent(arguments);
    },
    
    setSelectedQloList : function(selectedRecords) {
      this.selectedQloList = [];
      for(var i=0; i < selectedRecords.length; i++) {
        var record = {};
        record["quickLinkId"] = selectedRecords[i].get("quickLinkId");
        record["options"] = selectedRecords[i].get("options");
        this.selectedQloList.push(record);
      }
      this.applySelectedQloList();
    },

    //called when checkbox is selected
    addSelectedQlo : function(selectedRecord) {
      //show option popup
      this.showOptions(selectedRecord.get('action'), selectedRecord.get('id'), selectedRecord.get('name'));
    },
    
    //called when checkbox is de-selected
    removeSelectedQlo : function(selectedRecord) {
      for(var i=0; i < this.selectedQloList.length; i++) {
        if (selectedRecord.get("id") == this.selectedQloList[i]["quickLinkId"]) {
          this.selectedQloList.splice(i, 1);
          break;
        }
      }
    },
    
    //called to initialize checkbox state
    applySelectedQloList : function() {
      var toSelect = [],
      records = this.store.data;
      for(var i=0; i < this.selectedQloList.length; i++) {
        for(var j=0; j < records.length; j++) {
          var recordId = records.getAt(j).get("id");
          var selectedRecordId = this.selectedQloList[i]["quickLinkId"];
          if (recordId == selectedRecordId) {
            toSelect.push(records.getAt(j));
          }
        }
      }
    
      this.getSelectionModel().select(toSelect);
    },
    
    //called when main page save is clicked
    getSelectedQLOsJson : function() {
      return JSON.stringify(this.selectedQloList);
    },
    
    //called when click configure link or select checkbox
    showOptions: function(action, quicklinkId, quicklinkName) {
      var found = false,         
          config = {'quickLinkId' : quicklinkId},
          qlpCmp;
      
      // check if action is configurable here, if only one option valid set it on the selected QLO
      if (SailPoint.systemSetup.QuicklinkGrid.isNotConfigurable(action)) {
          this.setSelectedQlo(quicklinkId, SailPoint.systemSetup.QuicklinkGrid.getOption(action));
          return;
      }
      
      if (action === 'requestAccess') {
          modalName = 'SailPoint.systemSetup.RequestAccessOptionsModal';
      } else if (action === 'manageAccounts') {
          modalName = 'SailPoint.systemSetup.ManageAccountsOptionsModal';
      } else {
          modalName = 'SailPoint.systemSetup.DefaultOptionsModal';
      }

      for(var i=0; i < this.selectedQloList.length; i++) {
        if (quicklinkId == this.selectedQloList[i]['quickLinkId']) {
          config = this.selectedQloList[i];
          break;
        }
      }
      //set the id of the popup window
      config['id'] = 'qlpOptionsPopup';
      config['title'] = quicklinkName + ' #{msgs.options}';
      // disable some options that don't apply to certain quicklinks
      if (SailPoint.systemSetup.QuicklinkGrid.getCapabilities(action)) {
          Ext.apply(config, SailPoint.systemSetup.QuicklinkGrid.getCapabilities(action));
      }
      
      Ext.create(modalName, config).show();
      qlpCmp = Ext.getCmp('qlpOptionsPopup');
      if (qlpCmp) {
          buildTooltips(qlpCmp.getEl().dom);  
      }
      
    },
    
    //called in modal when save is clicked
    setSelectedQlo : function(quicklinkId, options) {
      var found = false;
      for(var i=0; i < this.selectedQloList.length; i++) {
        if (quicklinkId == this.selectedQloList[i]['quickLinkId']) {
          this.selectedQloList[i]['options'] = options;
          found = true;
          break;
        }
      }
      if (!found) {
        this.selectedQloList.push({'quickLinkId':quicklinkId, 
                                    'options':options});
        this.applySelectedQloList();
      }
      SailPoint.systemSetup.QuickLinkPopulationEditor.markPageDirty(true);
   }
});


Ext.define('SailPoint.systemSetup.QuicklinkCheckboxSelectionModel', {
  extend : 'SailPoint.grid.CheckboxSelectionModel',
  alias : 'selection.qlcheckmultiselmodel',
  
    //have to override onRowMouseDown to intercept click on checkbox
    //can't override onSelectionChange, since it is also called during page navigation
    onRowMouseDown: function(view, record, item, index, e) {
      this.callParent(arguments);
    
      var me = this,
          checker = this.getCheckboxClickTarget(e);
      
      if (!me.allowRightMouseSelection(e)) {
          return;
      }
    
      // checkOnly set, but we didn't click on a checker.
      if (me.checkOnly && !checker) {
          return;
      }
    
      if (checker) {
        var qlpQuicklinksGrid = Ext.getCmp('qlpQuicklinksGrid');
        if (qlpQuicklinksGrid) {
          if (me.isSelected(record)) {
            qlpQuicklinksGrid.addSelectedQlo(record);
          } else {
            qlpQuicklinksGrid.removeSelectedQlo(record);
          }
          SailPoint.systemSetup.QuickLinkPopulationEditor.markPageDirty(true);
        }
      }
    }

});