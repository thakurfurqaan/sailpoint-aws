/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

var MAX_IDENTITIES = 25;
var MAX_APPLICATIONS = 25;
var MAX_ENTITLEMENTS = 10;

// TODO: Bernie -- Need to refactor the membership, requires, and permits editors into a single shared component 
Ext.ns('SailPoint', 'SailPoint.modeler', 'SailPoint.modeler.RoleEditor');

// Entitlements
var entitlementDataStore = SailPoint.Store.createStore({
    storeId: 'entitlementDataStore',
    url: CONTEXT_PATH + '/define/roles/modeler/entitlementQuery.json',
    root: 'entitlements',
    totalProperty: 'numApplications',
    remoteSort: true,
    fields: [
        {name: 'name', type: 'string'},
        {name: 'hasAnnotation', type: 'boolean'},
        {name: 'editMode', type: 'boolean'},
        {name: 'permissions', type: 'auto'},
        {name: 'withRoleName', type: 'boolean'},
        {name: 'rules', type: 'auto'},
        {name: 'profileid', type: 'string'},
        {name: 'application', type: 'string'},
        {name: 'profileOrdinal', type: 'int'},
        {name: 'description', type: 'string'}
    ]
});

// Simple Entitlements
var simpleEntitlementDataStore = SailPoint.Store.createStore({
    storeId: 'simpleEntitlementDataStore',
    url: CONTEXT_PATH + '/define/roles/modeler/simpleEntitlementQuery.json',
    root: 'entitlements',
    totalProperty: 'numEntitlements',
    remoteSort: true,
    fields: [
        {name: 'applicationName', type: 'string'},
        {name: 'value', type: 'string'},
        {name: 'property', type: 'string'},
        {name: 'displayValue', type: 'string'},
        {name: 'classifications', type: 'string'}
    ],
    listeners: {
        load: function () {
            var entitlementsPanel = Ext.getCmp('entitlements');
            if (entitlementsPanel) {
                entitlementsPanel.doLayout();
            }
        }

    }

});

var profileEditor;

Ext.onReady(function () {
    Ext.MessageBox.wait('#{msgs.loading_data}');

    var fieldsPanelTable = Ext.get('roleFieldsPanelTable');

    // Fix IE rendering issue
    if (Ext.isIE) {
        Ext.get('roleEditorCt').addCls('width100');
        Ext.get('roleFieldsPanelTable').addCls('width100');
    }

    if (Ext.get('assignedScopeSuggest')) {
        // Initialize the scope suggest
        var scopeSuggest = new SailPoint.ScopeSuggest({
            renderTo: 'assignedScopeSuggest',
            binding: 'assignedScope',
            width: 200,
            listConfig: {width: 300}
        });

        scopeSuggest.setRawValue(Ext.getDom('initialScope').innerHTML.trim());
    }

    //classification multi-suggest
    var classificationsMultiSuggest = Ext.getCmp('classificationsMultiSuggestCmp'), suggestData;

	if (classificationsMultiSuggest) {
		classificationsMultiSuggest.destroy();
	}
	
	suggestData = Ext.getDom('classificationsMultiSuggestData');
	if (suggestData && suggestData.innerHTML) {
		classificationsMultiSuggest = Ext.create('SailPoint.MultiSuggest', {
	        id: 'classificationsMultiSuggestCmp',
	        renderTo: 'classificationsMultiSuggest',
	        width: 300,
	        suggestType: 'classification',
	        jsonData: JSON.parse(suggestData.innerHTML),
	        inputFieldName: 'classificationsSuggest',
	        emptyText: '#{msgs.role_editor_add_classifications}'
	    });
	}
    
    var versionPanel = new Ext.Panel({
        id: 'editorVersionGridSection',
        autoScroll: false,
        layout: 'fit',
        height: 'auto',
        renderTo: 'editorVersionGrid',
        items: [SailPoint.Role.Version.getGrid({
            id: 'editorVersionGrid',
            title: '#{msgs.title_archived_roles}',
            prefix: 'editor',
            pageSize: SailPoint.Role.RoleView.MAX_ROLES
        })]
    });

    if (Ext.getDom('roleDescriptionHTML') && Ext.getDom("editForm:jfDescriptionsJSON")) {
        var descriptionEditor = new SailPoint.MultiLanguageHtmlEditor({
            renderTo: 'roleDescriptionHTML',
            width: 500,
            height: 200,
            languageJSON: Ext.getDom("editForm:jfDescriptionsJSON").value,
            id: 'roleDescriptionHTMLCmp',
            langSelectEnabled: Ext.getDom('allowRoleLocalization').innerHTML == "true",
            defaultLocale: Ext.getDom("descrDefaultLocale").innerHTML
        });
    }

    var versionGrid = Ext.getCmp('editorVersionGrid');
    var hasArchives = Ext.getDom('editForm:hasArchives').checked;
    if (hasArchives) {
        var versionGridDataStore = versionGrid.getStore();
        versionGridDataStore.getProxy().setExtraParam('roleId', Ext.getDom('editForm:roleToEdit').value);
        versionGridDataStore.loadPage(1);
    } else {
        versionPanel.hide();
        versionGrid.hide();
        Ext.get('editorVersionGrid').setVisibilityMode(Ext.Element.DISPLAY).hide();
    }

    SailPoint.AssignmentRule.initializeSelectors();

    var typeDefStore =
        new SailPoint.modeler.RoleTypeDefinitionStore({id: 'roleTypeDefinitionStore'});

    typeDefStore.load({callback: SailPoint.modeler.RoleEditor.loadEntitlementsAndFinishInit});

    if (Ext.getDom('editForm:editMode').value == 'Profile') {
        initProfileEditor();
    }

    initEntitlementMiner();

    if (Ext.getDom('editForm:editMode').value != 'EntitlementMining') {
        var entitlementMiningPanel = Ext.getCmp('entitlementMiningPanel');
        entitlementMiningPanel.hide();
    }

    var tasPanel = Ext.getCmp('tasPanel');
    if (!tasPanel) {
        tasPanel = new Ext.Panel({
            id: 'tasPanel',
            title: '#{msgs.title_provisioning_target_rules}',
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'provisioningTargetAccountSelectorRuleDisplay',
            contentEl: 'provisioningTargetAccountSelectorRuleDisplayContents',
            autoScroll: false,
            layout: 'fit'
        });
    }
});

function saveRoleEditor() {
    var roleDescriptionCmp = Ext.getCmp('roleDescriptionHTMLCmp');
    if (roleDescriptionCmp) {
        Ext.getDom('editForm:jfDescriptionsJSON').value = roleDescriptionCmp.getCleanValue();
    }
}

function refreshEntitlements(records) {
    if (!records) {
        var records = Ext.StoreMgr.lookup('entitlementDataStore');
    }
    // I'm not a fan of global arrays, but 'this' does not seem to be 
    // consistently supported by Ext's Store.each() function -- Bernie
    SailPoint.modeler.RoleEditor.displayedEntitlements = [];
    if(records.isStore) {
        records = records.data.items;
    }
    Ext.each(records, addRecordToEntitlementSet);
    var advancedPanel = Ext.getCmp('advancedEntitlementsViewPanel');
    if (!advancedPanel) {
        advancedPanel = Ext.create('Ext.Panel', {
            id: 'advancedEntitlementsViewPanel',
            border: false,
            collapsible: false,
            renderTo: 'entitlementsDisplayContents',
            contentEl: 'advancedEntitlementsDisplayContents',
            padding: 20,
            layout: 'fit',
            tbar: [
                {
                    id: 'profileEditOptions',
                    text: '#{msgs.button_create}',
                    menu: new Ext.menu.Menu({
                        items: [
                            {
                                id: 'newProfileOption',
                                text: '#{msgs.new_profile}',
                                handler: function () {
                                    Ext.getDom('editForm:editedProfileId').value = '';
                                    Ext.getDom('editForm:editMode').value = 'Profile';
                                    Ext.getDom('editForm:editProfile').click();
                                }
                            },
                            {
                                id: 'entitlementMiningOption',
                                text: '#{msgs.new_profile_entitlement_mining} #{msgs.title_new_role_directed_mining}',
                                handler: function () {
                                    Ext.getDom('editForm:editMode').value = 'EntitlementMining';
                                    Ext.getDom('editForm:editedProfileId').value = '';
                                    Ext.getDom('editForm:editedEntitlementProfileDescription').value = '';
                                    Ext.getDom('editForm:entitlementMining').click();
                                }
                            }
                        ]
                    })
                },
                {
                    id: 'advancedViewSwitchButton',
                    text: '#{msgs.role_simple_entitlement_simple_view}',
                    handler: function () {
                        Ext.get('entitlementsDisplayContents').setVisibilityMode(Ext.Element.DISPLAY).hide();
                        Ext.get('entitlementsSimpleGrid').show();
                        SailPoint.modeler.RoleEditor.initSimpleGrid();
                    }
                }
            ]
        });
    }
    var entitlementsDisplayContents = Ext.get('advancedEntitlementsDisplayContents');
    var entitlementsTemplate = SailPoint.modeler.RoleEntitlementsTemplate;
    var i18NEntitlementsWrapper = SailPoint.modeler.I18nEntitlementsWrapper;
    i18NEntitlementsWrapper.entitlements = SailPoint.modeler.RoleEditor.displayedEntitlements;
    entitlementsTemplate.overwrite(entitlementsDisplayContents, i18NEntitlementsWrapper);
    Ext.destroy(Ext.get('entitlementsPanel'));
    SailPoint.modeler.RoleEditor.toggleSwitchToSimpleButton();
    advancedPanel.doLayout();
}

