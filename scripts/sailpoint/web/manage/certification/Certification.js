/* (c) Copyright 2010 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Certification');

/**
 * Encode the grid state into the form for the grid currently being displayed on
 * the certification page.
 */
SailPoint.Manage.Certification.encodeGridState = function() {
    var grid = SailPoint.Manage.Certification.getGrid();
    if (grid && grid.gridState) {
        grid.gridState.encodeGridState('editForm:');
    }
};

/**
 * Return the grid component currently being displayed on the certification
 * page.
 */
SailPoint.Manage.Certification.getGrid = function() {

    // Identity worksheet view.
    var grid = null;
    
    if (typeof SailPoint.IdentityItemsGrid !== 'undefined') {
        grid = Ext.getCmp(SailPoint.IdentityItemsGrid.GridID);
    }

    if (!grid) {
        // Identity and role membership entity list
        grid = Ext.getCmp('certEntityListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certBusinessRoleMembershipListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certBusinessRoleCompositionListGridState');
    }
    if (!grid) {
        grid = Ext.getCmp('certAccountGroupListGridState');
    }

    return grid;
};

SailPoint.Manage.Certification.savedErrors = null;

/**
 * An a4j refresh can cause the JSF error messages to go away.  This function
 * can be called from an a4j commandButtons onclick to save the errors before a
 * refresh.  The oncomplete can call restoreErrors() to make these stick around.
 */
SailPoint.Manage.Certification.saveErrors = function() {
    SailPoint.Manage.Certification.savedErrors = Ext.getDom('errorPanel').innerHTML;
};

/**
 * See saveErrors() for how this is used.
 */
SailPoint.Manage.Certification.restoreErrors = function() {
    if (SailPoint.Manage.Certification.savedErrors) {
        Ext.getDom('errorPanel').innerHTML = SailPoint.Manage.Certification.savedErrors;
    }
};

/**
 * When a bulk action is called and a pop-up is provided (namely, the reassign bulk action)
 * in a cert, certificationFilters.xhtml resetBtn.click is called and then
 * certification.xhtml rerenderSummaryBtn.click is called.  This can cause problems with user error
 * logging, causing some user messages not to show.  The reason for this is that rerenderSummaryBtn
 * uses SailPoint.Manage.Certification.saveErrors, which evaluates Ext.getDom('errorPanel').innerHTML, but if
 * restBtn (running asynchronously) has not completed yet, the errorPanel won't have rendered.
 * 
 * This method ensures that we are running resetBtn completely before rerenderSummaryBtn.
 */
SailPoint.Manage.Certification.resetBtnOnComplete = function() {
    if (SailPoint.Manage.Certification.tempResetBtnOnComplete)
        SailPoint.Manage.Certification.tempResetBtnOnComplete();
};

/**
 * Show the spinner in the given div.  We used to show the spinner over
 * one of the bulk certify buttons, but those can be disabled. So this
 * is intended to be used on whichever button is being pressed, since if
 * you can press the button, then it is visible.  It also makes more
 * sense from a user point of view.  Always show the spinner over the
 * button you pressed.
 */
SailPoint.Manage.Certification.showSpinner = function(div) {
    CertificationLoadingSpinner.display(div);
}


SailPoint.Manage.Certification.addEntitlementComment = function(certItemId, successFunc) {
    SailPoint.showAddCommentDlg(function(btn, text) {
        if (btn == 'ok'){
            var url = SailPoint.getRelativeUrl('/rest/certItem/'+certItemId+'/entitlementComment');
            Ext.Ajax.request({
                url: url,
                success: successFunc,
                failure: function(){
                    SailPoint.EXCEPTION_ALERT('Comment request failed');
                },
                params: {'comments':text}
            });
        }
    });
}
