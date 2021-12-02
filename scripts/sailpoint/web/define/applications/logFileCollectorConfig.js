/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint', 'SailPoint.LogFileCollectorConfig');

SailPoint.LogFileCollectorConfig.init = function() {
    // Fill in the lines to skip field with a default if none existed
    var linesToSkipInput = Ext.getDom('editForm:linesToSkip');
    if (linesToSkipInput) { 
        var linesToSkip = linesToSkipInput.value;
        if (linesToSkip == '') {
            linesToSkipInput.value = '0';
        }
    }
    
    if (Ext.get('transportSettingsContent')) {
        // displayAppropriatePane comes from menu.js
        displayAppropriatePane('transportSettingsContent', 'button0');
    }
};

SailPoint.LogFileCollectorConfig.updateTransportSettings = function() {
    Ext.getDom('editForm:updateTransportSettings').click();
};

Ext.onReady(SailPoint.LogFileCollectorConfig.init);
