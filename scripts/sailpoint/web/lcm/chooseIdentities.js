/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.LCM.ChooseIdentities');

SailPoint.LCM.ChooseIdentities.GRID_HEIGHT = 280;

SailPoint.LCM.ChooseIdentities.identity = null;
SailPoint.LCM.ChooseIdentities.inputTypes = null;
SailPoint.LCM.ChooseIdentities.submitOnEnter = null;

SailPoint.LCM.ChooseIdentities.disableInitialLoad = false;

SailPoint.LCM.ChooseIdentities.initializePopulationGrid = function(gridMetaData, currentIdentity, isAllowBulk, identityAttributes, filterValues) {
      
    var grid = Ext.create('SailPoint.LCM.AvailableIdentitiesGrid', {
        renderTo: 'populationContainer',
        fields: gridMetaData.fields,
        columns: gridMetaData.columns,
        currentIdentity: currentIdentity,
        identityAttributes: identityAttributes,
        isBulk: isAllowBulk,
        filterValues: filterValues,
        id:'populationGrid',
        runInitialLoad : !SailPoint.LCM.ChooseIdentities.disableInitialLoad,
        minHeight: SailPoint.LCM.ChooseIdentities.GRID_HEIGHT
    });
    
    if(filterValues.name!=null) {
        grid.advSearchButton.execute();
    }
};

SailPoint.LCM.ChooseIdentities.initializeSelectedGrid = function() {
  // Create some metadata since it isn't passed in by the page.
  var gridMetaData = {
      fields: ['name', 'id', 'displayName'],
      columns: [
          {name:"remover", header:"", dataIndex:"id", renderer:SailPoint.LCM.ChooseIdentities.renderRemover, sortable:false, resizable:false, hideable:false, menuDisabled:true},
          {name:"name", header:"#{msgs.name}", dataIndex:"displayName", sortable:true, resizable:false, hideable: false, flex:5, menuDisabled:true, renderer: SailPoint.LCM.ChooseIdentities.renderChosenIdentity}
      ]
  };

  // Create the grid with a specific height and no info message.
  var grid = new SailPoint.LCM.ChosenIdentitiesGrid(gridMetaData, {
      displayInfo: false,
      height: SailPoint.LCM.ChooseIdentities.GRID_HEIGHT
  });
};

SailPoint.LCM.ChooseIdentities.renderRemover = function(value, p, r) {
  return '<div class="remover" style="margin-top:3px;" onclick="SailPoint.LCM.ChooseIdentities.removeIdentity(\''+r.getId()+'\'); return false;" />';
};

SailPoint.LCM.ChooseIdentities.removeIdentity = function(id) {
    var store = Ext.getCmp('chosenIdentityGrid').getStore();
    var record = store.getById(id);
    if(record) {
        store.remove(record);
        var grid = Ext.getCmp('populationGrid');
        if(grid) {
            grid.getSelectionModel().deselect(record);
        }
    }
    
    Ext.getDom('editForm:identityIds').value = '';
    Ext.getDom('editForm:identityId').value = id;
    Ext.getDom('editForm:removeBtn').click();
};

SailPoint.LCM.ChooseIdentities.addIdentities = function(selectedIds) {
    Ext.getDom('editForm:identityIds').value = arrayToString(selectedIds);
    Ext.getDom('editForm:addBtn').click();
};

SailPoint.LCM.ChooseIdentities.removeIdentities = function(selectedIds) {
  Ext.getDom('editForm:identityId').value = '';
  Ext.getDom('editForm:identityIds').value = arrayToString(selectedIds);
  Ext.getDom('editForm:removeBtn').click();
};

SailPoint.LCM.ChooseIdentities.submit = function() {
  Ext.getDom('editForm:submitBtn').click();
};

/**
 * Renderer for the selected identities.
 */
SailPoint.LCM.ChooseIdentities.renderChosenIdentity = function(value, meta, record) {
    return (!value) ? record.get('name') : value;
};
