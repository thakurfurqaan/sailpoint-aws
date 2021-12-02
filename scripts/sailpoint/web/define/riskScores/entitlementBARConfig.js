/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This page contains the logic that controls the entitlement BAR configuration panels
 */
var entitlementConfigDivs = [];

var EntitlementAttributesPage = {
    isSubmitFromButton: false,
    saveButton: 'editForm:stealthSaveButton',
    cancelButton: 'editForm:stealthCancelButton',
    addButton: 'editForm:attributes:stealthAddAttributesButton',
    deleteButton: 'editForm:attributes:stealthDeleteAttributesButton',
    deleteMsg: '#{msgs.confirm_delete_attributes}',
    deleteLabel: '#{msgs.delete_attributes}',



    existingSubmitFn: function(){},

    submitFn: function() {
        return EntitlementsPage.confirmSubmit(EntitlementAttributesPage);
    },

    combinedSubmitFn: function() {
        if (EntitlementAttributesPage.submitFn()) {
            return EntitlementAttributesPage.existingSubmitFn();
        } else {
            return false;
        }
    },


    initPage: function() {
        EntitlementAttributesPage.existingSubmitFn = Ext.get('editForm').onsubmit;

        if (EntitlementAttributesPage.existingSubmitFn) {
            Ext.get('editForm').on('submit', EntitlementAttributesPage.combinedSubmitFn);
        } else {
            Ext.get('editForm').on('submit', EntitlementAttributesPage.submitFn);
        }
    }
};

var EntitlementPermissionsPage = {
    isSubmitFromButton: false,
    saveButton: 'editForm:stealthSaveButton',
    cancelButton: 'editForm:stealthCancelButton',

    existingSubmitFn: function(){},

    submitFn: function() {
        return EntitlementsPage.confirmSubmit(EntitlementPermissionsPage);
    },

    combinedSubmitFn: function() {
        if (EntitlementPermissionsPage.submitFn()) {
            return EntitlementPermissionsPage.existingSubmitFn();
        } else {
            return false;
        }
    },


    initPage: function() {
        EntitlementPermissionsPage.existingSubmitFn = Ext.get('editForm').onsubmit;

        if (EntitlementPermissionsPage.existingSubmitFn) {
            Ext.get('editForm').on('submit', EntitlementPermissionsPage.combinedSubmitFn);
        } else {
            Ext.get('editForm').on('submit', EntitlementPermissionsPage.submitFn);
        }
    }
};

var EntitlementsPage = {
    isSubmitFromButton: false,
    saveButton: 'editForm:stealthSaveButton',
    cancelButton: 'editForm:stealthCancelButton',

    confirmCancel: function(page) {
        if (!page) {
            page = EntitlementsPage;
        }

        // Ideally this is what we want, but the dialog doesn't work that way right now.
        // Since the dialogs are currently disabled on this page anyways, disregard it for now
        // page.isSubmitFromButton = confirmCancel(false, page.cancelButton);
        page.isSubmitFromButton = true;
        Ext.getDom(page.cancelButton).click();
    },

    confirmSave: function(page) {
        if (!page) {
            page = EntitlementsPage;
        }

        // Ideally this is what we want, but the dialog doesn't work that way right now.
        // Since the dialogs are currently disabled on this page anyways, disregard it for now
        // page.isSubmitFromButton = confirmSave(false, page.saveButton);
        page.isSubmitFromButton = true;
        Ext.getDom(page.saveButton).click();
    },

    confirmAdd: function(page) {
        if (!page) {
            page = EntitlementsPage;
        }

        page.isSubmitFromButton = true;
        Ext.getDom(page.addButton).click();
    },

    confirmDelete: function(page) {
        if (!page) {
            page = EntitlementsPage;
        }

        // Ideally this is what we want, but the dialog doesn't work that way right now.
        // Since the dialogs are currently disabled on this page anyways, disregard it for now
        // page.isSubmitFromButton = confirmDelete(page.deleteMsg, page.deleteLabel, page.deleteButton);
        page.isSubmitFromButton = true;
        Ext.getDom(page.deleteButton).click();
    },

    // This function prevents form submissions that aren't initiated by physically pressing the buttons.
    // This allows users to hit the enter key after setting slider values without accidentally submitting
    // the form.
    confirmSubmit: function(page) {
        if (!page) {
            page = EntitlementsPage;
        }

        return page.isSubmitFromButton;
    }
};

function addEntitlementConfigPanel(panelDiv) {
    entitlementConfigDivs[entitlementConfigDivs.length] = panelDiv;
}

function showEntitlementSubPanel(subPanelId) {
    Ext.get('entitlementsMainPanel').setVisibilityMode(Ext.Element.DISPLAY).hide();
    Ext.fly(subPanelId).slideIn();
}

function closeSubPanel(subPanel, parentPanel) {
    if (!parentPanel) {
        parentPanel = Ext.get('entitlementsMainPanel');
    }

    subPanel.hide();
    Ext.fly(parentPanel).slideIn();
}

function checkAllAttributes(toggleId, newValue) {
    var tableId = getTablePrefixForToggle(toggleId);

    var inputs = Ext.getDom(tableId).getElementsByTagName('input');

    for (var i = 0; i < inputs.length; ++i) {
        if (inputs[i].type == 'checkbox') {
            inputs[i].checked = newValue;
        }
    }
}

function getTablePrefixForToggle(toggleId) {
    var endOfPrefix = toggleId.lastIndexOf(':selectAllToggle');

    return toggleId.substring(0, endOfPrefix);
}
