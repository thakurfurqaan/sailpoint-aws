/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint', 'SailPoint.modeler', 'SailPoint.Role.EntitlementsAnalysis');

Ext.define('SailPoint.modeler.EntitlementProfileSearchPanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var currentPanel = this;
        if (Ext.getDom('entitlementProfileSearchDiv'))
            Ext.getDom('entitlementProfileSearchDiv').style['display'] = '';
        Ext.apply(this, {
            fbar: {
            	layout: {
            		pack: 'center'
            	}
            },
            bodyStyle: {
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            }
        });
        
        this.callParent(arguments);
    }
});

Ext.define('SailPoint.modeler.EntitlementProfileResultsPanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var currentPanel = this;
        if (Ext.getDom('entitlementProfileResultsDiv'))
            Ext.getDom('entitlementProfileResultsDiv').style['display'] = '';
        Ext.apply(this, {
            border: false,
            fbar: {
            	layout: {
            		pack: 'center'
            	}
            },
            autoScroll: true,
            bodyStyle: 'spBackground'
        });
        
        this.callParent(arguments);
    },
    
    initSlider: function() {
        var filterEmitter = Ext.getCmp('entitlementFilterEmitter');
        if (!filterEmitter) {
            filterEmitter = new SailPoint.modeler.EntitlementFilterEmitter({id: 'entitlementFilterEmitter', 'formName': this.formName});
        }
        
        var filterEntitlements = function() {
            filterEmitter.fireEvent('thresholdChanged');
        };
        
        createSliderWithIndicator('handlePermEntitlementThreshold', 'sliderPermEntitlementThreshold', Ext.getDom(this.formName + ':threshold').value, Ext.getDom(this.formName + ':threshold'), false, 100, filterEntitlements, filterEntitlements);
        var inputEl = Ext.get(this.formName + ':threshold');
        if (inputEl) {
            inputEl.on('change', filterEntitlements);
        }
    },
    
    updateButtons: function() {
        var noEntitlementBuckets = Ext.getDom('noEntitlementBuckets').value == 'true';
        Ext.getCmp('entitlementGroupAndAnalyzeBtn').setDisabled(noEntitlementBuckets);
        var createBtn = Ext.getCmp('entitlementCreateBtn');
        if (!createBtn)
            createBtn = Ext.getCmp('entitlementCreateRoleBtn');
        createBtn.setDisabled(noEntitlementBuckets);
    },
    
    clearSelections: function() {
        var selections = Ext.DomQuery.select('input[class*=entValueHolder]', this.body.dom);
        var selection;
        var i;
        for (i = 0; i < selections.length; ++i) {
            selection = selections[i];
            selection.value = false;
        }
        
        selections = Ext.DomQuery.select('input[class*=selectionCheckbox]', this.body.dom);
        for (i = 0; i < selections.length; ++i) {
            selection = selections[i];
            selection.checked = false;
        }
    }
});

// This class is just here to prevent the slider from causing a bunch of unecessary 
// server hits as users move it back and forth
Ext.define('SailPoint.modeler.EntitlementFilterEmitter', {
	extend : 'Ext.Component',
    initComponent: function() {
        var filterEmitter = this;
        this.addEvents('thresholdChanged');
        this.addListener(
            'thresholdChanged', 
            function() {
                Ext.getDom(filterEmitter.formName + ':filterEntitlements').click();
            }, this, {
                buffer: 250
            }
        );
    }
});

Ext.define('SailPoint.modeler.EntitlementProfilePanel', {
	extend : 'Ext.panel.Panel',
    initComponent: function() {
        var currentPanel = this;
        Ext.getDom('entitlementProfileDiv').style['display'] = '';
        Ext.apply(this, {
            border: true,
            buttonAlign: 'center',
            buttons: [{
                text: '#{msgs.button_save}',
                handler: function() {
                    Ext.getDom(currentPanel.formName + ':saveMinedProfile').click();
                }
            }, {
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    Ext.getDom(currentPanel.formName + ':cancelEntitlementMiningBtn').click();
                }
            }]
        });
        
        this.callParent(arguments);
    }    
});      

/**
 * The entitlement mining panel used in the role editor
 */
