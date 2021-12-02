/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 
       'SailPoint.Identity', 
       'SailPoint.Identity.Search',
       'SailPoint.Analyze', 
       'SailPoint.Analyze.Identity');

SailPoint.Identity.Search.searchType;
SailPoint.Identity.Search.extendedAttributeSuggests = [];

SailPoint.Identity.Search.getIdentitySearchPanel = function(config) {
    var activeItem = 'identitySearchContents';
    if (config.activeCard) {
        activeItem = config.activeCard;
    }
    
    var searchContents = Ext.create('SailPoint.TabContentPanel', {
        id: 'identitySearchContents',
        layout: 'fit',
        contentEl: 'identitySearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'identitySearchToolbar',
            items: [{
                id: 'advancedIdentitySearchNavBtn',
                text: '#{msgs.identity_search_button_adv_search}',
                scale : 'medium',
                handler: SailPoint.Identity.Search.displayAdvancedSearch,
                cls: 'x-btn-text-icon'
            }]
        },{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [{
                id: 'preIdentitySearchBtn',
                text: '#{msgs.button_run_search}',
                cls : 'primaryBtn',
                handler: function() {
                    SailPoint.Identity.Search.validateSearch();
                }
            }, {
                id: 'identityClearBtn',
                text: '#{msgs.button_clear_search}',
                handler: function() {
                    Ext.getDom('identitySearchForm:resetBtn').click();
                }
            }]
        }]
    });

    var identityGridStateId = SailPoint.Analyze.gridStateIds.get('Identity');
    var resultsContents = SailPoint.Search.getResultsGrid({
        id: 'identitySearchResultsGrid',
        type: 'identity',
        stateful: true,
        stateId: identityGridStateId,
        url: SailPoint.getRelativeUrl('/analyze/identity/identityDataSource.json'),
        handleClick: SailPoint.Identity.Search.handleClick,
        pageSize: config.pageSize ? config.pageSize : SailPoint.Analyze.defaultResultsPageSize,
        withCheckboxes: true,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'Identity',
            cardPanelId: 'identitySearchPanel',
            searchPanelId: 'identitySearchContents',
            applySearchPanelStyles: SailPoint.Identity.Search.styleSearchPanels,
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}'],
                ['saveAsPopulation', '#{msgs.save_identities_as_population}'],
                ['showEntitlements', '#{msgs.show_entitlements}']
            ],
            scheduleCertGridId: 'identitySearchResultsGrid',
            checkboxGridId: 'identitySearchResultsGrid'
        })
    });

    var advancedSearchContents = Ext.create('SailPoint.TabContentPanel', {
        id: 'advancedIdentitySearchContents',
        layout: 'fit',
        contentEl: 'advancedIdentitySearchContentsDiv',
        border: false,
        autoScroll: true,
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            cls: 'identitySearchToolbar',
            items: [{
                id: 'identitySearchNavBtn',
                text: '#{msgs.identity_search_title}',
                scale : 'medium',
                handler: SailPoint.Identity.Search.displaySearchContents,
                cls: 'x-btn-text-icon'
            }]
        },{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [{
                id: 'preAdvancedIdentitySearchBtn',
                text: '#{msgs.button_run_search}',
                cls : 'primaryBtn',
                handler: function() {
                    SailPoint.Analyze.validateSearch('advancedIdentitySearchForm', 'advancedIdentity');
                }
            }, {
                id: 'advancedIdentityClearBtn',
                text: '#{msgs.button_clear_search}',
                handler: function() {
                    Ext.getDom('advancedIdentitySearchForm:resetBtn').click()
                }
            }]
        }]
    });

    var advIdentityGridStateId = SailPoint.Analyze.gridStateIds.get('AdvancedIdentity');
    var advancedResultsContentsConfig = {
        id: 'advancedIdentitySearchResultsGrid',
        type: 'advancedIdentity',
        stateful: true,
        stateId: advIdentityGridStateId,
        url: SailPoint.getRelativeUrl('/analyze/identity/advancedIdentityDataSource.json'),
        handleClick: SailPoint.Identity.Search.handleClick,
        withCheckboxes: true,
        pageSize: config.pageSize ? config.pageSize : SailPoint.Analyze.defaultResultsPageSize,
        optionsPlugin: SailPoint.Search.getOptionsPlugin({
            searchType: 'AdvancedIdentity',
            cardPanelId: 'identitySearchPanel',
            searchPanelId: 'advancedIdentitySearchContents',
            applySearchPanelStyles: function() {
                Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
                Ext.getCmp('advancedIdentitySearchContents').doLayout();
            },
            options: [
                ['saveOrUpdate', '#{msgs.save_search}'],
                ['saveAsReport', '#{msgs.save_search_as_report}'],
                ['saveAsPopulation', '#{msgs.save_identities_as_population}'],
                ['showEntitlements', '#{msgs.show_entitlements}']
            ],
            scheduleCertGridId: 'advancedIdentitySearchResultsGrid',
            checkboxGridId: 'advancedIdentitySearchResultsGrid'
        })
    };
    
    var advancedResultsContents = SailPoint.Search.getResultsGrid(advancedResultsContentsConfig);
    
    // Hacking this to make the advanced search panel load properly after being restored
    advancedResultsContentsConfig.optionsPlugin.returnToSearchPanel = SailPoint.Identity.Search.displayAdvancedSearch;

    var searchPanel = Ext.create('Ext.panel.Panel', {
        id: config.id,
        title: config.title,
        headerAsText: false,
        header: false,
        layout: 'card',
        activeItem: activeItem,
        items: [searchContents, resultsContents, advancedSearchContents, advancedResultsContents]
    });
    
    searchPanel.on('activate', function(viewerPanel) {
        if (!searchPanel.isLoaded) {
            searchContents.loader = {
                url: SailPoint.getRelativeUrl('/analyze/identity/identitySearchContents.jsf'),
                params: { searchType: 'Identity' },
                discardUrl: false,
                callback: SailPoint.Identity.Search.initIdentitySearchPanel,
                nocache: false,
                text: '#{msgs.loading_data}',
                timeout: 30,
                scripts: true
            };
            searchContents.getLoader().load();
            
            SailPoint.Identity.Search.initResultsGrid();
            
            var advancedSearchContents = Ext.getCmp('advancedIdentitySearchContents');
            if (!advancedSearchContents.isLoaded) {
                advancedSearchContents.loader = {
                    url: SailPoint.getRelativeUrl('/analyze/identity/advancedSearchContents.jsf'),
                    params: { searchType: 'AdvancedIdentity' },
                    discardUrl: false,
                    callback: SailPoint.Identity.Search.initAdvancedSearchPanel,
                    nocache: false,
                    text: '#{msgs.loading_data}',
                    timeout: 30,
                    scripts: true
                };
                advancedSearchContents.getLoader().load();
                
                advancedSearchContents.isLoaded = true;
            }
            
            searchPanel.isLoaded = true;
        }
    },{
        single: true,
        scope: this
    });
    
    return searchPanel;
};


