/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.grid.TreeGridPanel
 * @extends Ext.tree.Panel
 * This class wraps together a number of standard features needed for Tree Panel.
 */
Ext.define('SailPoint.grid.TreeGridPanel', {
    extend: 'Ext.tree.Panel',
    alias : 'widget.treegridpanel',

    initComponent: function() {
        this.callParent(arguments);
    }

});