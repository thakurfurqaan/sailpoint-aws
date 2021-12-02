/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.IdentityRequest', 'SailPoint.IdentityRequest.Search');

SailPoint.IdentityRequest.Search.getIdentityRequestSearchPanel = function(config) {
    var activeItem = 'identityRequestSearchContents';
    
    var searchContents = Ext.create('Ext.panel.Panel', {
        id: 'identityRequestSearchContents',
        layout: 'fit',
        contentEl: 'identityRequestSearchContentsDiv',
        border: false,
        autoScroll: true,
        bbar: [{
            id: 'preIdentityRequestSearchBtn',
            text: '#{msgs.button_run_search}',
            cls : 'primaryBtn',
            handler: function() {
                var searchPanel = Ext.getCmp('identityRequestSearchPanel');
                searchPanel.validationErrors = SailPoint.Analyze.validateSearch('identityRequestSearchForm', 'identityRequest'); 
            }
        }, {
            id: 'identityRequestClearBtn',
            text: '#{msgs.button_clear_search}',
            handler: function() {
                Ext.getDom('identityRequestSearchForm:resetBtn').click();
            }
        }],
        loader: {
            url: SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestSearchContents.jsf'),
            params: { searchType: 'IdentityRequest' },
            discardUrl: false,
            callback: SailPoint.IdentityRequest.Search.initIdentityRequestSearchPanel,
            nocache: false,
            text: '#{msgs.loading_data}',
            timeout: 30,
            scripts: true
        }
    });

    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'identityRequestSearchResultsGrid',
        type: 'IdentityRequest',
        stateful: true,
        stateId: SailPoint.Analyze.gridStateIds.get('IdentityRequest'),
        url: SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestDataSource.json'),
        handleClick: SailPoint.IdentityRequest.Search.handleClick,
        pageSize: SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'IdentityRequest',
            cardPanelId: 'identityRequestSearchPanel',
            searchPanelId: 'identityRequestSearchContents',
            applySearchPanelStyles: function() {
              resizeTables('identityRequestSearchForm');
              Ext.getCmp('identityRequestSearchContents').doLayout();
              Ext.getCmp('identityRequestDisplayFieldsPanel').doLayout();
              
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}']
            ]
        })
    });
        
    //resultsContents.on('afterlayout', function(contentPanel, layout) {
    //    SailPoint.IdentityRequest.Search.styleResultsGrid();
    //});
    
        
    var searchPanel = Ext.create('Ext.panel.Panel', {
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, resultsContents]
    });
    
    searchPanel.on('activate', function(viewerPanel) {
        if (!searchPanel.isLoaded) {
            searchContents.getLoader().load();
            
            SailPoint.IdentityRequest.Search.initResultsGrid();
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};

SailPoint.IdentityRequest.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('identityRequestSearchPanel');
    searchPanel.getLayout().setActiveItem('identityRequestSearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
    	Ext.getCmp('identityRequestSearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.IdentityRequest.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('identityRequestSearchPanel');
    searchPanel.getLayout().setActiveItem('identityRequestSearchContents');
};

SailPoint.Analyze.IdentityRequest.validateSearch = function(formName) {
  var errors = [];
  var isValid = true;
  
  /** Validate Dates **/
  if(Ext.getDom('identityRequestStartDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':identityRequestStartDate', '');
  }
  if(Ext.getDom('identityRequestEndDateSelect').checked) {
    isValid &= Validator.validateInputDate(formName+':identityRequestEndDate', '');
  }
  
  if(Ext.getDom('identityRequestStartDateSelect').checked && Ext.getDom('identityRequestEndDateSelect').checked) {
    isValid &= Validator.validateStartEndDates(formName+':identityRequestStartDate', formName+':identityRequestEndDate', '#{msgs.err_invalid_start_end_date}')
  }
  
  if (!isValid) {
    errors = Validator.getErrors();
    Validator.clearErrors();
  }
  
  return errors;
};

SailPoint.IdentityRequest.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/identityRequest/identityRequestDataSource.json'), 'identityRequestSearchResultsGrid', 13, true);
};

SailPoint.IdentityRequest.Search.styleResultsGrid = function() {
    var gridPanel = Ext.getCmp('identityRequestSearchResultsGrid');
    if (gridPanel) {
        var referenceDiv = Ext.get('example-grid');
        if (referenceDiv) {
            var gridWidth = referenceDiv.getWidth(true) - 20;
            gridPanel.setWidth(gridWidth);
            gridPanel.getPositionEl().applyStyles({
                'margin-left': '10px',
                'margin-right': '10px',
                'margin-bottom': '10px'
            });
        }    
    }
};

SailPoint.IdentityRequest.Search.initIdentityRequestSearchPanel = function() {
    SailPoint.Analyze.IdentityRequest.initializeAttributes();
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('identityRequest');

    buildTooltips(Ext.getDom('identityRequestSearchCriteria'));
    
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: Ext.getDom('identityRequestSearchCriteria'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'identityRequestSearchForm',
            searchType: 'IdentityRequest'
        }
    });

    Ext.getCmp('identityRequestSearchContents').doLayout();
    Ext.MessageBox.hide();
};

SailPoint.IdentityRequest.Search.styleResultsPanels = function() {};

SailPoint.IdentityRequest.Search.clearSearchFields = function() {
    var formName = 'identityRequestSearchForm';
    var applicationSuggest = Ext.getCmp('requestApplicationSuggestCmp');
    if (applicationSuggest) {
        applicationSuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('requestApplication');

    var operationSuggest = Ext.getCmp('operationSuggestCmp');
    if (operationSuggest) {
        operationSuggest.clearValue();
        Ext.getDom('operation').value = '';
    }
    
    var stateSuggest = Ext.getCmp('stateSuggestCmp');
    if (stateSuggest) {
        stateSuggest.clearValue();
        Ext.getDom('state').value = '';
    }
    
    var instanceSuggest = Ext.getCmp('requestInstanceSuggestCmp');
    if (instanceSuggest) {
      instanceSuggest.clearValue();
        Ext.getDom('requestInstance').value = '';
    }
    
    var requestorSuggest = Ext.getCmp('requestorSuggestCmp');
    if (requestorSuggest) {
      requestorSuggest.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('requestor');
    
    var requesteeSuggestCmp = Ext.getCmp('requesteeSuggestCmp');
    if (requesteeSuggestCmp) {
      requesteeSuggestCmp.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('requestee');
    
    var stateSuggestCmp = Ext.getCmp('stateSuggestCmp');
    if (stateSuggestCmp) {
        stateSuggestCmp.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('state');

    var operationSuggestCmp = Ext.getCmp('operationSuggestCmp');
    if (operationSuggestCmp) {
        operationSuggestCmp.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('operation');

    var requestInstanceSuggestCmp = Ext.getCmp('requestInstanceSuggestCmp');
    if (requestInstanceSuggestCmp) {
        requestInstanceSuggestCmp.clearValue();
    }
    SailPoint.Analyze.resetSuggestAttribute('requestInstance');

    var formName = 'identityRequestSearchForm';
    Ext.getDom(formName + ':requestId').value = '';
    Ext.getDom(formName + ':identityRequestVerified').value = '';
    Ext.getDom(formName + ':identityRequestCompilationStatus').value = '';
    Ext.getDom(formName + ':identityRequestCompletionStatus').value = '';
    Ext.getDom(formName + ':identityRequestPriority').value = '';
    Ext.getDom(formName + ':identityRequestFlow').value = '';
    Ext.getDom(formName + ':identityRequestApprovalState').value = '';
    Ext.getDom(formName + ':identityRequestProvisioningState').value = '';
    
    Ext.getDom('identityRequestStartDateSelect').checked = false;
    toggleDisplay(Ext.getDom('identityRequestStartDateDiv'), false);
    Ext.getDom(formName + ':identityRequestStartDateType').value = 'None';

    Ext.getDom('identityRequestEndDateSelect').checked = false;
    toggleDisplay(Ext.getDom('identityRequestEndDateDiv'), false);
    Ext.getDom(formName + ':identityRequestEndDateType').value = 'None';

    SailPoint.Analyze.resetFieldsToDisplay('identityRequest');
    SailPoint.Analyze.IdentityRequest.finishRerender();
};


SailPoint.IdentityRequest.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts) {
    var colName = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if (colName) {
        Ext.getDom('identityRequestResultForm:currentObjectId').value = record.getId();
        Ext.getDom('identityRequestResultForm:editButton').click();
    }
};

/** 
 * 
 * ANALYZE STUFF 
 * 
 * **/


SailPoint.Analyze.IdentityRequest.initializeAttributes = function() {
  var requestorSuggest = Ext.getCmp('requestorSuggestCmp');
  var requestorVal = Ext.getDom('requestorVal').innerHTML;
  
  if (requestorSuggest) {
    requestorSuggest.destroy();
  }  
  requestorSuggest = new SailPoint.IdentitySuggest({
    id: 'requestorSuggestCmp',
    renderTo: 'requestorSuggest',
    binding: 'requestor',
    rawValue: requestorVal,
    baseParams: {context: 'Global'},
    width: 200,
    listConfig : {width : 300}
  });

  if(null != requestorVal && requestorVal != ''){
    requestorSuggest.setRawValue(requestorVal);
    SailPoint.Suggest.IconSupport.setIconDiv(requestorSuggest, 'userIcon');
  }

  var requesteeSuggest = Ext.getCmp('requesteeSuggestCmp');
  var requesteeVal = Ext.getDom('requesteeVal').innerHTML;
  
  if (requesteeSuggest) {
    requesteeSuggest.destroy();
  }  
  requesteeSuggest = new SailPoint.IdentitySuggest({
    id: 'requesteeSuggestCmp',
    renderTo: 'requesteeSuggest',
    binding: 'requestee',
    rawValue: requesteeVal,
    baseParams: {context: 'Global'},
    width: 200,
    listConfig : {width : 300}
  });

  if(null != requesteeVal && requesteeVal != ''){
    requesteeSuggest.setRawValue(requesteeVal);
    SailPoint.Suggest.IconSupport.setIconDiv(requesteeSuggest, 'userIcon');
  }

  var applicationSuggest = Ext.getCmp('requestApplicationSuggestCmp');
  var applicationVal = Ext.getDom('requestApplicationVal').innerHTML;
  
  if (applicationSuggest) {
    applicationSuggest.destroy();
  }  
  applicationSuggest = new SailPoint.BaseSuggest({
    id: 'requestApplicationSuggestCmp',
    renderTo: 'requestApplicationSuggest',
    binding: 'requestApplication',
    value: applicationVal,
    baseParams: {'suggestType': 'application'},
    valueField: 'displayName',
    width: 200,
    listConfig : {width : 300}
  });

  if(null != applicationVal && applicationVal != ''){
    applicationSuggest.setRawValue(applicationVal);
  }

  var stateSuggest = Ext.getCmp('stateSuggestCmp');
  var stateVal = Ext.getDom('stateVal').innerHTML;
  
  if (stateSuggest) {
    stateSuggest.destroy();
  }  
  stateSuggest = new SailPoint.UIRestSuggest({
    id: 'stateSuggestCmp',
    renderTo: 'stateSuggest',
    binding: 'state',
    value: stateVal,
    baseParams: {'key':'identityRequestStateAllowedValues'},
    width: 200,
    listConfig : {width : 300}
  });
  
  if(null != stateVal && stateVal != ''){
	  stateSuggest.setRawValue(stateVal);
  }

  var operationSuggest = Ext.getCmp('operationSuggestCmp');
  var operationVal = Ext.getDom('operationVal').innerHTML;
  
  if (operationSuggest) {
    operationSuggest.destroy();
  }  
  operationSuggest = new SailPoint.UIRestSuggest({
    id: 'operationSuggestCmp',
    renderTo: 'operationSuggest',
    binding: 'operation',
    value: operationVal,
    baseParams: {'key':'identityRequestOperationAllowedValues'},
    width: 200,
    listConfig : {width : 300}
  });
  
  if(null != operationVal && operationVal != ''){
	  operationSuggest.setRawValue(operationVal);
  }

  var instanceSuggest = Ext.getCmp('requestInstanceSuggestCmp');
  var instanceVal = Ext.getDom('requestInstanceVal').innerHTML;
  
  if (instanceSuggest) {
    instanceSuggest.destroy();
  }  
  instanceSuggest = new SailPoint.DistinctRestSuggest({
    id: 'requestInstanceSuggestCmp',
    renderTo: 'requestInstanceSuggest',
    binding: 'requestInstance',
    value: instanceVal,
    valueField: 'displayName',
    width: 200,
    freeText: true,
    className: 'Link',
    column: 'instance',
    suggestUrl: '/rest/analyze/identityRequestSearchPanel/suggest',
    listConfig : {width : 300}
  });
  
  var formName = 'identityRequestSearchForm';
  var checkBox = Ext.getDom('identityRequestStartDateSelect');
  if(Ext.getDom(formName + ':identityRequestStartDateType').value != 'None') {
    checkBox.checked = true;
  }
  toggleDisplay(Ext.getDom('identityRequestStartDateDiv'), !(checkBox.checked));
  
  var checkBox2 = Ext.getDom('identityRequestEndDateSelect');
  if(Ext.getDom(formName + ':identityRequestEndDateType').value != 'None') {
    checkBox2.checked = true;
  }
  toggleDisplay(Ext.getDom('identityRequestEndDateDiv'), !(checkBox2.checked));

};

SailPoint.Analyze.IdentityRequest.finishRerender = function() {
  resizeTables('identityRequestSearchForm');
  SailPoint.Analyze.IdentityRequest.initializeAttributes();
};