Ext.define('SailPoint.modeler.EntitlementMiningPanel', {
	extend : 'Ext.Window',
    initComponent: function() {
        Ext.apply(this, {
            title: '#{msgs.create_profile_entitlement_mining}',
            border: false,
            renderTo: 'entitlementMinerCt',
            modal: true,
            autoScroll: true,
            closeAction: 'hide',
            closable: false,
            width: 768,
            height: 600,
            maxHeight: 600,
            layout: 'card',
            defaults: {
                border: false
            },
            activeItem: 0,
            plain: true,
            items: [
                new SailPoint.modeler.EntitlementProfileSearchPanel({
                    id: 'entitlementProfileSearchPanel',
                    contentEl: 'entitlementProfileSearchDiv',
                    formName: 'editForm',
                    buttons: [{
                        text: '#{msgs.button_search}',
                        cls : 'primaryBtn',
                        handler: function() {
                            if (SailPoint.Role.EntitlementsAnalysis.validateSearchInputs('editForm')) {
                                if (SailPoint.modeler.entitlementMining.resetCheckboxes)
                                    SailPoint.modeler.entitlementMining.resetCheckboxes();
                                Ext.getDom('editForm:entitlementMiningSearchBtn').click();
                            } else {
                                SailPoint.Role.EntitlementsAnalysis.popupRequiresAppDialog();
                            }
                        }
                    }, {
                        text: '#{msgs.button_cancel}',
                        cls : 'secondaryBtn',
                        handler: function() {
                            Ext.getDom('editForm:cancelEntitlementMiningBtn').click();
                        }
                    }],
                    loader : {}
                }),
                new SailPoint.modeler.EntitlementProfileResultsPanel({
                    id: 'entitlementProfileResultsPanel',
                    contentEl: 'entitlementProfileResultsDiv',
                    formName: 'editForm',
                    buttons: [{
                        id: 'entitlementGroupAndAnalyzeBtn',
                        text: '#{msgs.group_and_analyze}',
                        handler: function() {
                            var validated = validateSelections(Ext.getDom('errorDiv'), false);
                            if(validated)
                                Ext.getDom('editForm:groupBucketBtn').click();
                            else {
                              /** Scroll to the bottom to show the error - Delay it because IE7 is retarded **/
                              var scrollTask = new Ext.util.DelayedTask( 
                                  function() {
                                    var panel = Ext.getCmp('entitlementProfileResultsPanel').body.dom;
                                    panel.scrollTop = panel.scrollHeight - panel.offsetHeight;
                                    Ext.getCmp('entitlementProfileResultsPanel').expand();
                                  }, this
                              );
                              scrollTask.delay(200);          
                            }
                        },
                        disabled: Ext.getDom('noEntitlementBuckets').value == 'true'
                    },{
                        id: 'entitlementSearchAgainBtn',
                        text: '#{msgs.button_refine_search}',
                        handler: function() {
                            Ext.getDom('editForm:searchComplete').value = 'false';
                            Ext.getDom('errorDiv').style.display = 'none';
                            Ext.getDom('editForm:searchAgain').click();
                        }
                    },{
                        id: 'entitlementCreateBtn',
                        text: '#{msgs.create_profiles}',
                        handler: function() {
                            Ext.getDom('editForm:updateSelectedEntitlements').click();
                        },
                        disabled: Ext.getDom('noEntitlementBuckets').value == 'true'
                    },{
                        id: 'entitlementCancelBtn',
                        text: '#{msgs.button_cancel}',
                        cls : 'secondaryBtn',
                        handler: function() {
                            var entitlementMiningWindow = Ext.getCmp('entitlementMiningPanel');
                            entitlementMiningWindow.getLayout().setActiveItem('entitlementProfileSearchPanel');
                            Ext.getDom('editForm:cancelEntitlementMiningBtn').click();
                        }
                    }],
                    loader : {}
                }),
                new SailPoint.modeler.EntitlementProfilePanel({
                    id: 'entitlementProfilePanel',
                    contentEl: 'entitlementProfileDiv',
                    formName: 'editForm',
                    autoScroll: true
                })
            ]
        });
        
        this.callParent(arguments);
    },
    
    hide: function() {
        var result = this.callParent(arguments);
        SailPoint.modeler.setButtonsDisabled(false);
        return result;
    },
    
    show: function() {
        var result = this.callParent(arguments);
        SailPoint.modeler.setButtonsDisabled(true);
        return result;
    }
});

