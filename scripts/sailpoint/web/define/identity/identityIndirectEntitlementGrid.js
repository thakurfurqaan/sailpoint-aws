Ext.define('SailPoint.Define.Grid.IdentityIndirectEntitlement', {

    statics : {
        /*
         * Create the grid that displays Indirect Entitlements for a specific Identity.
         */
        createGrid : function(identity, gridMetaData, gridStateStr, stateId, config) {

            //var entitlementsGridState = new SailPoint.GridState({name: stateId, gridStateObj: JSON.parse(gridStateStr)});
            Ext.QuickTips.init();

            var baseParams = {colKey:config.colKey};

            var entStore  = SailPoint.Store.createRestStore({
                autoLoad: false,
                url: SailPoint.getRelativeUrl('/rest/identities/{0}/identityIndirectAccess'),
                fields: gridMetaData.fields,
                method: 'GET',
                remoteSort: true,
                simpleSortMode: true,
                extraParams: baseParams
            });

            entStore.applyPathParams([SailPoint.Utils.encodeRestUriComponent(identity)]);

            // callback for the tooltip rendering when the grid is loaded
            entStore.on('load', SailPoint.Define.Grid.IdentityIndirectEntitlement.initQuickTips, this );

            var cnf = {
                store: entStore,
                cls: 'smallFontGrid',
                stateId: stateId,
                stateful: true,
                gridStateStr: gridStateStr,
                gridMetaData: gridMetaData,
                loadMask: true,
                viewConfig: {
                    scrollOffset: 1,
                    stripeRows:true
                },
                usePageSizePlugin: true
            };

            Ext.apply(cnf, config);
            var grid = Ext.create('SailPoint.Define.Grid.IdentityIndirectEntitlement.SearchGrid', cnf);

            return grid;
        },

        /*
         * Method that is called to initialize the tool tips we provide for
         * entitlement descriptions.
         */
        initQuickTips : function() {
            Ext.QuickTips.init();
            Ext.apply(Ext.QuickTips.getQuickTip(), {
                showDelay: 1000,
                autoDismiss: false,
                dismissDelay: 0,
                trackMouse: false
            });
            SailPoint.component.NameWithTooltip.registerTooltips();
        }
    }// end statics
});

Ext.define('SailPoint.Define.Grid.IdentityIndirectEntitlement.SearchGrid', {
    extend : 'SailPoint.grid.PagingGrid',

    constructor : function(config){

        config.tbar = {
            xtype : 'toolbar',
            enableOverflow: true,
            items : [
                {
                    xtype : 'searchfield',
                    id: 'identityIndirectEntitlementsSearchField',
                    store: config.store,
                    paramName:'appOrValue',
                    emptyText:'#{msgs.identity_entitlements_effective_by_value}',
                    width:250,
                    storeLimit:10
                }]
        };

        Ext.apply(this, config);
        this.callParent(arguments);
    },

    initComponent : function() {
        this.callParent(arguments);

        this.getView().on('resize', function() {
            SailPoint.identity.setTabPanelHeight();
        });

        SailPoint.identity.addGrid(this.getId());
    }

});