function addRecordToEntitlementSet(record) {
    record.data.id = record.getId();
    SailPoint.modeler.RoleEditor.displayedEntitlements.push(record.data);
}

function initProfileEditor() {
    var profileEditorPanel = Ext.getCmp('profileEditorPanel'),
        windowWidth = 768,
        windowHeight = 600,
        bva = SailPoint.getBrowserViewArea();

    if (!profileEditorPanel) {
        // Initialize the app suggest for the entitlements/profile editor
        var appSuggest = new SailPoint.BaseSuggest({
            id: 'applicationSuggestCmp',
            renderTo: 'applicationSuggestCmp',
            binding: 'applicationSuggest',
            baseParams: {'suggestType': 'application', 'aggregationType': 'account'},
            rawValue: Ext.getDom('applicationSuggest').value
        });

        appSuggest.setRawValue(Ext.getDom('applicationSuggest').value);

        appSuggest.on(
            'select',
            function (box, records, index) {
                if (records.length > 0) {
                    Ext.getDom('editForm:profileApplication').value = records[0].getId();
                    Ext.getDom('editForm:changeApplication').click();
                }
            },
            this
        );

        profileFiltersPage = FiltersPage.instance('div.profilespTabledAjaxContent', 'profilefilterBeanListTbl', 'editForm', 'profile');
        profileFiltersPage.initPage();

        profileFiltersPage.onChangeFilter = function() {
            var table = Ext.getDom('profilefilterBeanListTbl');
            if (table) {
                // disable the application suggest if there are filters
                appSuggest.setDisabled(table.rows.length > 1);
            }
        };

        profileEditor = Editor.instance([Ext.getDom('editForm:profileSave'), Ext.getDom('editForm:profileCancel')], [Ext.getDom('editForm:profileSave'), Ext.getDom('editForm:profileCancel')]);

        profileEditorPanel = new Ext.Window({
            id: 'profileEditorPanel',
            title: '#{msgs.header_edit_entitlements}',
            border: true,
            renderTo: 'profileEditorCt',
            items: [{
                contentEl: 'profileEditorDiv',
                bodyStyle: {'background-color': '#ffffff'},
                layout: 'fit',
                autoScroll: true
            }],
            modal: true,
            width: windowWidth,
            height: windowHeight,
            layout: 'fit',
            closable: false,
            buttons: [
                {
                    text: '#{msgs.button_save}',
                    handler: function () {
                        Ext.getDom('editForm:profileSave').click();
                    }
                },
                {
                    text: '#{msgs.button_cancel}',
                    cls: 'secondaryBtn',
                    handler: function () {
                        Ext.getDom('editForm:profileCancel').click();
                    }
                }
            ],
            buttonAlign: 'center',
            plain: true
        });

        Ext.getDom('profileEditorDiv').style.display = '';
    }

    if(profileEditorPanel) {
        profileEditorPanel.showAt(bva.width / 2 - windowWidth / 2, (bva.height / 2 - windowHeight / 2) + Ext.get(document).getScroll().top);
    }
}

function destroyProfileEditor() {
    var profileEditorPanel = Ext.getCmp('profileEditorPanel');
    if (profileEditorPanel) {
        // We can't just hide it in this case because the panel itself is being
        // rerendered out of the DOM by an a4j
        profileEditorPanel.close();
    }
}

function initMembershipEditor() {
    Ext.onReady(function () {
        var membershipEditorPanel = Ext.getCmp('membershipEditorPanel');

        if (!membershipEditorPanel) {
            var roleFilter = Ext.create('SailPoint.RoleFilter', {
                id: 'membershipRoleSuggest',
                url: 'allowedInheritedQuery.json',
                editedRoleId: Ext.getDom('editForm:roleToEdit').value
            });

            var pagingCheckboxGrid = Ext.create('SailPoint.grid.PagingCheckboxGrid', {
                id: 'membershipGrid',
                store: Ext.create('Ext.data.Store', {
                    storeId: 'memberOfRoleDataStore',
                    fields: [
                        { name: 'id', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'roleType', type: 'string' },
                        { name: 'description', type: 'string' }
                    ],
                    proxy: {
                        type: 'ajax',
                        url: 'memberOfDataStore.json',
                        reader: {
                            type: 'json',
                            root: 'roles',
                            totalProperty: 'numRoleResults'
                        },
                        extraParams: {
                            'editForm:roleToEdit': Ext.getDom('editForm:roleToEdit').value
                        }
                    },
                    remoteSort: true
                }),
                columns: [
                    { header: '#{msgs.name}', sortable: true, dataIndex: 'name', flex: 3 },
                    { header: '#{msgs.type}', sortable: true, dataIndex: 'roleType', flex: 1 },
                    { header: '#{msgs.description}', sortable: false, dataIndex: 'description', renderer: SailPoint.grid.Util.renderDescription, flex: 5 }
                ],
                selModel: new SailPoint.grid.CheckboxSelectionModel(),
                viewConfig: {autoFill: false, emptyText: '#{msgs.not_member_of_roles}', scrollOffset: 1},
                cls: 'smallFontGrid wrappingGridCells'
            });

            SailPoint.modeler.RoleEditor.excludeExistingRolesFromReferenceEditors(Ext.StoreMgr.lookup('memberOfRoleDataStore'), Ext.getCmp('membershipRoleSuggest'));

            membershipEditorPanel = new Ext.Window({
                id: 'membershipEditorPanel',
                title: '#{msgs.header_modify_membership}',
                border: true,
                renderTo: 'membershipEditor',
                contentEl: 'membershipEditorContents',
                modal: true,
                autoScroll: true,
                closable: false,
                width: 1000,
                height: 400,
                layout: 'fit',
                items: [pagingCheckboxGrid],
                tbar: [ roleFilter,
                    {
                        text: '#{msgs.button_add}',
                        handler: function () {
                            var roleRecord = roleFilter.getRecord();
                            if (roleRecord) {
                                Ext.getDom('editForm:membershipIdToAdd').value = roleRecord.getId();
                                roleFilter.setValue(null);
                                Ext.getDom('editForm:membershipAdd').click();
                            }
                        }
                    }
                ],
                buttons: [
                    {
                        text: '#{msgs.button_save}',
                        handler: function () {
                            Ext.getDom('editForm:membershipSave').click();
                        }
                    },
                    {
                        text: '#{msgs.button_cancel}',
                        cls: 'secondaryBtn',
                        handler: function () {
                            Ext.getDom('editForm:membershipCancel').click();
                        }
                    }
                ],
                buttonAlign: 'center',
                plain: true
            });

            // Insert the remove button on the paging toolbar (had to wait until after render to do it)
            var pagingTB = pagingCheckboxGrid.getPagingToolbar();
            pagingTB.insert(0, {
                xtype: 'button',
                text: '#{msgs.button_remove_selected}',
                handler: function () {
                    var isAllSelected = pagingCheckboxGrid.isAllSelected();
                    Ext.getDom('editForm:selectAllMemberships').value = isAllSelected;
                    if (isAllSelected) {
                        Ext.getDom('editForm:selectedMembershipIds').value = pagingCheckboxGrid.getExcludedIds().join(',');
                    } else {
                        Ext.getDom('editForm:selectedMembershipIds').value = pagingCheckboxGrid.getSelectedIds().join(',');
                    }

                    Ext.getDom('editForm:membershipRemove').click();
                }
            });
            pagingTB.insert(1, { xtype: 'tbspacer' });
            pagingTB.insert(2, { xtype: 'tbseparator' });
            pagingTB.insert(3, { xtype: 'tbspacer' });


            membershipEditorPanel.show();
            membershipEditorPanel.alignTo('bottomOfMembershipDisplay', 'b-b');
            pagingCheckboxGrid.getStore().load();
        } else {
            membershipEditorPanel.show();
            membershipEditorPanel.alignTo('bottomOfMembershipDisplay', 'b-b');
        }
    });
}