/**
 * The entitlement mining panel in the Entitlements Analysis tab on the role management page
 */
SailPoint.Role.EntitlementsAnalysis.getEntitlementsAnalysisPanel = function(config) {
    var entitlementsAnalysisPanel = Ext.getCmp(config.id);
    
    if (!entitlementsAnalysisPanel) {
        entitlementsAnalysisPanel = new Ext.Panel({
            id: config.id,
            title: config.title,
            border: false,
            autoScroll: false,
            header: false,
            layout: 'card',
            defaults: {
                border: false
            },
            activeItem: 0,
            plain: true,
            items: [
                new SailPoint.modeler.EntitlementProfileSearchPanel({
                    id: 'entitlementProfileSearchPanel',
                    formName: 'directedMiningSearchForm',
                    bbar: [{
                        text: '#{msgs.button_search}',
                        cls : 'primaryBtn',
                        handler: function() {
                            if (SailPoint.Role.EntitlementsAnalysis.validateSearchInputs('directedMiningSearchForm')) {
                                 if (SailPoint.modeler.entitlementMining.resetCheckboxes)
                                    SailPoint.modeler.entitlementMining.resetCheckboxes();
                                Ext.getDom('directedMiningSearchForm:entitlementMiningSearchBtn').click();
                            } else {
                                SailPoint.Role.EntitlementsAnalysis.popupRequiresAppDialog();
                            }
                        }
                    }, {
                        text: '#{msgs.button_reset}',
                        cls : 'secondaryBtn',
                        handler: function() {
                            Ext.getCmp('miningAppNameMultiSuggestCmp').clear();
                            SailPoint.Role.EntitlementsAnalysis.resetSearchTypeSelection('directedMiningSearchForm');
                            SailPoint.Role.EntitlementsAnalysis.resetAttributeInputs('directedMiningSearchForm');
                            SailPoint.Role.EntitlementsAnalysis.resetIpopInput('directedMiningSearchForm');
                        }
                    }],
                    loader: {}
                }),
                new SailPoint.modeler.EntitlementProfileResultsPanel({
                    id: 'entitlementProfileResultsPanel',
                    formName: 'directedMiningResultsForm',
                    bbar: [{
                        id: 'entitlementGroupAndAnalyzeBtn',
                        text: '#{msgs.group_and_analyze}',
                        panel: this,
                        handler: function() {
                            var validated = validateSelections(Ext.getDom('errorDiv'), false);
                            
                            if(validated)
                                Ext.getDom('directedMiningResultsForm:groupBucketBtn').click();
                            else {
                              /** Scroll to the bottom to show the error - Delay it because IE7 is retarded **/
                              var scrollTask = new Ext.util.DelayedTask( 
                                  function() {
                                    var panel = Ext.getCmp('entitlementProfileResultsPanel').body.dom;
                                    panel.scrollTop = panel.scrollHeight - panel.offsetHeight;
                                    Ext.getCmp('entitlementProfileResultsPanel').expand();
                                  }, this
                              );
                              scrollTask.delay(200);                              
                            }
                        },
                        disabled: Ext.get('noEntitlementBuckets') ? Ext.getDom('noEntitlementBuckets').value == 'true' : true
                    },{
                        id: 'entitlementSearchAgainBtn',
                        text: '#{msgs.button_refine_search}',
                        handler: function() {
                            Ext.getDom('directedMiningResultsForm:searchComplete').value = 'false';
                            Ext.getDom('errorDiv').style.display = 'none';
                            Ext.getDom('directedMiningResultsForm:searchAgain').click();
                        }
                    },{
                        id: 'entitlementCreateRoleBtn',
                        text: '#{msgs.create_role}',
                        handler: function() {
                            Ext.getDom('directedMiningResultsForm:updateSelectedEntitlementsAndCreateRole').click();
                        },
                        disabled: SailPoint.Role.EntitlementsAnalysis.disableRoleCreation()
                    }],
                    loader: {}
                })
            ]
        });
        
        entitlementsAnalysisPanel.on('activate', function() {
            if (!entitlementsAnalysisPanel.isLoaded) {
                Ext.getCmp('entitlementProfileSearchPanel').getLoader().load({
                    url: SailPoint.getRelativeUrl('/define/roles/automatedMining/entitlementsAnalysis.jsf'),
                    callback: function() {
                    	if (Ext.get('entitlementProfileSearchDiv')) {
                    		Ext.getDom('entitlementProfileSearchDiv').style['display'] = '';
                    	}
                        SailPoint.modeler.initMiningAppMultiSuggest('directedMiningSearchForm');
                        SailPoint.modeler.initDistinctSuggests('directedMiningSearchForm');
                        Ext.MessageBox.hide();
                    },
                    text: '#{msgs.loading_data}',
                    scripts: true,
                    ajaxOptions : {
                        disableCaching: false
                    }
                });
                
                Ext.getCmp('entitlementProfileResultsPanel').getLoader().load({
                    url: SailPoint.getRelativeUrl('/define/roles/automatedMining/entitlementsAnalysisResults.jsf'),
                    callback: function() {
                    	if(Ext.get('entitlementProfileResultsDiv')) {
                    		Ext.getDom('entitlementProfileResultsDiv').style['display'] = '';
                    	}
                    	Ext.getCmp('entitlementGroupAndAnalyzeBtn').setDisabled(Ext.getDom('noEntitlementBuckets').value == 'true');
                        Ext.getCmp('entitlementCreateRoleBtn').setDisabled(SailPoint.Role.EntitlementsAnalysis.disableRoleCreation());
                        Ext.getCmp('entitlementProfileResultsPanel').isLoaded = true;
                    },
                    text: '#{msgs.loading_data}',
                    scripts: false,
                    ajaxOptions : {
                        disableCaching: false
                    }
                });
                
                entitlementsAnalysisPanel.isLoaded = true;
            }
        },{
            single: true,
            scope: this
        });
    }
    
    return entitlementsAnalysisPanel;
}

