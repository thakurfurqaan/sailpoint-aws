/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
* @class SailPoint.IdentityDetailPopup
* @extends Ext.Window
*
* Popup window which displays the attributes and application accounts for a given identity.
* The data is displayed in two different tabs. The popup is managed as a singleton instance. 
* All the hide/show methods are static methods on this class.
*/
Ext.define('SailPoint.IdentityDetailPopup', {
    extend : 'Ext.Window',

    identityId : null,
    action     : null, //IIQETN-4952 :- using an action to identify who is calling the endpoint appAccounts.json
    workItemId : null,

    attrGrid : Ext.create('SailPoint.grid.PropertyGrid', {
        id : 'attributes',
        title : "#{msgs.tab_identity_attrs}",
        url : SailPoint.getRelativeUrl('/manage/correlation/identityAttributes.json'),
        viewConfig: {
            enableTextSelection: true
        }
    }),

    accountGrid : Ext.create('SailPoint.grid.PagingGrid', {
        id : 'accounts',
        title : "#{msgs.tab_identity_accounts}",
        url : SailPoint.getRelativeUrl('/manage/correlation/appAccounts.json'),
        viewConfig : {
            stripeRows : true,
            enableTextSelection: true
        },
        model : 'SailPoint.model.Empty',
        gridMetaData: {
            fields : ["displayName","application-name","lastRefresh"],
            columns : [
               {
                   name : "displayName",
                   dataIndex : "displayName",
                   flex: 1,
                   header : "#{msgs.link_account_id}",
                   sortable : true
               },
               {
                   name : "application-name",
                   dataIndex : "application-name",
                   flex: 2,
                   header : "#{msgs.application}",
                   sortable : true
               },
               {
                   name : "lastRefresh",
                   dataIndex : "lastRefresh",
                   flex: 1,
                   header : "#{msgs.last_refresh}",
                   sortable : true
               }
            ]
        }
    }),

    tabPanel : null,

    initComponent : function() {

        this.tabPanel = Ext.create("Ext.tab.Panel", {
            activeTab:0,
            items:[this.attrGrid, this.accountGrid]
        });

        this.accountGrid.store.getProxy().extraParams = {limit:20, start:0};

        this.accountGrid.on('show',
            function(){
                if (this.identityId != this.accountGrid.store.getProxy().extraParams.id){
                    //IIQETN-4952 :- sending the action as parameter.
                    if (this.action === 'WORK_ITEM') {
                        this.accountGrid.store.getProxy().extraParams = {'q_identity-id':this.identityId, limit:20, 'workItemId':this.workItemId, 'action':this.action};
                    } else {
                        this.accountGrid.store.getProxy().extraParams = {'q_identity-id':this.identityId, limit:20, 'action':this.action};
                    }
                    this.accountGrid.store.load();
                }
            }, this
        );

        this.on('show', function(win, opts) {
            if(win) {
                win.centerDialog();
            }
        })
        
        var popup = this;
       
        Ext.apply(this,{
            width:480,
            height: 400,
            autoScroll: true,
            closeAction:'hide',
            plain: true,
            title:"#{msgs.title_identity_info_dialog}",
            items:[
                this.tabPanel
            ],
            buttons:[
                {text:'#{msgs.button_close}', cls : 'secondaryBtn', handler:SailPoint.IdentityDetailPopup.hide}
            ]
        });
        
        this.callParent(arguments);
    },

    centerDialog : function() {
        var size = this.getSize(),
            bva = SailPoint.getBrowserViewArea();
        this.setPosition(bva.width / 2 - size.width / 2, bva.height / 2 - size.height / 2);
    },
    
    statics : {
        /**
        * Global instance of the popup
        * @private
        */
        instance : null,
        
        /**
        * Gets the global instance, or creates a new one if none exists.
        */
        getInstance : function(){
            if (!this.instance)
                this.instance = Ext.create('SailPoint.IdentityDetailPopup', {});
            return this.instance;
        },
        
        /**
        * Hides global popup instance
        */
        hide : function(){
            SailPoint.IdentityDetailPopup.getInstance().hide() ;
        },
        
        /**
        * @param {String} objId The ID of the identity to display.
        */
        show : function(identityId) {
            try{
                this.getInstance().action = 'CORRELATION'; //IIQETN-4952 :- CORRELATION action
                this.getInstance().tabPanel.setActiveTab('attributes');
                this.getInstance().identityId = identityId;
                this.getInstance().attrGrid.url = SailPoint.getRelativeUrl('/manage/correlation/identityAttributes.json');
                this.getInstance().attrGrid.load({id:identityId, window:this, callback:SailPoint.IdentityDetailPopup.centerCallback});
                this.getInstance().show();
            }
            catch(err){
                alert(err);
            }
        },
        //I do believe that this method is deprecated in 7.2 and newest versions
        showForLcmRequest : function(identityId, identityName, action) {
            try {
                this.getInstance().action = action; //IIQETN-4952 :- LCM action
                this.getInstance().tabPanel.setActiveTab('attributes');
                this.getInstance().identityId = identityId;
                this.getInstance().attrGrid.url = SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(identityId) + '/lcmDetails');
                this.getInstance().attrGrid.load({id:identityId, window:this, callback:SailPoint.IdentityDetailPopup.centerCallback});
                this.getInstance().show();
            } 
            catch (err) {
                alert(err);
            }
        },
        
        showForWorkItem : function(identityId, identityName, workItemId) {
            try {
                this.getInstance().action = 'WORK_ITEM'; //IIQETN-4952 :- WORK_ITEM action
                this.getInstance().workItemId = workItemId;
                this.getInstance().tabPanel.setActiveTab('attributes');
                this.getInstance().identityId = identityId;
                this.getInstance().attrGrid.url = SailPoint.getRelativeUrl('/rest/identities/' + SailPoint.Utils.encodeRestUriComponent(identityId) + '/workItemDetails/' + workItemId);
                this.getInstance().attrGrid.load({id:identityId, window:this, callback:SailPoint.IdentityDetailPopup.centerCallback});
                this.getInstance().show();
            } 
            catch (err) {
                alert(err);
            }
        },

        centerCallback : function(c, r, o, e){
            if(o && o.params && o.params.window) {
                o.params.window.getInstance().centerDialog();
            }
        },

        /**
        * Template used to generate the popup links in the name column of the grid.
        */
        LinkTemplate : new Ext.Template(
            '<a onclick="SailPoint.IdentityDetailPopup.show(\'{id}\');" style="text-decoration: underline">{name:htmlEncode}</a>'
        ),
        
        /**
         * Used in the identityGrid to create a popup link on the name property. Passed in
         * as a part of the column config. Check ManualCorrelationIdentityBean.java.
        */
        renderIdentityDetailGrid : function (val, meta, record, row, col, store) {
            return SailPoint.IdentityDetailPopup.LinkTemplate.apply({id:record.getId(), name:val});
        }
    }//end statics
});