function closeMembershipEditor() {
    var editorPanel = Ext.getCmp('membershipEditorPanel');
    if (editorPanel) {
        editorPanel.hide();
    }

    var membershipPanel = Ext.getCmp('memberOfPanel');
    if (membershipPanel) {
        membershipPanel.doLayout();
    }
}

function resetMembershipEditor() {
    var editorGrid = Ext.getCmp('membershipGrid');
    if (editorGrid) {
        editorGrid.getSelectionModel().deselectAll();
    }

    var roleSuggest = Ext.getCmp('membershipRoleSuggest');
    roleSuggest.setValue(null);
}

function reloadMembershipStore() {
    var membershipGrid = Ext.getCmp('membershipGrid');
    ensureCorrectStorePageLoad(membershipGrid);
}

function initEventsEditor() {
    var eventWindow = Ext.getCmp('eventWindow');

    if (!eventWindow) {

        var now = new Date();
        /** Zero out the hour,min,sec, fields **/
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);

        eventWindow = new Ext.Window({
            title: "#{msgs.role_title_add_new_event}",
            width: 350,
            id: 'eventWindow',
            modal: true,
            closeAction: 'hide',
            layout: 'form',
            ctCls: 'white padded',
            items: [
                {
                    xtype: 'datefield',
                    name: 'date',
                    id: 'eventDate',
                    fieldLabel: '#{msgs.date}',
                    allowBlank: false,
                    minValue: now,
                    value: now
                },
                {
                    xtype: 'combo',
                    name: 'action',
                    id: 'eventAction',
                    allowBlank: false,
                    fieldLabel: '#{msgs.action}',
                    store: [
                        ['Activate', '#{msgs.activate}'],
                        ['Deactivate', '#{msgs.deactivate}']
                    ]
                }
            ],
            buttons: [
                {
                    text: '#{msgs.button_save}',
                    handler: function () {
                        var dateField = Ext.getCmp('eventDate');
                        var actionField = Ext.getCmp('eventAction');

                        if (dateField.validate() && actionField.validate()) {

                            /** Validate that they aren't trying to add an existing event
                             * ie: adding a deactivate when one already exists         */
                            var action = actionField.getValue();
                            var existingEvents = Ext.DomQuery.select('span[class=roleAction]');
                            if (existingEvents.length > 0) {
                                for (var i = 0; i < existingEvents.length; i++) {

                                    if (existingEvents[i].innerHTML == action) {
                                        Ext.MessageBox.show({
                                            title: '#{msgs.role_error_adding_duplicate_event}',
                                            msg: '#{msgs.role_error_adding_duplicate_event_descr}',
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.ERROR
                                        });

                                        return;
                                    }
                                }
                            }

                            eventWindow.hide();

                            Ext.getDom('editForm:eventDate').value = dateField.getValue().getTime();
                            Ext.getDom('editForm:eventAction').value = action;
                            Ext.getDom('editForm:eventAddBtn').click();

                        } else {
                            Ext.MessageBox.show({
                                title: '#{msgs.role_error_adding_event}',
                                msg: '#{msgs.role_error_adding_event_descr}',
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.ERROR
                            });
                        }
                    }
                },
                {
                    text: '#{msgs.button_cancel}',
                    cls: 'secondaryBtn',
                    handler: function () {
                        eventWindow.hide();
                    }
                }
            ]
        });
    }
    eventWindow.show();
}

function initPermitsEditor() {
    Ext.onReady(function () {
        var permitsEditorPanel = Ext.getCmp('permitsEditorPanel');

        if (!permitsEditorPanel) {
            var roleFilter = Ext.create('SailPoint.RoleFilter', {
                id: 'permitsRoleSuggest',
                url: 'allowedPermitsQuery.json'
            });

            var pagingCheckboxGrid = Ext.create('SailPoint.grid.PagingCheckboxGrid', {
                id: 'permitsGrid',
                store: Ext.create('Ext.data.Store', {
                    storeId: 'permitsDataStore',
                    fields: [
                        { name: 'id', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'roleType', type: 'string' },
                        { name: 'description', type: 'string' }
                    ],
                    proxy: {
                        type: 'ajax',
                        url: 'permitsDataStore.json',
                        reader: {
                            type: 'json',
                            root: 'roles',
                            totalProperty: 'numRoleResults'
                        },
                        extraParams: {
                            'editForm:roleToEdit': Ext.getDom('editForm:roleToEdit').value
                        }
                    },
                    remoteSort: true
                }),
                columns: [
                    { header: '#{msgs.name}', sortable: true, dataIndex: 'name', flex: 3 },
                    { header: '#{msgs.type}', sortable: true, dataIndex: 'roleType', flex: 1 },
                    { header: '#{msgs.description}', sortable: false, dataIndex: 'description', renderer: SailPoint.grid.Util.renderDescription, flex: 5 }
                ],
                selModel: new SailPoint.grid.CheckboxSelectionModel(),
                viewConfig: {autoFill: false, emptyText: '#{msgs.role_section_no_permitted_roles}', scrollOffset: 1},
                cls: 'smallFontGrid wrappingGridCells'
            });

            SailPoint.modeler.RoleEditor.excludeExistingRolesFromReferenceEditors(Ext.StoreMgr.lookup('permitsDataStore'), Ext.getCmp('permitsRoleSuggest'));

            permitsEditorPanel = new Ext.Window({
                id: 'permitsEditorPanel',
                title: '#{msgs.role_title_modify_permitted}',
                border: true,
                renderTo: 'permitsEditor',
                contentEl: 'permitsEditorContents',
                modal: true,
                autoScroll: true,
                closable: false,
                width: 1000,
                height: 400,
                layout: 'fit',
                items: [pagingCheckboxGrid],
                tbar: [ roleFilter,
                    {
                        text: '#{msgs.button_add}',
                        handler: function () {
                            var roleRecord = roleFilter.getRecord();
                            if (roleRecord) {
                                Ext.getDom('editForm:permitsIdToAdd').value = roleRecord.getId();
                                roleFilter.setValue(null);
                                Ext.getDom('editForm:permitsAdd').click();
                            }
                        }
                    }
                ],
                buttons: [
                    {
                        text: '#{msgs.button_save}',
                        handler: function () {
                            Ext.getDom('editForm:permitsSave').click();
                        }
                    },
                    {
                        text: '#{msgs.button_cancel}',
                        cls: 'secondaryBtn',
                        handler: function () {
                            Ext.getDom('editForm:permitsCancel').click();
                        }
                    }
                ],
                buttonAlign: 'center',
                plain: true
            });

            // Insert the remove button on the paging toolbar (had to wait until after render to do it)
            var pagingTB = pagingCheckboxGrid.getPagingToolbar();
            pagingTB.insert(0, {
                xtype: 'button',
                text: '#{msgs.button_remove_selected}',
                handler: function () {
                    var isAllSelected = pagingCheckboxGrid.isAllSelected();
                    Ext.getDom('editForm:selectAllPermits').value = isAllSelected;
                    if (isAllSelected) {
                        Ext.getDom('editForm:selectedPermitsIds').value = pagingCheckboxGrid.getExcludedIds().join(',');
                    } else {
                        Ext.getDom('editForm:selectedPermitsIds').value = pagingCheckboxGrid.getSelectedIds().join(',');
                    }

                    Ext.getDom('editForm:permitsRemove').click();
                }
            });
            pagingTB.insert(1, { xtype: 'tbspacer' });
            pagingTB.insert(2, { xtype: 'tbseparator' });
            pagingTB.insert(3, { xtype: 'tbspacer' });


            permitsEditorPanel.show();
            permitsEditorPanel.alignTo('bottomOfPermittedRolesDisplay', 'b-b');
            pagingCheckboxGrid.getStore().load();
        } else {
            permitsEditorPanel.show();
            permitsEditorPanel.alignTo('bottomOfPermittedRolesDisplay', 'b-b');
        }
    });
}