SailPoint.Role.EntitlementsAnalysis.styleResults = function() {};

SailPoint.Role.EntitlementsAnalysis.addDescriptionTooltips = function() {
    Ext.QuickTips.init();
    Ext.apply(Ext.QuickTips.getQuickTip(), {
        showDelay: 1000,
        trackMouse: false
    });

    /** Build tooltips **/
    var i, current, description, img,
        descrs = Ext.DomQuery.select('td.entitlementDescription');

    if (descrs) {
        for (i = 0; i < descrs.length; i++) {
            current = descrs[i];
            description = Ext.DomQuery.selectNode('span[id^="description_"]', current);
            img = Ext.DomQuery.selectNode('img.helpIcon', current);
            if (description && description.innerHTML) {
                Ext.QuickTips.register({
                    target: Ext.get(img),
                    text: description.innerHTML
                });
            }
        }
    }
};

SailPoint.Role.EntitlementsAnalysis.updateButtons = function() {
    var groupAndAnalyze = Ext.getCmp('entitlementGroupAndAnalyzeBtn');
    var createRole = Ext.getCmp('entitlementCreateRoleBtn');

    // Don't do any work if there's nothing to update
    if (groupAndAnalyze || createRole) {
        var noEntitlements;
        if (Ext.get('noEntitlementBuckets')) {
            noEntitlements = Ext.getDom('noEntitlementBuckets').value == 'true';
        } else {
            noEntitlements = false;
        }
        
        if (groupAndAnalyze)
            groupAndAnalyze.setDisabled(noEntitlements);
        
        if (createRole)
            createRole.setDisabled(noEntitlements || SailPoint.Role.EntitlementsAnalysis.disableRoleCreation());
    }
};

SailPoint.Role.EntitlementsAnalysis.showSearchAttributesPanel = function(panelTypeToShow, formName) {
    if (panelTypeToShow == 'searchByAttributes') {
        Ext.getDom('entitlementAnalysisAttributes').style['display'] = '';
        Ext.getDom('entitlementAnalysisIpop').style['display'] = 'none';
        SailPoint.Role.EntitlementsAnalysis.resetIpopInput(formName);
    } else if (panelTypeToShow == 'searchByIpop') {
        Ext.getDom('entitlementAnalysisAttributes').style['display'] = 'none';
        Ext.getDom('entitlementAnalysisIpop').style['display'] = '';
        SailPoint.Role.EntitlementsAnalysis.resetAttributeInputs(formName);
    } else {
        Ext.MessageBox.alert('Error', 'The only permitted search panel types are "searchByAttributes" and "searchByIpop" but "' + panelTypeToShow + '" was submitted.  In order to support that type fix SailPoint.Role.EntitlementsAnalysis.showSearchAttributesPanel()');
    }
};