SailPoint.Identity.Search.displaySearchResults = function() {
    var searchPanel = Ext.getCmp('identitySearchPanel');
    searchPanel.getLayout().setActiveItem('identitySearchResultsGridWrapper');
    searchPanel.doLayout();
    if (Ext.isGecko) {
        // Why does Firefox scrunch the columns while IE works fine?  
        // Your guess is as good as mine. This fixes it, though.  --Bernie
        Ext.getCmp('identitySearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Identity.Search.displaySearchContents = function() {
    var searchPanel = Ext.getCmp('identitySearchPanel');
    searchPanel.getLayout().setActiveItem('identitySearchContents');
};

SailPoint.Identity.Search.displayAdvancedSearchResults = function() {
    var searchPanel = Ext.getCmp('identitySearchPanel');
    searchPanel.getLayout().setActiveItem('advancedIdentitySearchResultsGridWrapper');
    searchPanel.doLayout();

    if (Ext.isGecko) {
        Ext.getCmp('advancedIdentitySearchResultsGrid').getView().refresh();
    }
    Ext.MessageBox.hide();
};

SailPoint.Identity.Search.displayAdvancedSearch = function() {
    SailPoint.Search.clearForRefineSearch('advancedIdentitySearchResultsGrid');
    
    var searchPanel = Ext.getCmp('identitySearchPanel');
    searchPanel.getLayout().setActiveItem('advancedIdentitySearchContents');
    
    if (!searchPanel.hasDisplayFields) {
        SailPoint.Analyze.SearchDisplayFields.initDisplayFields('advancedIdentity');
        searchPanel.hasDisplayFields = true;
    }
    Ext.getCmp('advancedIdentityDisplayFieldsPanel').doLayout();
    SailPoint.Utils.styleSelects();
};

SailPoint.Identity.Search.initAdvancedSearchPanel = function() {
    advancedSearchFiltersPage = FiltersPage.instance('div.advancedSearchspTabledAjaxContent', 'advancedSearchfilterBeanListTbl', 'advancedIdentitySearchForm', 'advancedSearch');
    advancedSearchFiltersPage.initPage();
    buildTooltips(Ext.getDom('advancedIdentityAttributes'));
    buildTooltips(Ext.getDom('filterCriteria'));
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/identity/advancedIdentityDataSource.json'), 'advancedIdentitySearchResultsGrid', 13, true);
    Ext.getDom('advancedSearchWrapperTbl').style['width'] = '95%';
    Ext.getCmp('advancedIdentitySearchContents').doLayout();
};

SailPoint.Identity.Search.initResultsGrid = function() {
    SailPoint.BaseGrid.initGrid(SailPoint.getRelativeUrl('/analyze/identity/identityDataSource.json'), 'identitySearchResultsGrid', 13, true);
};

SailPoint.Identity.Search.handleClick = function(gridView, record, HTMLitem, index, e, eOpts) {
    var col = gridView.getHeaderCt().getHeaderAtIndex(gridView.clickedColumn).dataIndex;
    if(col) {
        var isAdvanced = (this.id === 'advancedIdentitySearchResultsGrid') ? true : false;
        var searchType = (isAdvanced) ? 'AdvancedIdentity' : 'Identity';
        var formName = (isAdvanced) ? 'advancedIdentityResultForm' : 'identityResultForm';
        
        SailPoint.Analyze.captureGridState(searchType, formName);        
        Ext.getDom(formName + ':searchType').value = searchType;
        Ext.getDom(formName + ':currentObjectId').value = record.getId();
        Ext.getDom(formName + ':editButton').click();
    } else {
        e.stopEvent();
    }
};

SailPoint.Identity.Search.initIdentitySearchPanel = function() { 
    SailPoint.Analyze.SearchDisplayFields.initDisplayFields('identity');
    SailPoint.Analyze.registerSubmits({
        className: 'searchInputText',
        container: Ext.getDom('attributes'),
        eventHandler: SailPoint.Analyze.submitEventHandler,
        options: {
            formName: 'identitySearchForm',
            searchType: 'identity'
        }
    });
    SailPoint.Identity.Search.styleSearchPanels();
};

SailPoint.Identity.Search.styleSearchPanels = function() {
    resizeTables('identitySearchForm');
    buildTooltips(Ext.getDom('attributes'));
    SailPoint.Analyze.Identity.initializeAttributes();
    SailPoint.Analyze.Identity.initializeIdentityEntitlements();
    
    Ext.getCmp('identitySearchContents').doLayout();
    Ext.getCmp('identityDisplayFieldsPanel').doLayout();
    
    Ext.MessageBox.hide();
};

SailPoint.Identity.Search.styleResultsPanels = function() {
    if (Ext.isIE7) {
        resizeTables('identityResultsForm');
        var tabPanel = Ext.getCmp('identityTabPanel');
        var resultsHeader = Ext.get('identitySearchResultsHeader');
        var resultsContent = Ext.get(Ext.DomQuery.selectNode('div[class*=spBackground]', Ext.getDom('identityResultsForm')));
        var resultsFooter = Ext.get('identitySearchResultsFooter');
        var width = tabPanel.getWidth();
        resultsHeader.setWidth(width);
        resultsContent.setWidth(width);
        resultsFooter.setWidth(width);
    }
};

SailPoint.Identity.Search.clearSearchFields = function() {
    var formName = 'identitySearchForm';
    Ext.getDom(formName + ':identityLastName').value = '';
    Ext.getDom(formName + ':identityFirstName').value = '';
    Ext.getDom(formName + ':inactive').value = '';
    Ext.getDom(formName + ':isManager').value = '';
    Ext.getDom(formName + ':type').value = '';
    SailPoint.Analyze.clearExtendedAttributeFields('identityAttributes');
    SailPoint.Analyze.clearExtendedAttributeFields('identityRiskAttributesContent');
    SailPoint.Analyze.Identity.finishRerender();
    
    var identInstanceSuggest = Ext.getCmp('identInstanceSuggestCmp');
    if (identInstanceSuggest) {
      identInstanceSuggest.clearValue();
        Ext.getDom('identInstance').value = '';
    }
    
    var displayNameSuggest = Ext.getCmp('displayNameSuggestCmp');
    if (displayNameSuggest) {
      displayNameSuggest.clearValue();
        Ext.getDom('displayName').value = '';
    }
    
    var userNameSuggest = Ext.getCmp('userNameSuggestCmp');
    if (userNameSuggest) {
      userNameSuggest.clearValue();
        Ext.getDom('userName').value = '';
    }
    
    var managerSuggest = Ext.getCmp('managerSuggestCmp');
    if (managerSuggest) {
      managerSuggest.clearValue();
      Ext.getDom('manager').value = '';
    }
    
    var administratorSuggest = Ext.getCmp('administratorSuggestCmp');
    if (administratorSuggest) {
        administratorSuggest.clearValue();
      Ext.getDom('administrator').value = '';
    }
    
    var emailSuggest = Ext.getCmp('emailSuggestCmp');
    if (emailSuggest) {
      emailSuggest.clearValue();
      Ext.getDom('email').value = '';
    }

    // Clear the entitlement fields
    SailPoint.Analyze.Identity.initializeIdentityEntitlements();    
    var fieldNames = [ "entitlementMissingCurrentCert", "entitlementPendingCert" , 
                       "entitlementMissingRequest", "entitlementPendingRequest", 
                       "entitlementConnectionStatus", "isEntitlementAssigned" ];
    for(var i=0; i<fieldNames.length; i++) {
        var field = Ext.getDom('identitySearchForm:' + fieldNames[i]);
        if ( field  ) {
            field.value = '';
        }  
    }    
    SailPoint.Analyze.resetFieldsToDisplay('identity');
};

SailPoint.Identity.Search.clearAdvancedSearchFields = function() {
    var formName = 'advancedIdentitySearchForm';
    SailPoint.Analyze.resetSelectItems(formName + ':advancedSearchinputTypeChoices');
    SailPoint.Analyze.resetFieldsToDisplay('advancedIdentity');
    SailPoint.Analyze.resetSelectItems(formName + ':advancedSearchsearchFieldList');
    SailPoint.Analyze.resetSelectItems(formName + ':advancedSearchmatchMode');
    
    if (Ext.getDom(formName + ':advancedSearchfilterValue')) {
        Ext.getDom(formName + ':advancedSearchfilterValue').value = '';
    }
    
    if (Ext.getDom(formName + ':advancedSearchfilterBoolValue')) {
        SailPoint.Analyze.resetSelectItems(formName + ':advancedSearchfilterBoolValue');
    }
    
    Ext.getDom(formName + ':advancedSearchignoreCase').checked = false;
    advancedSearchFiltersPage.changeField(Ext.getDom(formName + ':advancedSearchinputTypeChoices'));
    advancedSearchFiltersPage.reRoundTable('advancedSearchfilterBeanListDiv');
};

SailPoint.Identity.Search.preShowEntitlements = function(searchType, formName) {
  SailPoint.Identity.Search.searchType = searchType;
  Ext.getDom(formName+':preShowEntitlements').click();
};

SailPoint.Identity.Search.showEntitlements = function() {
    var filter = Ext.getDom('searchSaveForm:searchFilter').innerHTML;
    if (!filter) {
        Ext.getCmp('spViewport').doLayout();
        return;
    }
  
    var entitlementsWindow = Ext.getCmp('entitlementsWindow');
    if (!entitlementsWindow) {
        entitlementsWindow = SailPoint.Identity.Search.getEntitlementsWindow();
    }
    
    entitlementsWindow.show();
    
    var entitlementsPanel = Ext.getCmp('entitlementsPanel');
    entitlementsPanel.getLoader().load();
};

SailPoint.Identity.Search.getEntitlementsWindow = function() {
    var analyzeTabPanel = Ext.getCmp('analyzeTabPanel');
    
    var entitlementsWindow = Ext.create('Ext.window.Window', {
        id: 'entitlementsWindow',
        title: '#{msgs.identity_search_section_entitlement_breakdown}',
        layout: 'fit',
        border: true,
        modal: true,
        closable: true,
        closeAction: 'hide',
        width: 768,
        height: analyzeTabPanel.getHeight(),
        renderTo: 'entitlementsWindowDiv',
        items: [{
            xtype: 'panel',
            id: 'entitlementsPanel',
            contentEl: 'entitlementsPanelDiv',
            bodyStyle: {
                background: '#dddddd'
            },
            autoScroll: true,
            loader: {
                url: SailPoint.getRelativeUrl('/analyze/identity/entitlementsDisplay.jsf'),
                params: {searchType: SailPoint.Identity.Search.searchType},
                loadMask: true,
                callback: function() {
                    SailPoint.Role.EntitlementsAnalysis.addDescriptionTooltips();
                }
            }
        }],
        buttons: [{
            id: 'closeEntitlementsWindowBtn',
            text: "#{msgs.button_close}",
            cls : 'secondaryBtn',
            handler: function() {
                Ext.getCmp('entitlementsWindow').hide(); 
            }
        }]
    });
    
    // in IE the width and height of the window are incorrect until 
    // afterlayout so don't align until then
    entitlementsWindow.on('afterlayout', function() {
        entitlementsWindow.alignTo(analyzeTabPanel.getEl(), 't-t');
    });
    
    return entitlementsWindow;
};

SailPoint.Identity.Search.scheduleCertification = function(grid, isAdvanced) {
    var formName = (isAdvanced) ? 'advancedIdentityResultForm' : 'identityResultForm';
    
    var btnName = formName + ':' + ((isAdvanced) ? 'advancedScheduleCertificationBtn' : 'scheduleCertificationBtn');
    var certifyAllName = formName + ':' + ((isAdvanced) ? 'advancedCertifyAll' : 'certifyAll');
    var idsToCertifyName = formName + ':' + ((isAdvanced) ? 'advancedIdsToCertify' : 'idsToCertify');

    if(grid.selModel.isAllSelected()) {
        /** If they unselected users, we need to get those and exclude them from the cert **/
        if(grid.selModel.getExcludedIds().length > 0) {
            Ext.getDom(idsToCertifyName).value = arrayToString(grid.selModel.getExcludedIds(), false);
        }
        
        Ext.getDom(certifyAllName).value = 'true';
        Ext.getDom(btnName).click();
    } else if(grid.selModel.getSelectedIds().length < 1) {
        Ext.MessageBox.alert('#{msgs.dialog_no_identities}', '#{msgs.identity_search_err_select_identity_cert}');
        return;
    } else {          
        Ext.getDom(idsToCertifyName).value = arrayToString(grid.selModel.getSelectedIds(), false);
        Ext.getDom(btnName).click();
    }
};

SailPoint.Identity.Search.validateSearch = function() {
    SailPoint.Analyze.validateSearch('identitySearchForm', 'identity');
};

/**
 * The page stores previous searches in hidden divs.  For example the email suggest stores
 * the search value in an emailVal div.  To save the searches after 'RefineSearch' (instead of
 * a page load), the divs need to be updated after selection.
 */
SailPoint.Analyze.Identity.updateDiv = function(divToUpdate){
    // Encode the value since this is going to be inserted into a hidden div onto the page
    // We will decode it later when the suggest is being constructed
    Ext.fly(divToUpdate).update(Ext.String.htmlEncode(this.value));
};

/**
 * Same as above, but for multi selects
 */
SailPoint.Analyze.Identity.updateMultiDiv = function(divToUpdate){

    var current, jsonArray,
        objects = [], encodedJsonArray,
        selectedItems = this.selectedStore.data.items;
    
    for(current = 0; current < selectedItems.length; current++){
        objects.push({id: selectedItems[current].data.id, displayField: selectedItems[current].data.displayField});
    }
    
    jsonArray = {totalCount: selectedItems.length, objects: objects};
    // Encode the jsonArray since this is going to be inserted into a hidden div onto the page
    // We will decode it later when the suggest is being constructed
    encodedJsonArray = Ext.String.htmlEncode(JSON.stringify(jsonArray));
    
    Ext.fly(divToUpdate).update(encodedJsonArray);
    
};
/**
 * This file contains the logic needed to initialize and update the multi suggest components
 * on the analyzeIdentityAttributes.xhtml page
 */
SailPoint.Analyze.Identity.initializeAttributes = function() {
 
    if (Ext.getDom('emailVal')) {
      var emailSuggest = Ext.getCmp('emailSuggestCmp');
      // Decode the contents of the hidden div since they were encoded to preserve previous searches
      var emailVal = Ext.String.htmlDecode(Ext.getDom('emailVal').innerHTML);
      
      if (emailSuggest) {
        emailSuggest.destroy();
      }  
      emailSuggest = new SailPoint.DistinctRestSuggest({
        id: 'emailSuggestCmp',
        renderTo: 'emailSuggest',
        binding: 'email',
        value: emailVal,
        valueField: 'displayName',
        width: 200,
        freeText: true,
        className: 'Identity',
        column: 'email',
        suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
        listConfig : {width : 300}
      });
      emailSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,emailSuggest,['emailVal']));
    }
    
    
    if (Ext.getDom('managerVal')) {
        var managerSuggest = Ext.getCmp('managerSuggestCmp');
        // Decode the contents of the hidden div since they were encoded to preserve previous searches
        var managerVal = Ext.String.htmlDecode(Ext.getDom('managerVal').innerHTML);
        
        if (managerSuggest) {
          managerSuggest.destroy();
        }  
        
        managerSuggest = new SailPoint.DistinctRestSuggest({
          id: 'managerSuggestCmp',
          renderTo: 'managerSuggest',
          binding: 'manager',
          value: managerVal,
          valueField: 'displayName',
          width: 200,
          freeText: true,
          className: 'Identity',
          column: 'manager.displayName',
          suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
          listConfig : {width : 300}
        });
        managerSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,managerSuggest,['managerVal']));
      }
      
    if (Ext.getDom('administratorVal')) {
        var administratorSuggest = Ext.getCmp('administratorSuggestCmp');
        // Decode the contents of the hidden div since they were encoded to preserve previous searches
        var administratorVal = Ext.String.htmlDecode(Ext.getDom('administratorVal').innerHTML);
        
        if (administratorSuggest) {
            administratorSuggest.destroy();
        }

        administratorSuggest = new SailPoint.DistinctRestSuggest({
          id: 'administratorSuggestCmp',
          renderTo: 'administratorSuggest',
          binding: 'administrator',
          value: administratorVal,
          valueField: 'displayName',
          width: 200,
          freeText: true,
          className: 'Identity',
          column: 'administrator.displayName',
          suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
          listConfig : {width : 300}
        });
        administratorSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,administratorSuggest,['administratorVal']));
      }
      
    
    // Only initialize the suggest if it was rendered
    if (Ext.getDom('appNameMultiSuggest')) {
        var appNameMultiSuggest = Ext.getCmp('appNameMultiSuggestCmp');
        if (appNameMultiSuggest) {
            appNameMultiSuggest.destroy();
        }

        appNameMultiSuggest = new SailPoint.MultiSuggest({
            id: 'appNameMultiSuggestCmp',
            renderTo: 'appNameMultiSuggest',
            suggestType: 'application',
            // Decode the contents of the hidden div since they were encoded to preserve previous searches
            jsonData: JSON.parse(Ext.String.htmlDecode(Ext.getDom('appNameMultiSuggestData').innerHTML)),
            inputFieldName: 'appNameSuggest'
        });        
        appNameMultiSuggest.on('addSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv, appNameMultiSuggest, ['appNameMultiSuggestData']));
        appNameMultiSuggest.on('removeSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv, appNameMultiSuggest, ['appNameMultiSuggestData']));
    }
    
    
    // Only initialize the suggest if it was rendered
    if (Ext.getDom('roleMultiSuggest')) {
        var roleMultiSuggest = Ext.getCmp('roleMultiSuggestCmp');
        if (roleMultiSuggest) {
            roleMultiSuggest.destroy();
        }
        
        roleMultiSuggest = new SailPoint.MultiSuggest({
            id: 'roleMultiSuggestCmp',
            renderTo: 'roleMultiSuggest',
            suggestType: 'detectableRole',
            // Decode the contents of the hidden div since they were encoded to preserve previous searches
            jsonData: JSON.parse(Ext.String.htmlDecode(Ext.getDom('roleNameMultiSuggestData').innerHTML)),
            inputFieldName: 'roleSuggest'
        });       
        roleMultiSuggest.on('addSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv,roleMultiSuggest,['roleNameMultiSuggestData']));
        roleMultiSuggest.on('removeSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv,roleMultiSuggest,['roleNameMultiSuggestData']));
    }
    
    // Only initialize the suggest if it was rendered
    if (Ext.getDom('assignedRoleMultiSuggest')) {
        var assignedRoleMultiSuggest = Ext.getCmp('assignedRoleMultiSuggestCmp');
        if (assignedRoleMultiSuggest) {
            assignedRoleMultiSuggest.destroy();
        }

        assignedRoleMultiSuggest = new SailPoint.MultiSuggest({
            id: 'assignedRoleMultiSuggestCmp',
            renderTo: 'assignedRoleMultiSuggest',
            suggestType: 'assignableRole',
            // Decode the contents of the hidden div since they were encoded to preserve previous searches
            jsonData: JSON.parse(Ext.String.htmlDecode(Ext.getDom('assignedRoleNameMultiSuggestData').innerHTML)),
            inputFieldName: 'assignedRoleSuggest'
        });
        assignedRoleMultiSuggest.on('addSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv, assignedRoleMultiSuggest, ['assignedRoleNameMultiSuggestData']));
        assignedRoleMultiSuggest.on('removeSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv, assignedRoleMultiSuggest, ['assignedRoleNameMultiSuggestData']));
    }

    // Only initialize the suggest if it was rendered
    if (Ext.getDom('workgroupsMultiSuggest')) {
        var workgroupMultiSuggest = Ext.getCmp('workgroupsMultiSuggestCmp');
        if (workgroupMultiSuggest) {
            workgroupMultiSuggest.destroy();
        }

        workgroupMultiSuggest = new SailPoint.MultiSuggest({
            id : 'workgroupsMultiSuggestCmp',
            renderTo: 'workgroupsMultiSuggest',
            suggestType: 'identity',
            // Decode the contents of the hidden div since they were encoded to preserve previous searches
            jsonData: JSON.parse(Ext.String.htmlDecode(Ext.getDom('workgroupsMultiSuggestData').innerHTML)),
            baseParams: {context: 'OnlyWorkgroups'},
            inputFieldName: 'workgroupsSuggest'
        });    
        workgroupMultiSuggest.on('addSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv,workgroupMultiSuggest,['workgroupsMultiSuggestData']));
        workgroupMultiSuggest.on('removeSelection', Ext.bind(SailPoint.Analyze.Identity.updateMultiDiv,workgroupMultiSuggest,['workgroupsMultiSuggestData']));
    }
    
    if (Ext.getDom('identInstanceVal')) {
      var identInstanceSuggest = Ext.getCmp('identInstanceSuggestCmp');
      // Decode the contents of the hidden div since they were encoded to preserve previous searches
      var identInstanceVal = Ext.String.htmlDecode(Ext.getDom('identInstanceVal').innerHTML);
      
      if (identInstanceSuggest) {
        identInstanceSuggest.destroy();
      }  
      identInstanceSuggest = new SailPoint.DistinctRestSuggest({
        id: 'identInstanceSuggestCmp',
        renderTo: 'identInstanceSuggest',
        binding: 'identInstance',
        value: identInstanceVal,
        valueField: 'displayName',
        width: 300,
        freeText: true,
        className: 'Link',
        column: 'instance',
        suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
        listConfig : {width : 300}
      });
      identInstanceSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,identInstanceSuggest,['identInstanceVal']));
    }
    
    
    if (Ext.getDom('displayNameVal')) {
      var displayNameSuggest = Ext.getCmp('displayNameSuggestCmp');
      // Decode the contents of the hidden div since they were encoded to preserve previous searches
      var displayNameVal = Ext.String.htmlDecode(Ext.getDom('displayNameVal').innerHTML);
      
      if (displayNameSuggest) {
        displayNameSuggest.destroy();
      }  
      displayNameSuggest = new SailPoint.DistinctRestSuggest({
        id: 'displayNameSuggestCmp',
        renderTo: 'displayNameSuggest',
        binding: 'displayName',
        value: displayNameVal,
        valueField: 'displayName',
        width: 200,
        freeText: true,
        className: 'Identity',
        column: 'displayName',
        suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
        listConfig : {width : 300}
      });
      displayNameSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,displayNameSuggest,['displayNameVal']));
    }
    
    
    if (Ext.getDom('userNameVal')) {
      var userNameSuggest = Ext.getCmp('userNameSuggestCmp');
      // Decode the contents of the hidden div since they were encoded to preserve previous searches
      var userNameVal = Ext.String.htmlDecode(Ext.getDom('userNameVal').innerHTML);
      
      if (userNameSuggest) {
        userNameSuggest.destroy();
      }  
      userNameSuggest = new SailPoint.DistinctRestSuggest({
        id: 'userNameSuggestCmp',
        renderTo: 'userNameSuggest',
        binding: 'userName',
        value: userNameVal,
        valueField: 'displayName',
        width: 200,
        freeText: true,
        className: 'Identity',
        column: 'name',
        suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
        listConfig : {width : 300}
      });
      userNameSuggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv,userNameSuggest,['userNameVal']));
    }
    
    
    
    /** Set up suggest fields for all of the extended attributes that have string values **/
    var extendedFields = Ext.DomQuery.select('div[class=identityAttribute]');
    Ext.each(extendedFields, function (field) {
      var id = field.id,
          simpleId = field.id.substring(0, field.id.length - 3),
          key = simpleId.substring(17),
          className = 'Identity';
      
      if(key.indexOf("Link_") === 0) {
          className = 'Link';
      }

      var suggest = Ext.getCmp(id+'SuggestCmp'),
          // Decode the contents of the hidden div since they were encoded to preserve previous searches
          suggestVal = Ext.String.htmlDecode(field.innerHTML),
          type = Ext.getDom(simpleId+'Type').innerHTML;

      if(suggest) {
          suggest.destroy();
      }

        var f = Ext.get(field),
            prevSib = f.prev("input"),
            nextSib = f.next("div[id*=" + simpleId + "]");
      
      if(type === 'sailpoint.object.Identity') {
        suggest = new SailPoint.DistinctRestSuggest({
          id: id+'SuggestCmp',
          renderTo: simpleId+"Suggest",
          binding: prevSib.id,
          value: suggestVal,
          valueField: 'displayName',
          width: 200,
          freeText: true,
          className: 'Identity',
          column: 'displayName',
          suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
          listConfig : {width : 300}
        });
      } else {
        suggest = new SailPoint.DistinctRestSuggest({
          id: id+'SuggestCmp',
          renderTo: simpleId+"Suggest",
          binding: prevSib.id,
          value: suggestVal,
          valueField: 'displayName',
          width: 200,
          freeText: true,
          className: className,
          column: nextSib.dom.innerHTML,
          suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
          listConfig : {width : 300}
        });
      }

      suggest.on('blur', Ext.bind(SailPoint.Analyze.Identity.updateDiv, suggest, [field]));
      SailPoint.Identity.Search.extendedAttributeSuggests.push(suggest);
      
    });
    
    /** Set up date fields for all of the extended attributes that have string values **/
    /* Not currently used
    var dateFields = Ext.DomQuery.select('div[class=identityAttributeDateField]');
    Ext.each(dateFields, function (field) {
      var id = field.id;
      var simpleId = field.id.substring(0,field.id.length-4);
      var key = simpleId.substring(17);
      
      var dateField = Ext.getCmp(id+'DateFieldCmp');
      
      if (dateField) {
        dateField.destroy();
      }  
      
      dateField = new SailPoint.StartEndDateField({
        id: id+'DateFieldCmp',
        renderTo: field,
        binding: field.nextSibling.id
      });
    });*/

    SailPoint.Analyze.initializeSubmit('identitySearchForm', 'preIdentitySearchBtn');
};