function closePermitsEditor() {
    var editorPanel = Ext.getCmp('permitsEditorPanel');
    if (editorPanel) {
        editorPanel.hide();
    }

    var permitsPanel = Ext.getCmp('permitsPanel');
    if (permitsPanel) {
        permitsPanel.doLayout();
    }
}

function resetPermitsEditor() {
    var editorGrid = Ext.getCmp('permitsGrid');
    if (editorGrid) {
        editorGrid.getSelectionModel().deselectAll();
    }

    var roleSuggest = Ext.getCmp('permitsRoleSuggest');
    roleSuggest.setValue(null);
}

function reloadPermitsStore() {
    var permitsGrid = Ext.getCmp('permitsGrid');
    ensureCorrectStorePageLoad(permitsGrid);
}

function initRequirementsEditor() {
    Ext.onReady(function () {
        var requirementsEditorPanel = Ext.getCmp('requirementsEditorPanel');

        if (!requirementsEditorPanel) {
            var roleFilter = Ext.create('SailPoint.RoleFilter', {
                id: 'requirementsRoleSuggest',
                url: 'allowedRequirementsQuery.json'
            });

            var pagingCheckboxGrid = Ext.create('SailPoint.grid.PagingCheckboxGrid', {
                id: 'requirementsGrid',
                store: Ext.create('Ext.data.Store', {
                    storeId: 'requirementsDataStore',
                    fields: [
                        { name: 'id', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'roleType', type: 'string' },
                        { name: 'description', type: 'string' }
                    ],
                    proxy: {
                        type: 'ajax',
                        url: 'requirementsDataStore.json',
                        reader: {
                            type: 'json',
                            root: 'roles',
                            totalProperty: 'numRoleResults'
                        },
                        extraParams: {
                            'editForm:roleToEdit': Ext.getDom('editForm:roleToEdit').value
                        }
                    },
                    remoteSort: true
                }),
                columns: [
                    { header: '#{msgs.name}', sortable: true, dataIndex: 'name', flex: 3 },
                    { header: '#{msgs.type}', sortable: true, dataIndex: 'roleType', flex: 1 },
                    { header: '#{msgs.description}', sortable: false, dataIndex: 'description', renderer: SailPoint.grid.Util.renderDescription, flex: 5 }
                ],
                selModel: new SailPoint.grid.CheckboxSelectionModel(),
                viewConfig: {autoFill: false, emptyText: '#{msgs.role_section_no_required_roles}', scrollOffset: 1},
                cls: 'smallFontGrid wrappingGridCells'
            });

            SailPoint.modeler.RoleEditor.excludeExistingRolesFromReferenceEditors(Ext.StoreMgr.lookup('requirementsDataStore'), Ext.getCmp('requirementsRoleSuggest'));

            requirementsEditorPanel = new Ext.Window({
                id: 'requirementsEditorPanel',
                title: '#{msgs.role_title_modify_required}',
                border: true,
                renderTo: 'requirementsEditor',
                contentEl: 'requirementsEditorContents',
                modal: true,
                autoScroll: true,
                closable: false,
                width: 1000,
                height: 400,
                layout: 'fit',
                items: [pagingCheckboxGrid],
                tbar: [ roleFilter,
                    {
                        text: '#{msgs.button_add}',
                        handler: function () {
                            var roleNameToAdd = roleFilter.getValue();
                            if (roleNameToAdd) {
                                var store = Ext.StoreMgr.get('roleDataStore');
                                var roleIndex = store.find('name', roleNameToAdd);
                                var roleRecord = store.getAt(roleIndex);
                                if (roleRecord) {
                                    Ext.getDom('editForm:requirementsIdToAdd').value = roleRecord.getId();
                                    roleFilter.setValue(null);
                                    Ext.getDom('editForm:requirementsAdd').click();
                                }
                            }
                        }
                    }
                ],
                buttons: [
                    {
                        text: '#{msgs.button_save}',
                        handler: function () {
                            Ext.getDom('editForm:requirementsSave').click();
                        }
                    },
                    {
                        text: '#{msgs.button_cancel}',
                        cls: 'secondaryBtn',
                        handler: function () {
                            Ext.getDom('editForm:requirementsCancel').click();
                        }
                    }
                ],
                buttonAlign: 'center',
                plain: true
            });

            // Insert the remove button on the paging toolbar (had to wait until after render to do it)
            var pagingTB = pagingCheckboxGrid.getPagingToolbar();
            pagingTB.insert(0, {
                xtype: 'button',
                text: '#{msgs.button_remove_selected}',
                handler: function () {
                    var isAllSelected = pagingCheckboxGrid.isAllSelected();
                    Ext.getDom('editForm:selectAllRequirements').value = isAllSelected;
                    if (isAllSelected) {
                        Ext.getDom('editForm:selectedRequirementsIds').value = pagingCheckboxGrid.getExcludedIds().join(',');
                    } else {
                        Ext.getDom('editForm:selectedRequirementsIds').value = pagingCheckboxGrid.getSelectedIds().join(',');
                    }

                    Ext.getDom('editForm:requirementsRemove').click();
                }
            });
            pagingTB.insert(1, { xtype: 'tbspacer' });
            pagingTB.insert(2, { xtype: 'tbseparator' });
            pagingTB.insert(3, { xtype: 'tbspacer' });


            requirementsEditorPanel.show();
            requirementsEditorPanel.alignTo('bottomOfRequiredRolesDisplay', 'b-b');
            pagingCheckboxGrid.getStore().load();
        } else {
            requirementsEditorPanel.show();
            requirementsEditorPanel.alignTo('bottomOfRequiredRolesDisplay', 'b-b');
        }
    });
}

SailPoint.modeler.RoleEditor.excludeExistingRolesFromReferenceEditors = function (referenceStore, referenceFilter) {
    referenceStore.on('load', function (store, records, success, options) {
        var referenceIds = [];
        var numReferences = records.length;
        var newBaseParams = {editedRoleId: referenceFilter.editedRoleId};
        var i;

        for (i = 0; i < numReferences; ++i) {
            referenceIds.push(records[i].get('id'));
        }

        newBaseParams.existingRoleIds = referenceIds.join();
        referenceFilter.getStore().getProxy().extraParams = newBaseParams;
        referenceFilter.getStore().load();
    });
};

function closeRequirementsEditor() {
    var editorPanel = Ext.getCmp('requirementsEditorPanel');
    if (editorPanel) {
        editorPanel.hide();
    }

    var requiredPanel = Ext.getCmp('requiredRoles');
    if (requiredPanel) {
        requiredPanel.doLayout();
    }
}

function resetRequirementsEditor() {
    var editorGrid = Ext.getCmp('requirementsGrid');
    if (editorGrid) {
        editorGrid.getSelectionModel().deselectAll();
    }

    var roleSuggest = Ext.getCmp('requirementsRoleSuggest');
    roleSuggest.setValue(null);
}

function reloadRequirementsStore() {
    var roleGrid = Ext.getCmp('requirementsGrid');
    ensureCorrectStorePageLoad(roleGrid);
}

function reloadSimpleEntitlements() {
    Ext.Ajax.request({
        method: 'GET',
        url: CONTEXT_PATH + '/define/roles/modeler/isSimpleEntitlementQuery.json',
        success: function (result, request) {
            if (result.responseText !== null) {
                if (true === result.responseText || result.responseText.indexOf('true') >= 0) {
                    if (Ext.StoreMgr.lookup('simpleEntitlementDataStore')) {
                        Ext.StoreMgr.lookup('simpleEntitlementDataStore').load();
                    }
                }
            }
        }
    });
}

function initEntitlementMiner() {
    var entitlementMiningPanel = Ext.getCmp('entitlementMiningPanel');
    var roleEditorDiv = Ext.get('roleEditorCt');

    if (!entitlementMiningPanel) {
        entitlementMiningPanel = new SailPoint.modeler.EntitlementMiningPanel({
            id: 'entitlementMiningPanel'
        });
        SailPoint.modeler.initMiningAppMultiSuggest('editForm');
        SailPoint.modeler.initDistinctSuggests('editForm');
    }

    entitlementMiningPanel.show();
    entitlementMiningPanel.setSize({height: roleEditorDiv.getHeight(), width: roleEditorDiv.getWidth()});
    entitlementMiningPanel.alignTo('bottomOfEntitlementsDisplay', 'b-b');
}

function destroyEntitlementMiner() {
    var entitlementMiningPanel = Ext.getCmp('entitlementMiningPanel');
    if (entitlementMiningPanel) {
        entitlementMiningPanel.hide();
    }
}

