/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/* Any file that makes use of the expandingPanel.xhtml template needs to include this. */
Ext.ns('SailPoint');

SailPoint.expanderLock = false;

SailPoint.initExpanders = function(formName) {
    var expandPanels = Ext.DomQuery.select('div[class*=baseWindow expandPanel]'),
        expandPanel,
        expandContent,
        expandButton,
        i;
    
    // Sometimes it's in a <ui:fragment> that wasn't rendered and other times there are multiples
    if (expandPanels && expandPanels.length > 0) {
        for (i = 0; i < expandPanels.length; ++i) {
            expandPanel = expandPanels[i];
            expandContent = Ext.get(Ext.DomQuery.selectNode('div[class*=expandPanelBody]', expandPanel));
            expandButton = Ext.DomQuery.selectNode('img[class=dashContentExpandBtn]', expandPanel);
            if (expandButton && expandContent) {
                expandContent.setVisibilityMode(Ext.Element.DISPLAY);
                SailPoint.initExpander(Ext.getDom(expandButton), expandContent);
            }
        }
    }
};

SailPoint.initExpander = function(expandButton, expandContent) {
    Ext.get(expandButton).on('click',
        function(e) {
            if (!SailPoint.expanderLock) {
                SailPoint.lockExpander();

                // Check if the content is visible prior to starting the blind effect.
                if (expandContent.isVisible()) {
                    expandContent.slideOut();
                    expandButton.src = CONTEXT_PATH + "/images/icons/minus.png";
                }
                else {
                    expandContent.slideIn();
                    expandButton.src = CONTEXT_PATH + "/images/icons/plus.png";
                }

                setTimeout(SailPoint.unlockExpander, 500);
            }
        },
        false
    );
};

SailPoint.lockExpander = function() {
    SailPoint.expanderLock = true;
};

SailPoint.unlockExpander = function() {
    SailPoint.expanderLock = false;
};