SailPoint.Analyze.Identity.finishRerender = function() {
    resizeTables('identitySearchForm');
    SailPoint.Analyze.Identity.initializeAttributes();
    SailPoint.Analyze.Identity.initializeIdentityEntitlements(); // Don't forget about the entitlements.
    Ext.getCmp('spViewport').doLayout();
};

var appSuggest;
var attributeSuggest;
var entitlementSuggest;

/**
 * Adjust the other suggests when the application is changed.
 * 
 */
SailPoint.Analyze.Identity.appSelected = function(comp, record, index) {

    var val;
    if ( comp )
        val = comp.getValue();

    var queryParams = {};
    attributeSuggest.clearValue();
    entitlementSuggest.clearValue();
    if ( val ) {
        queryParams['applicationName'] = val;
        queryParams['excludeNullAttributes'] = true;
        
        attributeSuggest.getStore().getProxy().extraParams = queryParams;
        attributeSuggest.enable();
        // Call back to automatically select the first attribute when there is just one
        // interesting attribute
        var loadCallBack = function(records, options, success) {            
            var combo = Ext.getCmp('attributeSuggestCmp');
            if ( combo != null ) {
                var store = attributeSuggest.getStore();
                if ( store != null ) {
                    if ( store.count() == 1 ) {
                        var onlyVal = store.getAt(0);
                        if ( onlyVal != null ) {
                            var valueList = Ext.Array.from(onlyVal);
                            combo.select(valueList);
                            // for whatever reasont he select doesn't fire an event,
                            // do it manually
                            combo.fireEvent("select", combo, valueList);                            
                        }
                    }
                }
            }
        };
        attributeSuggest.getStore().load({
            callback: loadCallBack,
            scope: this
        });

    } else {
        attributeSuggest.getStore().getProxy().extraParams = queryParams;
        attributeSuggest.disable();
        entitlementSuggest.disable();
    }  
};