function initAnalysisResultsPanel() {
    var analysisResultsPanel = Ext.getCmp('analysisResultsPanel');

    // Note: SailPoint.modeler.AnalysisResultsPanel is defined in the analysisResultsPanel.js file
    if (!analysisResultsPanel) {
        analysisResultsPanel = new SailPoint.modeler.AnalysisResultsPanel({
            id: 'analysisResultsPanel'
        });

        analysisResultsPanel.alignTo('aboveTheButtonRow', 'b-b');
    }

    analysisResultsPanel.show();
}

function destroyAnalysisResultsPanel() {
    var analysisResultsPanel = Ext.getCmp('analysisResultsPanel');
    if (analysisResultsPanel) {
        analysisResultsPanel.hide();
    }
}

SailPoint.modeler.setButtonsDisabled = function (newDisabledVal) {
    var roleSaveBtn = Ext.getDom('roleSaveButton');
    var roleImpactAnalysisBtn = Ext.getDom('roleImpactAnalysisButton');
    var roleQuickImpactAnalysisBtn = Ext.getDom('editForm:roleQuickImpactAnalysis');
    var roleCancelBtn = Ext.getDom('roleCancelButton');
    var roleCancelWorkflowsBtn = Ext.getDom('roleCancelWorkflowsButton');

    if (roleSaveBtn)
        roleSaveBtn.disabled = newDisabledVal;

    if (roleImpactAnalysisBtn)
        roleImpactAnalysisBtn.disabled = newDisabledVal;

    if (roleQuickImpactAnalysisBtn)
        roleQuickImpactAnalysisBtn.disabled = newDisabledVal;

    if (roleCancelBtn)
        roleCancelBtn.disabled = newDisabledVal;

    if (roleCancelWorkflowsBtn) {
        roleCancelWorkflowsBtn.disabled = newDisabledVal;
    }
};

SailPoint.modeler.RoleEditor.initAssignmentRulePanel = function (options) {
    // Initialize the assignment rule panel
    // this is conditional so we have to test
    if (Ext.getDom('assignmentRuleDisplay')) {
        Ext.getDom('assignmentRuleDisplay').style.display = '';
        Ext.getDom('bottomOfAssignmentRuleDisplay').style.display = '';
        SailPoint.modeler.RoleEditor.createAssignmentRulePanel(options);
    }
};

// Have to create a panel no matter what so that we can hide the contents if needed
SailPoint.modeler.RoleEditor.createAssignmentRulePanel = function (options) {
    var assignmentRulePanel = Ext.getCmp('assignmentRule');

    var title = '#{msgs.role_section_assignment_selector}';

    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'assignmentRuleDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'assignmentRuleDisplayContents'
        });
    }

    if (!assignmentRulePanel) {
        assignmentRulePanel = Ext.create('Ext.panel.Panel', {
            id: 'assignmentRule',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'assignmentRuleDisplay',
            contentEl: 'assignmentRuleDisplayContents',
            autoScroll: false,
            layout: 'fit'
        });
    } else {
        assignmentRulePanel.show();
    }

    //Redo layout to resize for new items. 
    Page.on('selectorPanelChanged', function () {
        assignmentRulePanel.doLayout();
    });

    return assignmentRulePanel;
};

SailPoint.modeler.RoleEditor.hideAssignmentRulePanel = function () {
    var assignmentRulePanel = Ext.getCmp('assignmentRule');
    if (!assignmentRulePanel) {
        assignmentRulePanel = SailPoint.modeler.RoleEditor.createAssignmentRulePanel();
    }

    assignmentRulePanel.hide();
    Ext.getDom('assignmentRuleDisplay').style.display = 'none';
    Ext.getDom('bottomOfAssignmentRuleDisplay').style.display = 'none';
}

SailPoint.modeler.RoleEditor.initEntitlementsPanel = function (options) {
    // Initialize the entitlements panel
    if (Ext.getDom('entitlementsDisplay')) {
        Ext.getDom('entitlementsDisplay').style.display = '';
        Ext.getDom('bottomOfEntitlementsDisplay').style.display = '';

        var title = '#{msgs.header_entitlements}';

        if (options && options.valid === false) {
            SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
                contentDiv: 'entitlementsDisplayField',
                fieldTitle: title
            });
        } else {
            SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
                contentDiv: 'entitlementsDisplayField'
            });
        }

        SailPoint.modeler.RoleEditor.initSimpleGrid();

        var entitlementsPanel = Ext.getCmp('entitlements');
        if (!entitlementsPanel) {
            entitlementsPanel = new Ext.Panel({
                id: 'entitlements',
                title: title,
                border: true,
                collapsible: true,
                collapsed: false,
                layout: 'fit',
                renderTo: 'entitlementsDisplay',
                contentEl: 'entitlementsDisplayField',
                autoScroll: true
            });
        } else {
            entitlementsPanel.show();
        }
    }
};

SailPoint.modeler.RoleEditor.initSimpleGrid = function () {
    var simpleGrid = Ext.getCmp('entitlementsSimpleGridPanel');
    if (!simpleGrid) {
        var simpleStore = Ext.StoreMgr.lookup('simpleEntitlementDataStore');
        simpleGrid = Ext.create('SailPoint.grid.PagingGrid', {
            id: 'entitlementsSimpleGridPanel',
            renderTo: 'entitlementsSimpleGrid',
            collapsible: false,
            collapsed: false,
            padding: 20,
            hidden: false,
            pageSize: MAX_ENTITLEMENTS,
            store: simpleStore,
            cls: 'smallFontGrid wrappingGridCells',
            columns: [
                {
                    xtype: 'actioncolumn',
                    text: '',
                    width: 40,
                    align: 'center',
                    hideable: false,
                    menuText: '#{msgs.role_editor_delete}',
                    sortable: false,
                    hideable: false,
                    items: [
                        {
                            icon: SailPoint.getRelativeUrl('/images/icons/remove_18.png'),
                            tooltip: '#{msgs.role_editor_delete}',
                            handler: function (grid, rowIndex, colIndex) {
                                var rec = grid.getStore().getAt(rowIndex);
                                grid.getStore().remove(rec);
                                
                                Ext.getDom('editForm:deleteSimpleEntitlementInput').value = JSON.stringify(rec.data);
                                Ext.getDom('editForm:deleteSimpleEntitlementButton').click();
                            }
                        }
                    ]
                },
                { dataIndex: 'applicationName', header: '#{msgs.role_simple_entitlement_application_name_header}', flex: 1, sortable: true },
                { dataIndex: 'property', header: '#{msgs.role_simple_entitlement_property_header}', flex: 1, sortable: true },
                { dataIndex: 'displayValue', header: '#{msgs.role_simple_entitlement_value_header}', flex: 3, sortable: true, renderer: 'htmlEncode' },
                { dataIndex: 'classifications', header: '#{msgs.role_simple_entitlement_classification_header}', flex: 3, sortable: false, renderer: 'htmlEncode' }
            ],
            tbar: [
                {
                    id: 'simpleViewAddButton',
                    text: '#{msgs.role_simple_entitlement_add_button}',
                    handler: function () {
                        Ext.getDom('editForm:editedProfileId').value = '';
                        Ext.getDom('editForm:editMode').value = 'SimpleEntitlement';
                        Ext.getDom('editForm:editSimpleEntitlement').click();
                    }
                },
                {
                    id: 'simpleViewSwitchButton',
                    text: '#{msgs.role_simple_entitlement_advanced_view}',
                    handler: function () {
                        Ext.get('entitlementsDisplayContents').show();
                        Ext.get('entitlementsSimpleGrid').setVisibilityMode(Ext.Element.DISPLAY).hide();
                        Ext.StoreMgr.lookup('entitlementDataStore').load({
                            params: {'editForm:id': Ext.getDom('editForm:roleToEdit').value},
                            callback: refreshEntitlements
                        });
                        SailPoint.modeler.RoleEditor.toggleSwitchToSimpleButton();
                        Ext.getCmp('advancedEntitlementsViewPanel').doLayout();
                        Ext.getCmp('entitlements').doLayout();
                        //TODO fix this
                    }
                }
            ]
        });
    }
    Ext.StoreMgr.lookup('simpleEntitlementDataStore').load();
};

SailPoint.modeler.RoleEditor.simpleCommit = function () {
    profilecommitEntitlementMultiSelect();
    profilecommitIntegerCmp();
};

