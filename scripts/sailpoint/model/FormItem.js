/* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * @class SailPoint.model.FormItem
 * @extends Ext.data.Model
 * This class provides a model for Form Item objects.
 */
Ext.define('SailPoint.model.FormItem', {
    extend: 'Ext.data.Model',
    fields: [
        {name:'text', type:'string'},
        {name: 'formItemType', type:'string'},
        {name: 'properties', type:'auto'}
    ]
});