/**
 * Adjust the entitlements suggest once the user has
 * selected an application and attribute value.
 */
SailPoint.Analyze.Identity.attributeSelected = function(comp, record, index) {
    var type = null;
    var rec = record[0];
    if ( rec ) {
        type = rec.data['type'];
    }
    SailPoint.Analyze.Identity.getEntitlementSuggest(type);
};

/**
 * Build the entitlement suggests if they don't exist.
 * If they do exist destory them and rebuild.
 */
SailPoint.Analyze.Identity.initializeIdentityEntitlements = function() { 

    SailPoint.Analyze.Identity.getEntitlementSuggest(null);
        
    attributeSuggest = Ext.getCmp('attributeSuggestCmp');
    if (attributeSuggest) {
        attributeSuggest.destroy();
    }  
    
    attributeSuggest = new SailPoint.ManagedAttributeNameSuggest({
        id: 'attributeSuggestCmp',        
        renderTo: 'attributeSuggestDiv',
        disabled : true,
        binding: 'attributeSuggest',
        value: Ext.getDom('attributeSuggestVal').innerHTML,
        width: 200,
        listConfig: {
            width: 300
        }
    });
    attributeSuggest.on('select', SailPoint.Analyze.Identity.attributeSelected , this);    

    appSuggest = Ext.getCmp('entitlementAppSuggestCmp');
    if (appSuggest) {
        appSuggest.destroy();
    }  
    appSuggest = new SailPoint.DistinctRestSuggest({
        id: 'entitlementAppSuggestCmp',
        renderTo: 'applicationSelectorDiv',
        binding: 'applicationSelector',
        value: Ext.getDom('applicationSelectorVal').innerHTML,
        valueField: 'displayName',
        width: 200,
        className: 'ManagedAttribute',
        column: 'application.name',
        suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
        listConfig: {
            width: 300
        }
    });         
    appSuggest.on('select', SailPoint.Analyze.Identity.appSelected , this);
};