function profilecommitIntegerCmp() {
    var thisObj = Ext.getCmp('profileintegerFilterCmp');
    if (thisObj && Ext.getDom('editForm:profileintegerFilterValue')) {
        Ext.getDom('editForm:profileintegerFilterValue').value = thisObj.getValue();
    }
}

function profilecommitEntitlementMultiSelect() {
    var multiSelect = Ext.getCmp('profileentitlementMultiSelect');
    if (multiSelect) {
        var values = multiSelect.getValue();

        var valueString = '';

        for (var i = 0; i < values.length; ++i) {
            if (i > 0) {
                valueString += '\n';
            }

            valueString += values[i];
        }
        
        if (Ext.getDom('editForm:profileentitlementMultiFilterValue')) {
          Ext.getDom('editForm:profileentitlementMultiFilterValue').value = valueString;
        }
    }
}


SailPoint.modeler.RoleEditor.toggleSwitchToSimpleButton = function () {
    Ext.Ajax.request({
        method: 'GET',
        url: CONTEXT_PATH + '/define/roles/modeler/isSimpleEntitlementQuery.json',
        success: function (result, request) {
            if (result.responseText !== null) {
                if (false === result.responseText || result.responseText.indexOf('false') >= 0) {
                    Ext.getCmp('advancedViewSwitchButton').disable();
                } else {
                    Ext.getCmp('advancedViewSwitchButton').enable();
                }
            }
        }
    });
};

SailPoint.modeler.RoleEditor.hideEntitlementsPanel = function () {
    var entitlementsPanel = Ext.getCmp('entitlements');
    if (entitlementsPanel) {
        entitlementsPanel.hide();
    }
    Ext.getDom('entitlementsDisplay').style.display = 'none';
    Ext.getDom('bottomOfEntitlementsDisplay').style.display = 'none';
};

SailPoint.modeler.RoleEditor.initMemberOfPanel = function (options) {
    var memberOfPanel;
    // Initialize the 'memberOf' panel
    if (Ext.getDom('memberOfRolesDisplay')) {
        Ext.getDom('memberOfRolesDisplay').style.display = '';
        Ext.getDom('bottomOfMembershipDisplay').style.display = '';
        memberOfPanel = SailPoint.modeler.RoleEditor.createMemberOfPanel(options);
        memberOfPanel.show();
    }
};

// Need to build a panel around this fragment no matter what so that we can hide 
// and show it as needed
SailPoint.modeler.RoleEditor.createMemberOfPanel = function (options) {
    var title = '#{msgs.role_membership}';

    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'memberOfRolesDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'memberOfRolesDisplayContents'
        });
    }

    var memberOfPanel = Ext.getCmp('memberOfPanel');
    if (!memberOfPanel) {
        var memberOfPanel = new Ext.Panel({
            id: 'memberOfPanel',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'memberOfRolesDisplay',
            contentEl: 'memberOfRolesDisplayContents',
            autoScroll: false,
            layout: 'fit',
            tbar: [
                {
                    id: 'memberOfEditButton',
                    text: '#{msgs.header_modify_membership}',
                    handler: function () {
                        initMembershipEditor();
                    }
                }
            ]
        });
    }

    return memberOfPanel;
};

SailPoint.modeler.RoleEditor.hideMemberOfPanel = function () {
    var memberOfPanel = Ext.getCmp('memberOfPanel');
    if (!memberOfPanel) {
        memberOfPanel = SailPoint.modeler.RoleEditor.createMemberOfPanel();
    }
    memberOfPanel.hide();
    Ext.getDom('memberOfRolesDisplay').style.display = 'none';
    Ext.getDom('bottomOfMembershipDisplay').style.display = 'none';
};

SailPoint.modeler.RoleEditor.initTemplateDisplayPanel = function (options) {
    if (Ext.getDom('templateDisplay')) {
        Ext.getDom('templateDisplay').style.display = '';
        Ext.getDom('bottomOfTemplateDisplay').style.display = '';
        var templatePanel = SailPoint.modeler.RoleEditor.createTemplateDisplayPanel(options);
    }
};

//Need to build a panel around this fragment no matter what so that we can hide 
//and show it as needed
SailPoint.modeler.RoleEditor.createTemplateDisplayPanel = function (options) {
    var title = '#{msgs.template_editor_template}';

    var templatePanel = Ext.getCmp('roleTemplatePanel');

    if (!templatePanel) {

        templatePanel = Ext.create('Ext.panel.Panel', {
            id: 'roleTemplatePanel',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'templateDisplay',
            contentEl: 'templateDisplayContents',
            autoScroll: false,
            layout: 'fit'
        });

        // hack to generically handle formEditor saveForm oncomplete
        Page.on('onFormEditorContentChanged', function () {
            templatePanel.doLayout();
        });
    }

    return templatePanel;
};

SailPoint.modeler.RoleEditor.initRoleEventsDisplayPanel = function (options) {
//Initialize the role events info panel
    if (Ext.getDom('roleEventsDisplay')) {
        Ext.getDom('roleEventsDisplay').style.display = '';
        Ext.getDom('bottomOfRoleEventsDisplay').style.display = '';
        var roleEventsPanel = SailPoint.modeler.RoleEditor.createRoleEventsDisplayPanel(options);
        roleEventsPanel.show();
    }
};

SailPoint.modeler.RoleEditor.resizeRoleEventsPanel = function () {
    var eventsPanel = Ext.getCmp('roleEventsPanel');
    if (eventsPanel) {
        eventsPanel.doLayout();
    }
};

SailPoint.modeler.RoleEditor.hideRoleEventsDisplayPanel = function () {
    var eventsPanel = Ext.getCmp('sailpointRightsPanel');
    if (!eventsPanel) {
        eventsPanel = SailPoint.modeler.RoleEditor.createSailPoinRightsDisplayPanel();
    }
    eventsPanel.hide();
    Ext.getDom('sailpointRightsDisplay').style.display = 'none';
};

//Need to build a panel around this fragment no matter what so that we can hide 
//and show it as needed
SailPoint.modeler.RoleEditor.createRoleEventsDisplayPanel = function (options) {
    var title = '#{msgs.role_section_role_events}';

    var eventsPanel = Ext.getCmp('roleEventsPanel');

    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'roleEventsDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'roleEventsDisplayContents'
        });
    }

    if (!eventsPanel) {
        eventsPanel = new Ext.Panel({
            id: 'roleEventsPanel',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'roleEventsDisplay',
            contentEl: 'roleEventsDisplayContents',
            autoScroll: false,
            layout: 'fit',
            tbar: [
                {
                    id: 'roleEventAddBtn',
                    text: '#{msgs.role_button_add_event}',
                    handler: function () {
                        initEventsEditor();
                    }
                },
                {
                    id: 'roleEventDeleteBtn',
                    text: '#{msgs.role_button_delete_event}',
                    handler: function () {
                        Ext.getDom('editForm:eventDeleteBtn').click();
                    }
                }
            ]
        });
    }

    return eventsPanel;
};

SailPoint.modeler.RoleEditor.hideRoleEventsDisplayPanel = function () {
    var eventsPanel = Ext.getCmp('eventsPanel');
    if (!eventsPanel) {
        eventsPanel = SailPoint.modeler.RoleEditor.createRoleEventsDisplayPanel();
    }
    eventsPanel.hide();
    Ext.getDom('roleEventsDisplay').style.display = 'none';
    Ext.getDom('bottomOfRoleEventsDisplay').style.display = 'none';
};

SailPoint.modeler.RoleEditor.initPermittedRolesDisplayPanel = function (options) {
    // Initialize the permitted role info panel
    if (Ext.getDom('permittedRolesDisplay')) {
        Ext.getDom('permittedRolesDisplay').style.display = '';
        Ext.getDom('bottomOfPermittedRolesDisplay').style.display = '';
        var permitsPanel = SailPoint.modeler.RoleEditor.createPermittedRolesDisplayPanel(options);
        permitsPanel.show();
    }
};

// Need to build a panel around this fragment no matter what so that we can hide 
// and show it as needed
SailPoint.modeler.RoleEditor.createPermittedRolesDisplayPanel = function (options) {
    var title = '#{msgs.role_section_permitted_roles}';

    var permitsPanel = Ext.getCmp('permitsPanel');

    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'permittedRolesDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'permittedRolesDisplayContents'
        });
    }

    if (!permitsPanel) {
        permitsPanel = new Ext.Panel({
            id: 'permitsPanel',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'permittedRolesDisplay',
            contentEl: 'permittedRolesDisplayContents',
            autoScroll: false,
            layout: 'fit',
            tbar: [
                {
                    id: 'permittedRolesEditButton',
                    text: '#{msgs.role_button_modify_permitted}',
                    handler: function () {
                        initPermitsEditor();
                    }
                }
            ]
        });
    }

    return permitsPanel;
};

