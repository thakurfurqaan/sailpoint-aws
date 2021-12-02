/* (c) Copyright 2017 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Container used in the multi factor authentication configuration page.  This container
 * will hold a list of SailPoint.systemSetup.mfaconfig.MFAConfig components that will
 * display and collect multi factor authentication configuration information.
 */
Ext.define('SailPoint.systemSetup.mfaconfig.MFAContainer', {
    extend : 'Ext.container.Container',

    config : null,
    configComponents : [],
    configField : null,
    mfaPopulationsLabel: null,
    mfaPopulationsHelp: null,
    mfaAddWorkflows: null,

    initComponent : function() {
        var mfaConfigObject = Ext.JSON.decode(this.config);
        this.callParent(arguments);

        if(mfaConfigObject.length == 0) {
            this.add(Ext.create('Ext.form.Label', {
                text: this.mfaAddWorkflows,
                id: 'mfa_add_workflows'
            }))
        }

        for (i = 0; i < mfaConfigObject.length; i++) {
            var thisConfig = mfaConfigObject[i];
            this.configComponents.push(Ext.create(
                    'SailPoint.systemSetup.mfaconfig.MFAConfig', {
                        mfaConfigObject : thisConfig,
                        padding: 20,
                        mfaPopulationsLabel: Ext.String.format('#{msgs.mfa_populations}', SailPoint.Utils.escapeForXss(thisConfig.workflowName)),
                        mfaPopulationsHelp: this.mfaPopulationsHelp,
                        mfaConfigIndex: i
                    }));
        }
        this.add(this.configComponents);
    },

    afterLayout : function() {
        this.suspendLayout = true;
        for (i = 0; i < this.configComponents.length; i++) {
            this.configComponents[i].doLayout();
        }
        SailPoint.SystemSetup.Login.updateLoginPanel();
        this.suspendLayout = false;
    },

    prepareToPersist : function() {
        var newConfigs = [],
            hiddenConfigFieldCmp = Ext.getDom(this.configField);
        
        for (i = 0; i < this.configComponents.length; i++) {
            this.configComponents[i].prepareToPersist();
            newConfigs.push(this.configComponents[i].mfaConfigObject);
        }

        if (hiddenConfigFieldCmp) {
            hiddenConfigFieldCmp.value = Ext.JSON.encode(newConfigs);
        }
    }
});