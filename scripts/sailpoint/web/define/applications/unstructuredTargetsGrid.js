Ext.ns('SailPoint', 'SailPoint.targetDS');
SailPoint.targetDS.isLoaded = false;

SailPoint.targetDS.initDSContent = function(){
  if (!SailPoint.targetDS.isLoaded) {
        Ext.QuickTips.init();
        var gridWidth = Ext.getDom('targetSources-display').clientWidth;
        if (gridWidth == 0)
            gridWidth = Ext.getDom('targetsTbl').clientWidth;
        else if (gridWidth > 800)
            gridWidth = Math.round(gridWidth * 0.75);
        
        var objectId = Ext.getDom("editForm:id").value;
        
        Ext.define('SailPoint.model.TargetData', {
            extend : 'Ext.data.Model',
            fields: ['id', 'name', 'type', {name: 'modified', type: 'date', dateFormat: 'U'}]
        });

        // data store
        tgsStore = new Ext.data.Store({
            model : 'SailPoint.model.TargetData',
            autoLoad: false,
            proxy : {
                type : 'ajax',
                url: CONTEXT_PATH + '/define/applications/targetSourcesDataSource.json',
                reader : {
                    type : 'json',
                    root: 'targetSources',
                    totalProperty: 'totalCount'
                },
                extraParams: {'editForm:id': objectId }
            },       
            remoteSort: false
        });

        // display models       
        var cols = [{
            header: '#{msgs.name}', 
            id: 'name',
            flex : 1,
            dataIndex: 'name',
            width: 0.55 * gridWidth,
            sortable: true, 
            hideable: true
        },{
            header: '#{msgs.type}', 
            id: 'type', 
            dataIndex: 'type', 
            width: 0.15 * gridWidth,
            sortable: true, 
            hideable: true
        },{
            header: '#{msgs.modified}', 
            id: 'modified', 
            dataIndex: 'modified', 
            width: 0.3 * gridWidth,
            renderer: SailPoint.Date.DateTimeRenderer,
            sortable: true, 
            hideable: true
        }];
        
        // grid
        var tgsGrid = new Ext.grid.Panel({
            id: 'tgsGrid',
            renderTo: 'targetSources-display',
            store: tgsStore,
            columns: cols,
            width: gridWidth,
            scroll: false,
            viewConfig: {
                stripeRows: true
            }       
        });
        
        // don't ask me why the listeners property on the grid throws errors
        // on this page... >:(    
        tgsGrid.addListener('itemclick', SailPoint.targetDS.clickRow);     
        tgsGrid.addListener('itemcontextmenu', SailPoint.targetDS.showContextMenu);     
        tgsGrid.addListener('activate', SailPoint.targetDS.refreshPanel);
        //Refresh the layout of the tabPanel so it will expand to fit the entire targets grid
        tgsGrid.addListener('afterlayout', function() {Ext.getCmp('appTab').getComponent('unstructuredContent').updateLayout();});

      tgsStore.load({params:{start:0, limit:20}});
        
        SailPoint.targetDS.isLoaded = true;
    }
};

SailPoint.targetDS.showContextMenu = function(gridView, record, HTMLitem, index, e, eOpts){
    id = record.getId();
    name = record.get('name');

    var canEdit = Ext.getDom("targetDSCanEdit").value;
    var viewEditText = (canEdit) ? '#{msgs.menu_edit}' : '#{msgs.menu_view}';
    var viewEditIcon = (canEdit) ? "editBtn" : "viewDetailsBtn";
    
    var contextMenu = new Ext.menu.Menu();
    contextMenu.add(new Ext.menu.Item({text: viewEditText, 
                                       handler: SailPoint.targetDS.editADS, 
                                       iconCls: viewEditIcon}));
    if (canEdit) {                               
        contextMenu.add(new Ext.menu.Item({text: '#{msgs.menu_delete}', 
                                           handler: SailPoint.targetDS.deletePrompt, 
                                           iconCls: 'deleteBtn'}));
    }
      
    e.stopEvent();
    contextMenu.showAt(e.xy);
};


SailPoint.targetDS.clickRow = function(gridView, record, HTMLitem, index, e, eOpts){
    Ext.getDom('editForm:selectedTargetsForApp').value = record.getId();
    Ext.getDom('editForm:editButtonTgs').click();
};


SailPoint.targetDS.editADS = function(menuItem, eventObj) {
    // there's no functional difference btwn this and clickRow
    Ext.getDom('editForm:selectedTargetsForApp').value = id;
    Ext.getDom('editForm:editButtonTgs').click();
};


SailPoint.targetDS.deletePrompt = function() {
    Ext.getDom('editForm:selectedTargetsForApp').value = id;
    Ext.MessageBox.confirm('Confirm delete of "' + name + '"?', 
                           'Are you sure you want to delete "' + name + '"?', 
                           SailPoint.targetDS.deleteADS);
};


SailPoint.targetDS.deleteADS = function(button, text) {
    if (button == 'yes') {
        Ext.getDom('editForm:deleteButtonTgs').click();
    }
};

SailPoint.targetDS.refreshPanel = function(component) {
    component.getStore().load({params:{start:0, limit:20}});
};


/**
 * Creates an popupWindow allowing a user to select an existing TargetSource or create a new one
 * @param config model data to populate the existing TargetSource combo
 *
 */
SailPoint.targetDS.showNewTargetSourceWindow = function(config){
    //Pass the combo config in


    Ext.create('Ext.window.Window', {
        id: 'addTargetSourceWindow',
        title: '#{msgs.app_unstrucutured_add_create_title}',
        minHeight: 200,
        minWidth: 500,
        modal: true,
        resizable: false,
        border: false,
        bodyBorder: false,
        items: {
           xtype: 'combo',
           id: 'availableTS',
           fieldLabel: '#{msgs.app_unstructured_select_ts_label}',
           labelAlign: 'left',
           labelCls: 'spContentTitle2',
           padding: 10,
           allowBlank: false,
           forceSelection: true,
           store: config

        },
        bbar: [
            {
                xtype: 'button',
                text: '#{msgs.app_unstructured_create_ts_button}',
                cls: 'primaryBtn',
                handler: function() {
                    Ext.getDom('editForm:createTargetSourceButton').click();
                    Ext.getCmp('addTargetSourceWindow').destroy();
                }

            },
            { xtype: 'tbfill' },
            {
                xtype: 'button',
                text: '#{msgs.button_save}',
                cls : 'primaryBtn',
                margin: '0 0 0 5',
                handler: function() {
                    var combo = Ext.getCmp('addTargetSourceWindow').getComponent('availableTS');
                    if (combo && combo.validate()) {
                        //Set the value to whatever is in the comboBox
                        Ext.getDom('editForm:selectedTargetsForApp').value = combo.getValue();
                        Ext.getDom('editForm:addButtonTgs').click();
                        Ext.getCmp('addTargetSourceWindow').destroy();
                    }

                }
            },
            {
                xtype: 'button',
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                margin: '0 0 0 5',
                handler: function() {
                    Ext.getCmp('addTargetSourceWindow').destroy();
                }
            }
        ],
        listeners : {
            show: function(me, opt){
                me.updateLayout();
                me.center();
            }
        }
    }).show();

};