SailPoint.modeler.RoleEditor.hidePermittedRolesDisplayPanel = function () {
    var permitsPanel = Ext.getCmp('permitsPanel');
    if (!permitsPanel) {
        permitsPanel = SailPoint.modeler.RoleEditor.createPermittedRolesDisplayPanel();
    }
    permitsPanel.hide();
    Ext.getDom('permittedRolesDisplay').style.display = 'none';
    Ext.getDom('bottomOfPermittedRolesDisplay').style.display = 'none';
};

SailPoint.modeler.RoleEditor.initRequiredRolesDisplayPanel = function (options) {
    var requirementsPanel;
    // Initialize the 'requirements' panel
    if (Ext.getDom('requiredRolesDisplay')) {
        Ext.getDom('requiredRolesDisplay').style.display = '';
        Ext.getDom('bottomOfRequiredRolesDisplay').style.display = '';
        requirementsPanel = SailPoint.modeler.RoleEditor.createRequiredRolesDisplayPanel(options);
        requirementsPanel.show();
    }
};

// Need to build a panel around this fragment no matter what so that we can hide 
// and show it as needed
SailPoint.modeler.RoleEditor.createRequiredRolesDisplayPanel = function (options) {
    var requirementsPanel = Ext.getCmp('requiredRoles');
    var title = '#{msgs.role_section_required_roles}';
    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'requiredRolesDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'requiredRolesDisplayContents'
        });
    }

    if (!requirementsPanel) {
        requirementsPanel = new Ext.Panel({
            id: 'requiredRoles',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            renderTo: 'requiredRolesDisplay',
            contentEl: 'requiredRolesDisplayContents',
            autoScroll: false,
            layout: 'fit',
            tbar: [
                {
                    id: 'requiredRolesEditButton',
                    text: '#{msgs.role_button_modify_required}',
                    handler: function () {
                        initRequirementsEditor();
                    }
                }
            ]
        });
    }

    return requirementsPanel;
};

SailPoint.modeler.RoleEditor.hideRequiredRolesDisplayPanel = function () {
    var requirementsPanel = Ext.getCmp('requiredRoles');
    if (!requirementsPanel) {
        requirementsPanel = SailPoint.modeler.RoleEditor.createRequiredRolesDisplayPanel();
    }
    requirementsPanel.hide();
    Ext.getDom('bottomOfRequiredRolesDisplay').style.display = 'none';
    Ext.getDom('requiredRolesDisplay').style.display = 'none';
};

SailPoint.modeler.RoleEditor.roleTypeSelectionChanged = function () {
    SailPoint.modeler.RoleEditor.updateDisplayedFields();
};

SailPoint.modeler.RoleEditor.updateDisplayedFields = function () {

    Ext.MessageBox.wait('#{msgs.loading_data}');
    var roleType = Ext.getDom('editForm:roleType').value;
    // Assume that this method is either called in the store's callback or that 
    // it is called after the page has already initially loaded
    var roleTypeDefStore = Ext.StoreMgr.lookup('roleTypeDefinitionStore');
    var roleTypeDef = roleTypeDefStore.getTypeDefinition(roleType);
    var entitlementDataStore = Ext.StoreMgr.lookup('entitlementDataStore')
    var isEmpty, numEntitlements, contents, rightsPanel, isValid;

    if (Ext.getDom('roleEventsDisplay')) {
        SailPoint.modeler.RoleEditor.initRoleEventsDisplayPanel({valid: true});
    }

    if (roleTypeDef !== null) {
        if (roleTypeDef.noAssignmentSelector) {
            isEmpty = (Ext.getDom('selectorIsEmpty').value == 'true');

            if (isEmpty)
                SailPoint.modeler.RoleEditor.hideAssignmentRulePanel();
            else
                SailPoint.modeler.RoleEditor.initAssignmentRulePanel({roleType: roleType, valid: false});
        } else {
            SailPoint.modeler.RoleEditor.initAssignmentRulePanel({roleType: roleType, valid: true});
        }

        if (roleTypeDef.noProfiles) {
            numEntitlements = entitlementDataStore.getTotalCount();
            isEmpty = (numEntitlements <= 0);

            if (isEmpty) {
                SailPoint.modeler.RoleEditor.hideEntitlementsPanel();
                
                // Also hide provisioning targets panel
                Ext.get('provisioningTargetAccountSelectorRuleDisplay').setVisibilityMode(Ext.Element.DISPLAY).hide();
            }
            else
                SailPoint.modeler.RoleEditor.initEntitlementsPanel({roleType: roleType, valid: false});
        } else {
            SailPoint.modeler.RoleEditor.initEntitlementsPanel({roleType: roleType, valid: true});
            Ext.get('provisioningTargetAccountSelectorRuleDisplay').show();
        }

        if (roleTypeDef.noSupers) {
            isEmpty = (Ext.getDom('memberOfRolesIsEmpty').value == 'true');

            if (isEmpty)
                SailPoint.modeler.RoleEditor.hideMemberOfPanel();
            else
                SailPoint.modeler.RoleEditor.initMemberOfPanel({roleType: roleType, valid: false});
        } else {
            SailPoint.modeler.RoleEditor.initMemberOfPanel({roleType: roleType, valid: true});
        }

        if (roleTypeDef.noPermits) {
            isEmpty = (Ext.getDom('permittedRolesIsEmpty').value == 'true');

            if (isEmpty)
                SailPoint.modeler.RoleEditor.hidePermittedRolesDisplayPanel();
            else
                SailPoint.modeler.RoleEditor.initPermittedRolesDisplayPanel({roleType: roleType, valid: false});
        } else {
            SailPoint.modeler.RoleEditor.initPermittedRolesDisplayPanel({roleType: roleType, valid: true});
        }

        if (roleTypeDef.noRequirements) {
            isEmpty = (Ext.getDom('requiredRolesIsEmpty').value == 'true');

            if (isEmpty == true)
                SailPoint.modeler.RoleEditor.hideRequiredRolesDisplayPanel();
            else
                SailPoint.modeler.RoleEditor.initRequiredRolesDisplayPanel({roleType: roleType, valid: false});
        } else {
            SailPoint.modeler.RoleEditor.initRequiredRolesDisplayPanel({roleType: roleType, valid: true});
        }

        isEmpty = (Ext.getDom('rightsIsEmpty').value == 'true');
        /* valid if no IIQ rights can be assigned and values empty OR if rights can be assigned */
        isValid = (roleTypeDef.noIIQ && isEmpty === true) || !roleTypeDef.noIIQ;
        if (roleTypeDef.noIIQ && isEmpty === true) {
            contents = Ext.getDom('sailpointRightsDisplay');
            if (contents)
                contents.style.display = 'none';
            rightsPanel = Ext.getCmp('sailpointRightsPanel');
            if (rightsPanel)
                rightsPanel.hide();
        } else {
            SailPoint.modeler.RoleEditor.initRoleSailPointRightsDisplayPanel({valid: isValid});
        }

    } else {
        SailPoint.modeler.RoleEditor.initAssignmentRulePanel({roleType: roleType, valid: false});
        SailPoint.modeler.RoleEditor.initEntitlementsPanel({roleType: roleType, valid: false});
        SailPoint.modeler.RoleEditor.initMemberOfPanel({roleType: roleType, valid: false});
        SailPoint.modeler.RoleEditor.initPermittedRolesDisplayPanel({roleType: roleType, valid: false});
        SailPoint.modeler.RoleEditor.initRequiredRolesDisplayPanel({roleType: roleType, valid: false});
        SailPoint.modeler.RoleEditor.initRoleSailPointRightsDisplayPanel({valid: false});
    }

    SailPoint.modeler.RoleEditor.initTemplateDisplayPanel({valid: true});

    SailPoint.modeler.RoleEditor.hideDisallowedAttributes();
    
    Ext.MessageBox.hide();
};