SailPoint.Role.EntitlementsAnalysis.popupRequiresAppDialog = function() {
    Ext.MessageBox.show({
        title: '#{msgs.err_dialog_title}',
        msg: '#{msgs.role_entitlements_analysis_application_required}',
        buttons: Ext.Msg.OK,
        closable: false,
        icon: Ext.MessageBox.ERROR
     });
};

SailPoint.Role.EntitlementsAnalysis.validateSearchInputs = function(formName) {
    var isValid = true;
    
    if (Ext.getDom(formName + ':miningAppNameSuggest').value == '') {
        isValid = false;
    }
    
    return isValid;
};

SailPoint.Role.EntitlementsAnalysis.resetSearchTypeSelection = function(formName) {
    var i;
    var inputElement;
    var searchByChoices = Ext.DomQuery.select('input', formName + ':attributeOrIpopSelector');
    
    for (i = 0; i < searchByChoices.length; ++i) {
        inputElement = searchByChoices[i];
        if (inputElement.value == 'searchByAttributes') {
            inputElement.checked = true;
        } else {
            inputElement.checked = false;
        }
    }
    
    SailPoint.Role.EntitlementsAnalysis.showSearchAttributesPanel('searchByAttributes', formName);
};

SailPoint.Role.EntitlementsAnalysis.resetSelects = function(selectContainer) {
    var i;
    var select;
    var selects = Ext.DomQuery.select('select', selectContainer);
    
    for (i = 0; i < selects.length; ++i) {
        select = selects[i];
        select.selectedIndex = 0;
    }
};

SailPoint.Role.EntitlementsAnalysis.resetAttributeInputs = function(formName) {
    var identityAttributes = Ext.DomQuery.select('input', 'directedMiningIdentityAttributes');
    for (var i = 0; i < identityAttributes.length; ++i) {
        identityAttributes[i].value = '';
    }
    
    SailPoint.Role.EntitlementsAnalysis.resetSelects('directedMiningIdentityAttributes');
};

SailPoint.Role.EntitlementsAnalysis.APPS_TEMPLATE = new Ext.XTemplate(    
    '<tpl for="applications">',
      '<div>{.:htmlEncode}</div>',
    '</tpl>'
);

/**
 * This method updates the description for an Ipop selection.  It's a little complex because it lazily
 * loads and caches the Ipops because the query can be expensive.  
 * The ignore params are there because of the retry logic in this method.  After the retry this method
 * will be passed a bunch of irrelevant stuff along with the important options.  The parameters that 
 * are not relevant are named ignore1, ignore2, and ignore3
 */