/**
 * Rebuild the entitlement suggest depending on the type 
 * of entitlement that is selected.
 * 
 * We can't use the ManagedAttribute table to drive 
 * permissions because we don't get targets.  For these
 * defer to the IdentityEntitlements table for the values.
 * They won't be display like values, but it'll 
 * be better then typing in the values.
 * 
 * Initially this is called with a null values and as
 * the attribute is selected ( which has a type ) 
 * we'll refresh the suggest based on the type.
 * 
 */
SailPoint.Analyze.Identity.getEntitlementSuggest = function(type) { 
    
    entitlementSuggest = Ext.getCmp('entitlementSuggestCmp');
    if (entitlementSuggest) {
        entitlementSuggest.destroy();
    }

    // do this to avoid having to check for
    // the two suggests in the logic below
    var reload = false;
    if ( attributeSuggest && attributeSuggest ) {
        reload = true;
    }
    
    var extraParams = {};
    if (  type === "Permission" ) {
        entitlementSuggest = new SailPoint.DistinctRestSuggest({
            id: 'entitlementSuggestCmp',
            renderTo: 'entitlementSuggestDiv',
            disabled : true,
            binding: 'entitlementSuggest',
            value: Ext.getDom('entitlementSuggestVal').innerHTML,
            width: 200,      
            column: "value",
            className: "IdentityEntitlement",
            suggestUrl: '/rest/analyze/identitySearchPanel/suggest',
            listConfig: {
                width: 300
            }
        });
        
        if ( reload ) {
            extraParams['filterString'] = 'application.name == \"'+ appSuggest.getValue() +'\" && name == \"'+ attributeSuggest.getValue() +'\"';
        }
    } else {
            entitlementSuggest = new SailPoint.ManagedAttributeSuggest({
                id: 'entitlementSuggestCmp',
                renderTo: 'entitlementSuggestDiv',
                disabled : true,
                binding: 'entitlementSuggest',
                value: Ext.getDom('entitlementSuggestVal').innerHTML,
                width: 200,
                listConfig: {
                    width: 300
                }
            });

            if ( reload ) {
                extraParams['applicationName'] = appSuggest.getValue();
                extraParams['attribute'] = attributeSuggest.getValue();
            }
    }
    
    entitlementSuggest.getStore().getProxy().extraParams = extraParams;
    if ( reload ) {
        entitlementSuggest.enable();    
        entitlementSuggest.getStore().load();
    } else {
        entitlementSuggest.disable();
    }
};

/**
 * Clear all of the evalues from the entitlement selection 
 * suggests.  Disable all but the application drop down.
 */
SailPoint.Analyze.Identity.clearIdentityEntitlements = function() { 
    var entitlementAppSuggest = Ext.getCmp('entitlementAppSuggestCmp');
    if ( entitlementAppSuggest != null ) {
        entitlementAppSuggest.clearValue();
        Ext.getDom('applicationSelector').value = '';
    }

    var attrSuggest = Ext.getCmp("attributeSuggestCmp");
    if ( attrSuggest != null ) {
        attrSuggest.clearValue();
        attrSuggest.disable();
        Ext.getDom('attributeSuggest').value = '';
    }

    var valueSuggest = Ext.getCmp("entitlementSuggestCmp");
    if ( valueSuggest != null ) {
        valueSuggest.clearValue();
        valueSuggest.disable();
        Ext.getDom('entitlementSuggest').value = '';
    }
};