SailPoint.modeler.RoleEditor.displayInvalidFieldWarning = function (options) {
    var tpl = new Ext.Template("#{msgs.role_invalid_field_warning}");
    var warningMsg = tpl.apply([options.fieldTitle]);
    var warningDivArray = Ext.DomQuery.select('div[class*=invalidFieldWarning]', Ext.getDom(options.contentDiv));
    var warningDiv = warningDivArray[0];
    var warningDivEl = Ext.get(warningDiv);
    Ext.DomHelper.overwrite(warningDivEl, '<span>' + warningMsg + '</span>');
    Ext.DomHelper.applyStyles(warningDivEl, {display: '', color: 'red'});
};

SailPoint.modeler.RoleEditor.hideInvalidFieldWarning = function (options) {
    var warningDivArray = Ext.DomQuery.select('div[class*=invalidFieldWarning]', Ext.getDom(options.contentDiv));
    var warningDiv = warningDivArray[0];
    var warningDivEl = Ext.get(warningDiv);
    Ext.DomHelper.applyStyles(warningDivEl, {display: 'none'});
};

SailPoint.modeler.RoleEditor.loadEntitlementsAndFinishInit = function () {
    var entitlementDataStore = Ext.StoreMgr.lookup('entitlementDataStore');
    entitlementDataStore.load({
        params: {"editForm:id": Ext.getDom("editForm:roleToEdit").value},
        callback: SailPoint.modeler.RoleEditor.finishInit
    });
};

SailPoint.modeler.RoleEditor.finishInit = function () {
    // This is necessary because of a chicken-and-egg type of situation where the entitlements data store
    // has to be loaded before we know if we actually want to render it
    var entitlementStore = Ext.StoreMgr.lookup('entitlementDataStore');
    refreshEntitlements(entitlementStore);
    SailPoint.modeler.RoleEditor.updateDisplayedFields();
};

SailPoint.modeler.RoleEditor.displayedEntitlements = [];

SailPoint.modeler.RoleEditor.prepareForRollback = function (archiveId) {
    Ext.getDom('rollbackForm:selectedArchive').value = archiveId;
    Ext.getDom('rollbackForm:roleToEdit').value = Ext.getDom('editForm:roleToEdit').value;
};

SailPoint.modeler.RoleEditor.initRoleSailPointRightsDisplayPanel = function (options) {
//Initialize the role rights panel
    if (Ext.getDom('sailpointRightsDisplay')) {
        Ext.getDom('sailpointRightsDisplay').style.display = '';
        var rightsPanel = SailPoint.modeler.RoleEditor.createSailPointRightsDisplayPanel(options);
        var rightsEmpty = Ext.getDom('rightsIsEmpty');
        if (rightsEmpty.value && rightsEmpty.value == 'true') {
            Ext.getDom('sailpointRightsDisplayContents').style.display = 'none';
        } else {
            Ext.getDom('sailpointRightsDisplayContents').style.display = '';
            Ext.getCmp('controlledScopesMultiSuggest').show();
        }
        rightsPanel.show();
        rightsPanel.doLayout();
    }
};

//Need to build a panel around this fragment no matter what so that we can hide 
//and show it as needed
SailPoint.modeler.RoleEditor.createSailPointRightsDisplayPanel = function (options) {
    var title = '#{msgs.role_section_sprights}';

    var rightsPanel = Ext.getCmp('sailpointRightsPanel');

    if (options && options.valid === false) {
        SailPoint.modeler.RoleEditor.displayInvalidFieldWarning({
            contentDiv: 'sailpointRightsDisplayContents',
            fieldTitle: title
        });
    } else {
        SailPoint.modeler.RoleEditor.hideInvalidFieldWarning({
            contentDiv: 'sailpointRightsDisplayContents'
        });
    }

    if (!rightsPanel) {
        rightsPanel = new Ext.Panel({
            id: 'sailpointRightsPanel',
            title: title,
            border: true,
            collapsible: true,
            collapsed: false,
            titleCollapse: true,
            renderTo: 'sailpointRightsDisplay',
            contentEl: 'sailpointRightsDisplayContents',
            autoScroll: false,
            layout: 'fit',
            tbar: [
                {
                    id: 'roleProvisioningConfigureButton',
                    text: '#{msgs.button_configure}',
                    handler: function () {
                        toggleRightsDiv();
                    }
                }
            ]
        });
    }

    // initialize capabilities multi-select
    var capabilities;
    if (Ext.getDom('editForm:capabilityInput')) {
        capabilities = Ext.getDom('editForm:capabilityInput').value;
    }
    var allcapabilities = Ext.getDom('allrolecapabilities');

    if (capabilities) {
        var caps = stringToArray(capabilities, true);
        for (i = 0; i < caps.length; i++) {
            cap = caps[i];
            for (j = 0; j < allcapabilities.options.length; j++) {
                if (allcapabilities.options[j].value == cap) {
                    allcapabilities.options[j].selected = true;
                }
            }
        }
    }

    // initialize the controlled scope multi suggest
    var controlledScopesMultiSuggest;
    if (!Ext.getDom('controlledScopesMultiSuggest')) {
        controlledScopesMultiSuggest = new SailPoint.MultiSuggest({
            id: 'controlledScopesMultiSuggest',
            renderTo: 'controlledScopesMultiSuggestDiv',
            suggestType: 'scope',
            jsonData: Ext.decode(Ext.getDom('roleControlledScopesMultiSuggestData').innerHTML),
            inputFieldName: 'controlledScopes',
            contextPath: CONTEXT_PATH,
            hidden: true
        });
    }

    return rightsPanel;
};

function toggleRightsDiv() {
    var contents = Ext.getDom('sailpointRightsDisplayContents');
    if (contents.style.display == 'none') {
        contents.style.display = '';
        Ext.getCmp('controlledScopesMultiSuggest').show();
    } else {
        contents.style.display = 'none';
    }

    var rightsPanel = Ext.getCmp('sailpointRightsPanel');
    if (rightsPanel) {
        rightsPanel.doLayout();
    }
}

SailPoint.modeler.RoleEditor.updateCapabilities = function (container) {
    var caps = [];
    for (i = 0; i < container.options.length; i++) {
        if (container.options[i].selected) {
            caps.push(container.options[i].value);
        }
    }
    Ext.getDom('editForm:capabilityInput').value = arrayToString(caps, true);
};

SailPoint.modeler.RoleEditor.hideDisallowedAttributes = function () {
    Ext.Ajax.request({
        url: SailPoint.getRelativeUrl('/rest/roleEditor/disallowedAttributes'),
        params: {
            roleType:  Ext.getDom('editForm:roleType').value,
            workItemId: Ext.getDom('editForm:workItemId').value
        },
        success: function fetchedDisallowedAttributes(response, options) {
            var disallowedAttributes = Ext.decode(response.responseText);
            SailPoint.AttributeEditor.updateHiddenAttributes({
                type: 'roleAttributeEditorTable',
                attributesToHide: disallowedAttributes
            });
        },
        failure: function failedToFetchDisallowedAttributes(response, options) {
            /**
             * Assume anything goes if there is no type available yet.
             */
            SailPoint.AttributeEditor.updateHiddenAttributes({
                type: 'roleAttributeEditorTable',
                attributesToHide: []
            });
        }
    });
};

/**
 * This function is called after click on add entitlement dialog "Save" button
 * If there is an error, leave the dialog open and display error
 * otherwise close dialog, add entitlement to Role is being created.
 */
SailPoint.modeler.RoleEditor.profileOnComplete = function () {
    if (Ext.getDom('editForm:profileError').value === "true") {
        return;
    }
    destroyProfileEditor();
    Ext.StoreMgr.lookup('entitlementDataStore').load({params: {'editForm:id': Ext.getDom('editForm:roleToEdit').value}, callback: refreshEntitlements});
    reloadSimpleEntitlements();
    SailPoint.modeler.RoleEditor.toggleSwitchToSimpleButton();
    Ext.getDom('editForm:refreshTargetAccountRules').click();
};

function ensureCorrectStorePageLoad(grid) {
    if (!grid) {
        return;
    }

    // if we are on the first page then just reload it
    if (grid.getStore().currentPage === 1) {
        grid.getStore().load();
        return;
    }

    // if we are about to remove more items than are present on any
    // page other than the first one we need to load the previous page
    // otherwise we will be trying to load a page that no longer exists
    if (grid.getStore().getCount() <= grid.getSelectionModel().getCount()) {
        grid.getStore().loadPage(grid.getStore().currentPage - 1);
    } else {
        grid.getStore().load();
    }

    // safe to deselect here since we have already removed the items, if
    // we dont do this then our previous calculation will be incorrect
    // if the remove button is clicked again
    grid.getSelectionModel().deselectAll();
}