SailPoint.Role.EntitlementsAnalysis.updateDescription = function(ignore1, ignore2, ignore3, options) {
    var ipop = options.ipop;
    //IIQTC-141 :- Since we are receiving escaped content when calling ipopsDataSource.json
    //we need to Decode the content to prevent side effects.
    var ipopsJson = Ext.String.htmlDecode(Ext.getDom('ipopsInfo').innerHTML);
    if (!ipopsJson || ipopsJson.length == 0) {
        Ext.get('entitlementAnalysisIpop').mask('#{msgs.loading_data}');
        // Load it and try again if it's blank
        Ext.get(Ext.get('ipopsInfo')).load({
            url: SailPoint.getRelativeUrl('/define/roles/modeler/ipopsDataSource.json'),
            callback: SailPoint.Role.EntitlementsAnalysis.updateDescription,
            ipop: ipop
        });
        return;
    }
    
    var ipopsInfo = Ext.JSON.decode(ipopsJson);
    var currentIpopInfo = ipopsInfo[ipop];
    var descriptionDiv = Ext.get('ipopDescription');
    var sizeDiv = Ext.get('ipopSize');
    var appsDiv = Ext.get('ipopApps');
    var description;
    var size;
    var apps;

    Ext.define('RecordType', {
        extend: 'Ext.data.Model',
        fields: [{name:'id', type:'string'},{name:'name', type:'string'},{name:'displayField', type:'string'}]
    });
    
    if (currentIpopInfo) {
        //IIQTC-141 :- We need to Encode the description, it will be injected to
        //a <div/>
        description = Ext.util.Format.htmlEncode(currentIpopInfo.description);
        size = currentIpopInfo.numIpopMembers;
        apps = SailPoint.Role.EntitlementsAnalysis.APPS_TEMPLATE.apply(currentIpopInfo);
        
        var multiSuggest = Ext.getCmp('miningAppNameMultiSuggestCmp');
        if (multiSuggest && currentIpopInfo.applications && currentIpopInfo.applicationIds) {
            multiSuggest.selectedStore.removeAll();
            for (var i=0, len=currentIpopInfo.applications.length; i<len; ++i) {
                var appId = currentIpopInfo.applicationIds[i];
                var appName = currentIpopInfo.applications[i];
                var record = Ext.create('RecordType', {'id': appId, 'name':appName, 'displayField': appName});
                multiSuggest.selectedStore.addSorted(record);
            }
            multiSuggest.updateInputField();
        }
        
    } else {
        description = '';
        size = '';
        apps = '';
    }
    
    if (description === null) {
        description = '';
    }
    descriptionDiv.update(description);
    sizeDiv.update(size);
    appsDiv.update(apps);
    Ext.get('entitlementAnalysisIpop').unmask();
};

SailPoint.Role.EntitlementsAnalysis.resetIpopInput = function(formName) {
    Ext.getDom(formName + ':ipopName').value = '';
};

SailPoint.modeler.initMiningAppMultiSuggest = function(formName) {
    var miningAppNameMultiSuggest = Ext.getCmp('miningAppNameMultiSuggestCmp');

    if (!miningAppNameMultiSuggest) {
        miningAppNameMultiSuggest = new SailPoint.MultiSuggest({
            id: 'miningAppNameMultiSuggestCmp',
            renderTo: 'miningAppNameMultiSuggest',
            suggestType: 'application',
            jsonData: Ext.decode(Ext.getDom('miningAppNameMultiSuggestData').innerHTML),
            inputFieldName: formName + ':miningAppNameSuggest'
        });
    }
}

SailPoint.modeler.initDistinctSuggests = function(formName) {
  if(Ext.get('emailVal')) {
    var emailSuggest = Ext.getCmp('emailSuggestCmp');
    var emailVal = Ext.getDom('emailVal').innerHTML;
    
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
      suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
      listConfig : {width : 300}
    });
  }
  
  if(Ext.get('managerVal')) {
    var managerSuggest = Ext.getCmp('managerSuggestCmp');
    var managerVal = Ext.getDom('managerVal').innerHTML;
    
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
      suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
      listConfig : {width : 300}
    });
  }
  
  if(Ext.get('displayNameVal')) {
    var displayNameSuggest = Ext.getCmp('displayNameSuggestCmp');
    var displayNameVal = Ext.getDom('displayNameVal').innerHTML;
    
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
      suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
      listConfig : {width : 300}
    });
  }
  
  if(Ext.get('userNameVal')) {
    var userNameSuggest = Ext.getCmp('userNameSuggestCmp');
    var userNameVal = Ext.getDom('userNameVal').innerHTML;
    
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
      suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
      listConfig : {width : 300}
    });
  }
  
  
  /** Set up suggest fields for all of the extended attributes that have string values **/
  var extendedFields = Ext.DomQuery.select('div[class=identityAttribute]');
  Ext.each(extendedFields, function (field) {
    var id = field.id;
    var simpleId = field.id.substring(0,field.id.length-3);
    var key = simpleId.substring(17);
    var className = 'Identity';
    
    if(key.indexOf(".")>0) {
      var className = key.substring(0, key.indexOf("."));
    }

    var suggest = Ext.getCmp(id+'SuggestCmp');
    var suggestVal = field.innerHTML;
    var type = Ext.getDom(simpleId+'Type').innerHTML;
    
    if (suggest) {
      suggest.destroy();
    }  
    
    if(type=='sailpoint.object.Identity') {
      suggest = new SailPoint.DistinctRestSuggest({
        id: id+'SuggestCmp',
        renderTo: simpleId+"Suggest",
        binding: field.previousSibling.previousSibling.id,
        value: suggestVal,
        valueField: 'displayName',
        width: 200,
        freeText: true,
        className: 'Identity',
        column: 'displayName',
        suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
        listConfig : {width : 300}
      });
    } else {      
      suggest = new SailPoint.DistinctRestSuggest({
        id: id+'SuggestCmp',
        renderTo: simpleId+"Suggest",
        binding: field.previousSibling.previousSibling.id,
        value: suggestVal,
        valueField: 'displayName',
        width: 200,
        freeText: true,
        className: className,
        column: key,
        suggestUrl: '/rest/analyze/entitlementAnalysisPanel/suggest',
        listConfig : {width : 300}
      });
    }   
    
  });

}

