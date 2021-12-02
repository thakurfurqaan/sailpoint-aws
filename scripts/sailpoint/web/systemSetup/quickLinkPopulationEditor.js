/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.systemSetup.QuickLinkPopulationEditor', {
    extend: 'Ext.container.Container',

    margin: '0 0 0 15',
    qlGridConfig: null,
    qlGridKey: null,
    dirty: false,
    
    
    roleRuleSelector: null,
    applicationRuleSelector: null,
    managedAttributeRuleSelector: null,
    
    roleRemoveRuleSelector: null,
    applicationRemoveRuleSelector: null,
    managedAttributeRemoveRuleSelector: null,
    
    constructor : function(config) {
        this.callParent(arguments);
    },
    initComponent: function() {
        this.callParent(arguments);
    },
    
    getQlGridConfig: function() {
        return this.qlGridConfig;
    },
    
    getQlGridKey: function() {
        return this.qlGridKey;
    },

    isPageDirty: function() {
        return this.dirty;
    },

    markPageDirty: function(dirty) {
        this.dirty = dirty;
    },

    refreshTabs: function(items) {
      var tabPanel = this.down('#qlpTabPanel')
          activeTabId = tabPanel.getActiveTab().getId();
      tabPanel.removeAll();
      tabPanel.add(items);
      // reset activeTabId if the previous tab was the 'select a quicklink tab', we don't render that tab anymore
      if ('qlpDefaultTabId' === activeTabId) {
          activeTabId = 0;
      }
      //reset active tab for create new
      if (! Ext.getDom('editForm:selectedDynamicScopeId').value) {
        activeTabId = 0;
      }
      tabPanel.setActiveTab(activeTabId);
      // update components on the configuration page
      this.initRules();
      
      // ensure the save button is rendered
      tabPanel.down('#saveBtnItemId').show();
    },
    
    initRules: function() {
        this.roleRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'RoleSelectorRuleDiv', null, '#{msgs.select_rule}', { 
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'RoleSelectorRule',
                formBinding: 'editForm',
                renderTo: 'RoleSelectorRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.roleRuleSelector, Ext.getDom('editForm:RoleSelectorRule'), Ext.getDom('editForm:RoleSelectorRuleName'));
        this.roleRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.roleRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);
        
        this.applicationRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'ApplicatioSelectorRuleDiv', null, '#{msgs.select_rule}', {
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'ApplicationSelectorRule',
                formBinding: 'editForm',
                renderTo: 'ApplicationSelectorRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.applicationRuleSelector, Ext.getDom('editForm:ApplicationSelectorRule'), Ext.getDom('editForm:ApplicationSelectorRuleName'));
        this.applicationRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.applicationRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);

        this.managedAttributeRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'ManagedAttributeSelectorRuleDiv', null, '#{msgs.select_rule}', {
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'ManagedAttributeSelectorRule',
                formBinding: 'editForm',
                renderTo: 'ManagedAttributeSelectorRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.managedAttributeRuleSelector, Ext.getDom('editForm:ManagedAttributeSelectorRule'), Ext.getDom('editForm:ManagedAttributeSelectorRuleName'));
        this.managedAttributeRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.managedAttributeRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);

        this.roleRemoveRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'RoleSelectorRemoveRuleDiv', null, '#{msgs.select_rule}', { 
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'RoleSelectorRemoveRule',
                formBinding: 'editForm',
                renderTo: 'RoleSelectorRemoveRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.roleRemoveRuleSelector, Ext.getDom('editForm:RoleSelectorRemoveRule'), Ext.getDom('editForm:RoleSelectorRemoveRuleName'));
        this.roleRemoveRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.roleRemoveRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);
        
        this.applicationRemoveRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'ApplicationSelectorRemoveRuleDiv', null, '#{msgs.select_rule}', {
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'ApplicationSelectorRemoveRule',
                formBinding: 'editForm',
                renderTo: 'ApplicationSelectorRemoveRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.applicationRemoveRuleSelector, Ext.getDom('editForm:ApplicationSelectorRemoveRule'), Ext.getDom('editForm:ApplicationSelectorRemoveRuleName'));
        this.applicationRemoveRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.applicationRemoveRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);

        this.managedAttributeRemoveRuleSelector = 
            SailPoint.SuggestFactory.createSuggest('rule', 'ManagedAttributeSelectorRemoveRuleDiv', null, '#{msgs.select_rule}', {
                extraParams: { ruleType: 'RequestObjectSelector' },
                binding: 'ManagedAttributeSelectorRemoveRule',
                formBinding: 'editForm',
                renderTo: 'ManagedAttributeSelectorRemoveRuleDiv',
                margin: '0 0 0 10'
            });
        this.setInitialValue(this.managedAttributeRemoveRuleSelector, Ext.getDom('editForm:ManagedAttributeSelectorRemoveRule'), Ext.getDom('editForm:ManagedAttributeSelectorRemoveRuleName'));
        this.managedAttributeRemoveRuleSelector.on('select', SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler, this);
        this.managedAttributeRemoveRuleSelector.on('change', SailPoint.systemSetup.QuickLinkPopulationEditor.ruleChangedHandler, this);
    },
    
    setInitialValue : function(ruleSuggest, idElement, nameElement) {
        var id = idElement.value,
            name = nameElement.value;
        if (!Ext.isEmpty(id) && !Ext.isEmpty(name) && ruleSuggest) {
            //load the store first so that value displayed will not disappear without selecting an entry
            ruleSuggest.getStore().load();
            ruleSuggest.setValue(id);
            ruleSuggest.setRawValue(name);
        }
    },
    
    updateRuleSelector: function() {
        this.roleRuleSelector.getStore().load();
        this.applicationRuleSelector.getStore().load();
        this.managedAttributeRuleSelector.getStore().load();
        this.roleRemoveRuleSelector.getStore().load();
        this.applicationRemoveRuleSelector.getStore().load();
        this.managedAttributeRemoveRuleSelector.getStore().load();
    },

    /**
     * Match the removal rules to the request rules
     */
    matchRemoveControl: function() {
        this.copyFromRequestControl(this.roleRuleSelector, this.roleRemoveRuleSelector,
                'editForm:RoleSelectorRemoveRule', 'editForm:RoleSelectorRemoveRuleName');
        this.copyFromRequestControl(this.applicationRuleSelector, this.applicationRemoveRuleSelector,
                'editForm:ApplicationSelectorRemoveRule', 'editForm:ApplicationSelectorRemoveRuleName');
        this.copyFromRequestControl(this.managedAttributeRuleSelector, this.managedAttributeRemoveRuleSelector,
                'editForm:ManagedAttributeSelectorRemoveRule', 'editForm:ManagedAttributeSelectorRemoveRuleName');
    },

    /**
     * @param requestSuggest: suggest element to copy from
     * @param removeSuggest: suggest element to copy to
     * @param id: rule id hidden element id
     * @param nameId: rule name hidden element id
     * copy suggest rule, this needs to copy both back end DTO binding value and display value
     */
    copyFromRequestControl: function(requestSuggest, removeSuggest, id, nameId) {
        Ext.getDom(id).value = requestSuggest.getValue();
        Ext.getDom(nameId).value = requestSuggest.getRawValue();
        removeSuggest.setValue(requestSuggest.getValue());
        removeSuggest.setRawValue(requestSuggest.getRawValue());
    },

    getRuleName: function(selectorType) {
        if (selectorType === 'role') {
            return this.roleRuleSelector.getRawValue();
        } else if (selectorType === 'application') {
            return this.applicationRuleSelector.getRawValue();
        } else if (selectorType === 'managedAttribute') {
            return this.managedAttributeRuleSelector.getRawValue();
        } else if (selectorType === 'roleRemove') {
            return this.roleRemoveRuleSelector.getRawValue();
        } else if (selectorType === 'applicationRemove') {
            return this.applicationRemoveRuleSelector.getRawValue();
        } else if (selectorType === 'managedAttributeRemove') {
            return this.managedAttributeRemoveRuleSelector.getRawValue();
        }
    },

    /**
     * Most of this component is validated server-side. Currently the one exception to this
     * rule is the custom filter element.
     * @return boolean if the validation required an external Ajax call
     */
    validate: function() {
        return this.validateIdentityFilter();
    },
    
    /**
     * Validates using an Ajax request if the custom control compiles to a valid velocity template.
     * If the Ajax request was invoked and is successful, invoke finalizeSave() to perform server-side
     * validation.
     * @return boolean if the validation required an external Ajax call 
     */
    validateIdentityFilter: function() {
        var componentId = 'CustomFilterError',
            enableCustomControl = Ext.getDom('editForm:EnableCustomControl').checked,
            filterTemplateString = Ext.getDom('editForm:CustomFilterInput').value;
        
        if (!enableCustomControl) {
            return false;
        }
        // empty filterTemplateString is valid in Ajax request, so let server mark as invalid by returning now
        if (Ext.isEmpty(filterTemplateString)) {
            return false;
        }
        
        Ext.Ajax.request({
            url: SailPoint.getRelativeUrl('/rest/velocity/validateIdentityFilter'),
            success: function(response, options) {
                var results = JSON.parse(response.responseText), 
                    resultsValid = (results.isValid.toString().toLowerCase() === 'true'),
                    errorCmp = Ext.get(componentId),
                    errorMsg;
                
                if (resultsValid) { 
                    errorCmp.hide();
                    this.finalizeSave();
                } else {
                    // Note that the scope is in the lcmConfigTabPanel
                    errorMsg = results.errorObj.msg;
                    errorCmp.update(errorMsg);
                    errorCmp.show();
                }
                
            },
            failure: function(response, options) {
                var errorCmp = Ext.get(componentId), 
                    errorMsg = '#{msgs.lcm_validation_timed_out}';
                errorCmp.update(errorMsg);
                errorCmp.show();
            },
            params: {
                componentId: componentId,
                template: filterTemplateString
            },
            scope: this
        });
        
        return true;
    },
    
    /**
     * Called from the save button. First performs validation, if Ajax is not required for validation will invoke
     * the finalizeSave method.
     */
    save: function() {
        var isAjaxRequested = this.validate();
        
        if (!isAjaxRequested) {
            this.finalizeSave();
        }
    },
    
    /**
     * Serializes components into hidden input fields, then click the hidden saveAction to invoke the server-side save. 
     */
    finalizeSave: function() {
        Ext.getCmp('attributeFilterCmpId').save();
        Ext.getDom('editForm:selectedQLOsJson').value = Ext.getCmp('qlpQuicklinksGrid').getSelectedQLOsJson();
        Ext.getDom('editForm:saveAction').click();
    },
    
    statics: {
        markPageDirty: function(dirty) {
            var cmp = Ext.getCmp('qlpEditorCmp');
            if (cmp) {
                cmp.markPageDirty(dirty);
            }
        },
        isPageDirty: function() {
            var cmp = Ext.getCmp('qlpEditorCmp');
            if (cmp) {
                return cmp.isPageDirty();
            }
            return false;
        },
        createEditor: function(quicklinkGridConfig, gridConfigKey) {
              Ext.create('SailPoint.systemSetup.QuickLinkPopulationEditor', {
                  id: 'qlpEditorCmp',
                  renderTo: 'qlpEditorDiv',
                  layout: {
                      type: 'hbox'
                  },
                  qlGridConfig: quicklinkGridConfig,
                  qlGridKey: gridConfigKey,
                  dirty: false,
                  items: [
                          SailPoint.systemSetup.QuickLinkPopulationEditor.createDSListGrid(),
                          SailPoint.systemSetup.QuickLinkPopulationEditor.createTabPanel([
                              { id: 'qlpDefaultTabId', 
                                title: '#{msgs.qlp_editor_tab_configuration}', 
                                items: [{xtype: 'component', html: '<span class="pageInfo">#{msgs.qlp_editor_default}</span>'}]
                              }
                          ])
                  ]
              });
        },
        
        showLoadMask: function() {
            var cmp = Ext.getCmp('qlpEditorCmp');
            cmp.setLoading(true);
        },
        
        refresh: function() {
          var qlpQuicklinksGrid = Ext.getCmp('qlpQuicklinksGrid'),
              appSelectorCmp = Ext.getCmp('SelectorApplicationCmp'),
              cmp = Ext.getCmp('qlpEditorCmp'),
              leftGrid = Ext.getCmp('qlpEditorLeftGrid'),
              removeExtItal, addExtItal;
              
          if (leftGrid) {
              removeExtItal = leftGrid.getDeleteIconHTML(leftGrid.deselectIndex);
              addExtItal = leftGrid.getDeleteIconHTML(leftGrid.selectIndex);
          }
          if (qlpQuicklinksGrid) {
            qlpQuicklinksGrid.destroy();
          }
          if (appSelectorCmp) {
            appSelectorCmp.destroy();
          }
          if (cmp) {
            cmp.refreshTabs(SailPoint.systemSetup.QuickLinkPopulationEditor.createTabs(cmp.getQlGridConfig(), cmp.getQlGridKey()));
            SailPoint.systemSetup.QuickLinkPopulationEditor.initIdentitySuggest();
            SailPoint.systemSetup.QuickLinkPopulationEditor.initRequestControl();
            SailPoint.AssignmentRule.initializeSelectors();
            buildTooltips(cmp.getEl().dom); // from misc.js
            cmp.doLayout();
          }
          //update the layout due to chrome not taking the full width
          appSelectorCmp = Ext.getCmp('SelectorApplicationCmp');
          if (appSelectorCmp) {
            appSelectorCmp.updateLayout();
          }
          if (cmp) {
              cmp.setLoading(false);
          }
          //moved the remove and addition of the 'X' into the refresh since that is when a click is fully registered
          if (removeExtItal) {
              removeExtItal.removeCls('fa-times');
          }
          if (addExtItal) {
              addExtItal.addCls('fa-times');
          } 
          
        },
        
        scrollToMessage: function() {
            var ele = document.getElementById('spErrorMsgsDiv');
            
            if (ele && ele.scrollIntoView) {
                ele.scrollIntoView();
            }
        },

        createDSListGrid: function() {
          SailPoint.Store.createRestStore({
            storeId : 'dynamicScopeListStore',
            autoLoad: true,
            url: SailPoint.getRelativeUrl('/rest/dynamicScopes'),
            fields : [ 'name', 'id' ],
            totalProperty: 'count',
            method: 'GET',
            remoteSort: true,
            simpleSortMode: true
          });
        
          return Ext.create('SailPoint.grid.PagingGrid', {
              id: 'qlpEditorLeftGrid',
              itemId: 'qlpLeftGrid',
              flex: 1,
              store: Ext.data.StoreManager.lookup('dynamicScopeListStore'),
              cls: 'smallFontGrid selectableGrid',
              stateful: true,
              loadMask: true,
              viewConfig: {
                  scrollOffset: 1,
                  stripeRows:true
              },
              hideHeaders: true,
              minWidth: 200,
              columns: [{
                  sortable: false, dataIndex: 'name'
              }, {
                  sortable: false, dataIndex: '', width: 40,
                  renderer: function() {
                      return '<i class="fa fa-pencil fa-fw"/>';
                  }
              }, {
                  sortable: false, dataIndex: '', width: 40,
                  renderer: function() {
                       return '<i class="fa fa-fw"/>';
                  }
              }],
              enableColumnMove: false,
              enableColumnHide: false,
              currentRowIndex: undefined,
              deselectIndex: undefined,
              selectIndex: undefined,
              /**
               * The order of events for these listeners is deselect, select, cellclick. When no previous 
               * DynamicScope has been selected, only select and cellclick have been fired. We use currentRowIndex
               * to determine if the dynamic scope has already been selected (i.e. it contains a delete icon).
               * This allows a click inside the 'delete' column of an unselected dynamic scope to act as a selection change. 
               */
              listeners: {
                  cellclick: function(gridView, td, cellIndex, record, tr, rowIndex, e, eOpts) {
                      var selectedId, extItal, me;
                      me = this;
                      selectedId = record.getId();
                      
                      if (cellIndex === 2) { // if delete
                          if (this.currentRowIndex === rowIndex) { // clicked on the delete icon of currently selected row
                              Ext.MessageBox.confirm('#{msgs.qlp_editor_confirm_delete_title}', '#{msgs.qlp_editor_confirm_delete_message}', function(val) {
                                  if (val === "yes") {
                                      this.currentRowIndex = undefined;
                                      Ext.getDom('editForm:deleteButton').click();
                                  }
                              });
                              return;
                          }
                          // else click occurred in the delete cell of a currently unselected row, let fall through
                      }
                      
                      //Page dirty case
                      if (SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                          Ext.MessageBox.confirm('#{msgs.qlp_editor_confirm_page_dirty_title}', '#{msgs.qlp_editor_confirm_page_dirty_message}', function(val) {
                              if (val === "yes") {
                                  SailPoint.systemSetup.QuickLinkPopulationEditor.markPageDirty(false);
                                  //unlock the model and manually select the record since the cellclick event has stopped at this point
                                  me.getSelectionModel().setLocked(false);
                                  me.getSelectionModel().select(record);
                                  me.setCellClickNavigation(selectedId, rowIndex);
                              }
                          });
                          return;
                      }
                      // here is the normal navigation case 
                      this.setCellClickNavigation(selectedId, rowIndex);
                  },
                  deselect: function(rowModel, record, index, eOpts) {
                      if (!SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                          this.deselectIndex = index;
                      }
                  },
                  select: function(rowModel, record, index, eOpts) {
                      this.selectIndex = index;
                  },
                  /**
                   * Here in the beforedeselect listener, we will lock up the model for selection if the page is dirty
                   * This will prevent any clicks and select listeners to invoke
                   */
                  beforedeselect: function(rowModel, record, index, eOpts ) {
                      var selectionModel = this.getSelectionModel();
                      if (selectionModel && !selectionModel.isLocked() && SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                          selectionModel.setLocked(true);
                          return false;
                      }
                  }
              },
              hidebbar: true,
              dockedItems: [{
                  xtype: 'pagingtoolbar',
                  store: Ext.data.StoreManager.lookup('dynamicScopeListStore'),
                  beforePageText: '',
                  inputItemWidth: 25,
                  dock: 'bottom',
                  cls: 'tinytoolbar',
                  displayInfo: false,
                  listeners: {
                      beforeRender: function(cmp, eOpts) {
                          // hide all separator bars from paging toolbar
                          var allSeps = cmp.query('tbseparator');
                          Ext.Array.forEach(allSeps, function(item, idx) {
                              item.hide();
                          });
                          // also hide the refresh button
                          cmp.down('#refresh').hide();
                      }
                  }
              }],
              /**
               * Returns an Ext.dom.Element that is the 'X' delete icon
               * @param index the row index of the grid to retrieve the delete icon from
               */
              getDeleteIconHTML: function(index) {
                  var rowElem = this.getView().getNode(index), 
                  italElem;
                  
                  if (rowElem) {
                      italElem = rowElem.querySelector('td:last-child i');
                      if (italElem) {
                          return new Ext.dom.Element(italElem);
                      }
                  }
              },
              /**
               * This is the default case that cellclick and others will use when navigation
               * to select another quicklink population is allowed
               */
              setCellClickNavigation: function(selectedId, rowIndex) {
                  Ext.getDom('editForm:selectedDynamicScopeId').value = selectedId;
                  // treat as view/edit cellIndex 0/1
                  this.currentRowIndex = rowIndex;
                  Ext.getDom('editForm:refreshButton').click();
              },
              /**
               * This is the default case where when the new button is pressed
               */
              newButtonNavigation: function() {
                  //set these specific indicies for the refresh logic to remove the icons for the new button case
                  this.selectIndex = undefined;
                  this.deselectIndex = this.currentRowIndex;
                  Ext.getCmp('qlpEditorCmp').down('#qlpLeftGrid').getSelectionModel().deselectAll();
                  Ext.getDom('editForm:selectedDynamicScopeId').value ='';
                  Ext.getDom('editForm:refreshButton').click();
              }
          });
        
        },
        /**
         * Handler used to prompt the user that the page is dirty when trying to hit the 
         * return to global settings button
         */
        returnButtonHandler: function() {                
            if (SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                Ext.MessageBox.confirm('#{msgs.qlp_editor_confirm_page_dirty_title}', '#{msgs.qlp_editor_confirm_page_dirty_message}', function(val) {
                    if (val === "yes") {
                        Ext.getDom('editForm:backAction').click();
                    }
                });
                return;
            }
            else {
                Ext.getDom('editForm:backAction').click();
            }
        },
        
        newButtonHandler: function() {
            var leftGrid = Ext.getCmp('qlpEditorLeftGrid');
            if (leftGrid) {
                if (SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                    Ext.MessageBox.confirm('#{msgs.qlp_editor_confirm_page_dirty_title}', '#{msgs.qlp_editor_confirm_page_dirty_message}', function(val) {
                        if (val === "yes") {
                            SailPoint.systemSetup.QuickLinkPopulationEditor.markPageDirty(false);
                            leftGrid.newButtonNavigation();
                        }
                    });
                    return;
                }
                else {
                    leftGrid.newButtonNavigation();
                }
            }
        },
        
        createTabPanel: function(items) {
            var tabPanelItemId = 'qlpTabPanel',
            tabPanel = Ext.getCmp(tabPanelItemId);
        
            if (tabPanel) {
                tabPanel.destroy();
            }
            
            tabPanel = Ext.create('Ext.tab.Panel', {
              itemId: tabPanelItemId,
              deferredRender: false,
              border:false,
              plain: true,
              flex: 4,
              margin: '0 15 0 15',
              cls: 'sp-toolbar',
              defaults:{autoScroll: true},
              items: items,
              bbar: [{itemId: 'saveBtnItemId', 
                      text:'#{msgs.button_save}', 
                      cls:'primaryBtn', 
                      hidden: true, 
                      handler: function() {
                          Ext.getCmp('qlpEditorCmp').save();
                      }
                    },
                    {text:'#{msgs.button_return_to_system_setup}', cls:'secondaryBtn', handler: this.returnButtonHandler}
              ],
              listeners: {
                  // bug#25895 - identity multi suggests do not render after saving tab state
                  tabchange: function(tabPanel, newCard, oldCard, eOpts) {
                      var childIds = ['inclusionsMultiSuggestCmp', 'exclusionsMultiSuggestCmp', 'attributeFilterCmpId'],
                          cmp;
                      
                      childIds.forEach(function(element, index, array) {
                          cmp = Ext.getCmp(element);
                          if (cmp) {
                              cmp.doLayout();
                          }
                      });
                  }
              }
            });
            
            return tabPanel;
        },

        createTabs: function(quicklinkGridConfig, gridConfigKey) {
            return [
                     {id:'qlpConfigurationTabId', title: '#{msgs.qlp_editor_tab_configuration}', contentEl: 'qlpConfigurationTab'},
                     {
                       id:'qlpQuickLinksTabId',
                       title: '#{msgs.qlp_editor_tab_quick_links}',
                       items: [
                           {
                               xtype: 'component',
                               html: '#{msgs.qlp_editor_tab_quick_links_message}',
                               margin: '20 20 0 20'
                           },
                           SailPoint.systemSetup.QuickLinkPopulationEditor.createQuicklinkListGrid(quicklinkGridConfig, gridConfigKey) 
                       ]
                     }
            ];
        },
        
        initIdentitySuggest: function() {
          var inclusionsMultiSuggest = Ext.getCmp('inclusionsMultiSuggestCmp'),
              exclusionsMultiSuggest, suggestData;
          
          if (inclusionsMultiSuggest) {
            inclusionsMultiSuggest.destroy();
          }
          
          suggestData = Ext.getDom('inclusionsMultiSuggestData');
          if (suggestData && suggestData.innerHTML) {
              inclusionsMultiSuggest = Ext.create('SailPoint.MultiSuggest', {
                  id: 'inclusionsMultiSuggestCmp',
                  renderTo: 'inclusionsMultiSuggest',
                  width: 300,
                  suggestType: 'identity',
                  jsonData: JSON.parse(suggestData.innerHTML),
                  inputFieldName: 'inclusionsSuggest',
                  emptyText: '#{msgs.qlp_editor_select_included_identities}'
              });
              inclusionsMultiSuggest.on('addSelection', this.pageChangedHandler, this);
              inclusionsMultiSuggest.on('removeSelection', this.pageChangedHandler, this);
          }
        
          exclusionsMultiSuggest = Ext.getCmp('exclusionsMultiSuggestCmp');
          if (exclusionsMultiSuggest) {
            exclusionsMultiSuggest.destroy();
          }
        
          suggestData = Ext.getDom('exclusionsMultiSuggestData');
          if (suggestData && suggestData.innerHTML) {
              exclusionsMultiSuggest = Ext.create('SailPoint.MultiSuggest', {
                  id: 'exclusionsMultiSuggestCmp',
                  renderTo: 'exclusionsMultiSuggest',
                  width: 300,
                  suggestType: 'identity',
                  jsonData: JSON.parse(suggestData.innerHTML),
                  inputFieldName: 'exclusionsSuggest',
                  emptyText: '#{msgs.qlp_editor_select_excluded_identities}'
              });
              exclusionsMultiSuggest.on('addSelection', this.pageChangedHandler, this);
              exclusionsMultiSuggest.on('removeSelection', this.pageChangedHandler, this);
          }
          
        },
        
        /**
         * Used as a handler for whenever the multiSuggests get an addSelection or
         * removeSelection event. Or when buttons inside panels get clicked
         */
        pageChangedHandler: function() {
            SailPoint.systemSetup.QuickLinkPopulationEditor.markPageDirty(true);
        },
        
        /**
         * Handler for when the value changes for the rules. Fires currently during the 'change' event. Had to include logic
         * because if a user clicks in and out of the combobox without even changing a value, it will fire
         */
        ruleChangedHandler: function(suggest, newValue, oldValue, eOpts) {
            //if already dirty, do not bother
            if (!SailPoint.systemSetup.QuickLinkPopulationEditor.isPageDirty()) {
                // we set the value directly on the suggest so the oldValue from the event is not populated 
                if (Ext.isEmpty(oldValue)) {
                    oldValue = suggest.getValue();
                }
                if (oldValue !== newValue) {
                    SailPoint.systemSetup.QuickLinkPopulationEditor.pageChangedHandler();
                }
            }
        },

        initRequestControl : function() {
            var domId = 'AttributeSelectorPanel',
                attrFilterId = 'attributeFilterCmpId',
                attrFilterCmp = Ext.getCmp(attrFilterId);
            
            if (Ext.getDom(domId)) {
                  if (attrFilterCmp) {
                      attrFilterCmp.destroy();
                  }
                  
                  Ext.create('SailPoint.systemSetup.lcm.AttributeFilterBuilder', {
                    id: attrFilterId,
                    renderTo: domId,
                    filterBinding: 'editForm:AttributeControlFilter',
                    errorPanel: 'AttributeSelectorErrors'
                  });
                  SailPoint.systemSetup.QuickLinkPopulationEditor.applyAttributeControl();
                  SailPoint.systemSetup.QuickLinkPopulationEditor.applySubordinateControl();
                  SailPoint.systemSetup.QuickLinkPopulationEditor.applyCustomControl();
                  SailPoint.systemSetup.QuickLinkPopulationEditor.applyAllowAll();
                  var groupSelectedBtnId = 'groupSelectedButton',
                      ungroupSelectedBtnId = 'ungroupSelectedButton',
                      deleteSelectedBtnId = 'deleteSelectedButton',
                      groupSelectedBtnCmp = Ext.getCmp(groupSelectedBtnId),
                      ungroupSelectedBtnCmp = Ext.getCmp(ungroupSelectedBtnId),
                      deleteSelectedBtnCmp = Ext.getCmp(deleteSelectedBtnId),
                      attrFilterCmp = Ext.getCmp(attrFilterId),
                      selectElements = document.querySelectorAll('#' + attrFilterId + ' select');
                  // add a click event listener to the three buttons in the attribute selector panel
                  if (groupSelectedBtnCmp) {
                      groupSelectedBtnCmp.on('click', this.pageChangedHandler, this);
                  }
                  if (ungroupSelectedBtnCmp) {
                      ungroupSelectedBtnCmp.on('click', this.pageChangedHandler, this);
                  }
                  if (deleteSelectedBtnCmp) {
                      deleteSelectedBtnCmp.on('click', this.pageChangedHandler, this);
                  }
                  //add the same handler for when a user adds an identity attribute
                  if (attrFilterCmp) {
                      attrFilterCmp.attributeSuggest.on('select', this.pageChangedHandler, this)
                  }
                  //for all select elements that get created when grouping, add the pageChangedHandler to the onchange event
                  if (selectElements) {
                      for (var i = 0; i < selectElements.length; i++) {
                          selectElements[i].onchange = this.pageChangedHandler;
                      }
                  }
            }
        },
        
        applyAllowAll: function() {
          // Hide or show all the request control options depending on whether we're going to allow or disallow
          // anyone to make requests for anyone else
          var popDefType = getSelectedRadioInput('editForm:PopulationDefinitionType');
          var isAllowAll = (popDefType === 'allowAnythingFromAnyone');
          var isMatchNone = (popDefType === 'matchNone');
          var optionsDiv = Ext.getDom('definePopOptionDiv');
          optionsDiv.style['display'] = (isAllowAll || isMatchNone) ? 'none' : '';
        },
        
        applyAttributeControl: function() {
            var enableAttributeControl = Ext.getDom('editForm:EnableAttributeControl').checked,
                attributeFilterCmp;
  
            if (enableAttributeControl) {
                Ext.getDom('AttributeSelectorRow').style['display'] = '';
                attributeFilterCmp = Ext.getCmp('attributeFilterCmpId');
                // fixes horizontal scroll bar when no objects are selected and component displayed
                attributeFilterCmp.doLayout();
            } else {
                Ext.getDom('AttributeSelectorRow').style['display'] = 'none';
            }   
        },
        
        applySubordinateControl: function() {
            var enableSubordinateControl = Ext.getDom('editForm:EnableSubordinateControl').checked;
            var subordinateChoice = getSelectedRadioInput('editForm:SubordinateChoice');
            
            if (enableSubordinateControl) {
                Ext.getDom('SubordinateChoicesRow').style['display'] = '';
                if (subordinateChoice === 'directOrIndirect') {
                    Ext.getDom('editForm:SubordinateMaxHierarchy').removeAttribute('disabled');
                    Ext.getDom('SubordinateHierarchyLevelRow').style['color'] = 'inherit';
                    
                } else {
                    Ext.getDom('editForm:SubordinateMaxHierarchy').disabled = true;
                    Ext.getDom('SubordinateHierarchyLevelRow').style['color'] = '#AEAEAE';
                }
            } else {
                Ext.getDom('SubordinateChoicesRow').style['display'] = 'none';
                Ext.getDom('editForm:SubordinateMaxHierarchy').disabled = true;
                Ext.getDom('SubordinateHierarchyLevelRow').style['color'] = '#AEAEAE';
            }
        },
        
        applyCustomControl: function() {
            var enableCustomControl = Ext.getDom('editForm:EnableCustomControl').checked;
  
            if (enableCustomControl) {
                Ext.getDom('CustomFilterRow').style['display'] = '';
            } else {
                Ext.getDom('CustomFilterRow').style['display'] = 'none';
            }
        },
        
        
        createQuicklinkListGrid: function(quicklinkGridConfig, gridConfigKey) {
          var qlpQuicklinksGrid = Ext.getCmp('qlpQuicklinksGrid'),
              qlpQuicklinkOptionsStore, selectedId;
          if (qlpQuicklinksGrid) {
            qlpQuicklinksGrid.destroy();
          }

          qlpQuicklinksGrid =  Ext.create('SailPoint.systemSetup.QuicklinkGrid', {
              fields: quicklinkGridConfig.fields,
              colKey : gridConfigKey,
              id: 'qlpQuicklinksGrid',
              columns: quicklinkGridConfig.columns
          });
          
          selectedId = Ext.getDom('editForm:selectedDynamicScopeId').value;
          qlpQuicklinkOptionsStore = SailPoint.Store.createStore({
            storeId : 'qlpQuicklinkOptionsStore',
            autoLoad: true,
            url: CONTEXT_PATH + '/systemSetup/quicklinkPopulationQuicklinksDataSource.json',
            extraParams: {selectedDynamicScopeId: selectedId},
            fields : [ 'quickLinkId', 'options' ],
            totalProperty: 'count',
            root: 'objects',
            remoteSort: false,
            simpleSortMode: true
          });
          
          qlpQuicklinkOptionsStore.on('load', function(store, records) {
            qlpQuicklinksGrid.setSelectedQloList(records);
          }, this);
          
          return qlpQuicklinksGrid;
        
        }
        
    }
});
