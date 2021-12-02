/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Grid',
       'SailPoint.Analyze.Grid.Identity');
       
var gridState;
var grid;

SailPoint.Analyze.Grid.Identity.createGrid = function(fields, columns, gridStateStr, url, pageSize) {
  gridState = new SailPoint.GridState(JSON.parse(gridStateStr));

  var gridWidth = Ext.getDom('example-grid').clientWidth - 25;
  
  var sInfo;
  if(gridState && gridState._getValue('sortColumn')){
    sInfo = [{property: gridState._getValue('sortColumn'), direction: gridState._getValue('sortOrder') }];
  }
  
  var start =0;
  if(gridState && gridState._getValue('firstRow')>0) {
    start = gridState._getValue('firstRow');
  }
  
  grid = new SailPoint.grid.PagingCheckboxGrid({
    store: SailPoint.Store.createStore({
        storeId: 'identityStore',
        url: url,
        root: 'results',
        fields: fields,
        remoteSort: true,
        sorters: sInfo
    }),
    cls: 'smallFontGrid selectableGrid',
    columns:columns,
    selModel: new SailPoint.grid.CheckboxSelectionModel( {selectMessageBox: Ext.getDom('selectedCount')}),
    listeners: { itemclick: SailPoint.Analyze.Grid.Identity.handleClick },
    viewConfig: {
      scrollOffset: 1,
      stripeRows:true
    },
    pageSize: pageSize,
    usePageSizePlugin: true,
    renderTo:'example-grid',
    width:gridWidth,
    height:500
  });
  
  grid.render();
  grid.getStore().addListener('load', grid.updateFirstRow);
  grid.getStore().load({params:{start:start, limit:pageSize}});
};

SailPoint.Analyze.Grid.Identity.handleClick = function(gridView, record, HTMLitem, index, e, eOpts) {
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    var resultGrid = gridView.findParentByType('grid');
    resultGrid.gridState._setValue('pageSize', resultGrid.pageSize);
    if (colName) {
        Ext.getDom('identitySearchForm:currentObjectId').value = record.getId();
        Ext.getDom('identitySearchForm:editButton').click();
    }
    else {
        e.stopEvent();
    }
};
            
SailPoint.Analyze.Grid.Identity.scheduleCertification = function(grid) {
  if(grid.selModel.isAllSelected()) {
    /** If they unselected users, we need to get those and exclude them from the cert **/
    if(grid.selModel.getExcludedIds().length >0) {
      Ext.getDom('editForm:idsToCertify').value = arrayToString(grid.selModel.getExcludedIds(), false);
    }
    Ext.getDom('editForm:certifyAll').value = 'true';
    Ext.getDom('editForm:scheduleCertificationBtn').click();
  } else if(grid.selModel.getSelectedIds().length < 1) {
    Ext.MessageBox.alert('#{msgs.dialog_no_identities}', '#{msgs.identity_search_err_select_identity_cert}');
    return;
  } else {          
    Ext.getDom('editForm:idsToCertify').value = arrayToString(grid.selModel.getSelectedIds(), false);
    Ext.getDom('editForm:scheduleCertificationBtn').click();
  }
};

SailPoint.Analyze.Grid.Identity.searchForActivitiesOnIdentities = function(grid){
  if(grid.selModel.isAllSelected()) {
    /** If they unselected users, we need to get those and exclude them from the cert **/
    if(grid.selModel.getExcludedIds().length>0) {
      Ext.getDom('editForm:selectedIdentityIds').value = arrayToString(grid.selModel.getExcludedIds(), false);
    }
    Ext.getDom('editForm:allSelected').value = 'true';
    Ext.getDom('editForm:searchActivitiesOnIdsButton').click();
  }
  else if(grid.selModel.getSelectedIds().length < 1) {
    Ext.MessageBox.alert('#{msgs.dialog_no_identities}', '#{msgs.identity_search_err_select_identity_activity}');
    return;
  } else {             
    Ext.getDom('editForm:selectedIdentityIds').value = arrayToString(grid.selModel.getSelectedIds(), false);
    Ext.getDom('editForm:searchActivitiesOnIdsButton').click();
  }
};