Ext.define('SailPoint.modeler.CreateRoleFromEntitlementWindow', {
	extend : 'Ext.Window',
    initComponent: function() {
        Ext.apply(this, {
            title: '#{msgs.title_new_role_directed_mining}',
            layout: 'fit',
            autoScroll: true,
            header: false,
            modal: true,
            closable: true,
            width: 500,
            height: 400,
            buttonAlign: 'center'
        });
        
        this.callParent(arguments);
    },

    reset: function() {
        var roleEntitlementsTemplate = SailPoint.modeler.RoleEntitlementsTemplate;
        var i18nWrapper = SailPoint.modeler.I18nEntitlementsWrapper;
        var entitlementsObj = JSON.parse(Ext.getDom('entitlementsJSON').innerHTML);
        i18nWrapper.entitlements = entitlementsObj.roleDirectEntitlements;
        roleEntitlementsTemplate.overwrite(Ext.get('entitlementsToCreateRoleFrom'), i18nWrapper);
        Ext.getDom('directedMiningCreateForm:entitlementsAnalysisNewRoleName').value = '';
        Ext.getDom('directedMiningCreateForm:directedMiningRoleCreateDescription').value = '';
    }
});

SailPoint.modeler.getRoleCreationWindow = function() {
    var roleCreationWindow = Ext.getCmp('roleCreationWindow');
    
    if (!roleCreationWindow) {
        roleCreationWindow = new SailPoint.modeler.CreateRoleFromEntitlementWindow({
            id: 'roleCreationWindow',
            items: [new Ext.Panel({
                contentEl: 'directedMiningCreatePanelDiv',
                bodyStyle: {
                    background: '#dddddd',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                }
            })],
            buttons: [{
                text: '#{msgs.button_save}',
                handler: function() {
                    var nval = Ext.getDom('directedMiningCreateForm:entitlementsAnalysisNewRoleName').value;
                    if (nval) {
                      Ext.getDom('directedMiningCreateForm:saveCreatedRole').click();
                    }
                    else {
                      Ext.MessageBox.show({
                          title: '#{msgs.err_dialog_title}',
                          msg: '#{msgs.role_entitlements_analysis_newrolename_required}',
                          buttons: Ext.Msg.OK,
                          closable: false,
                          icon: Ext.MessageBox.ERROR
                       });
                    }
                }
            }, {
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    Ext.getCmp('roleCreationWindow').hide();
                }
            }]
        });
        
        Ext.getDom('directedMiningCreatePanelDiv').style['display'] = '';
    }
    
    Ext.getDom('directedMiningCreateForm:entitlementsAnalysisNewRoleName').value = '';
    roleCreationWindow.show();
    
    return roleCreationWindow;
}

/**
 * Returns true if the role creation button should be disabled. This
 * would be true if there are no entitlement buckets, or if the user
 * does not have the rights to edit the necessary role types.
 */
SailPoint.Role.EntitlementsAnalysis.disableRoleCreation = function() {

    if (Ext.get('allowRoleCreation') && Ext.getDom('allowRoleCreation').value === 'false')
        return true;

    return Ext.get('noEntitlementBuckets') ? Ext.getDom('noEntitlementBuckets').value === 'true' : false;
}



