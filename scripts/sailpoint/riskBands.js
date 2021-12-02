/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

// determines which colors to use based on the number of user-defined bands
var colorBands = [],
    // determines which colors to use based on the number of bands
    colorList  = [
    ['low', 'high'],
    ['low', 'medium', 'high'],
    ['low', 'medium_low', 'medium_high', 'high'],
    ['low', 'medium_low', 'medium', 'medium_high', 'high'],
    ['lowest', 'low', 'medium_low', 'medium_high', 'high', 'highest']
];

Ext.define('SailPoint.model.Color', {
    extend : 'Ext.data.Model',
    fields : [{name: 'upper', type: 'int'}, 
              {name: 'lower', type: 'int'}, 
              {name: 'color', type: 'string'}, 
              {name: 'enabled', type: 'boolean'}]
});

/**
 * @class SailPoint.Risk.ColorStore
 * @extends Ext.data.Store
 * This class aids in determining which color goes with which risk band so that proper
 * indicators can be displayed for scores
 */
Ext.define('SailPoint.Risk.ColorStore', {
	extend : 'Ext.data.Store',
    remoteSort: true,
    model : 'SailPoint.model.Color',
    proxy : {
        type : 'ajax',
        url: 'bandConfigJSON.json',
        reader : {
            type : 'json',
            root : 'colorBands',
            totalProperty : 'numColors'
        }
    },

    listeners: {
        load: function(store, records, success) {
            Ext.each(records, function(rec) {
              var bandEnabled = rec.data.enabled;
              // this check is to remove any extra padded 
              // bands (which is done in BandConfigBean-getBands())
              //
              if (bandEnabled) {
                  colorBands.push(rec.data);
              }
            });
          }
      },

    /**
     * @param {int} The risk score whose indicator color we need to find
     * {string} The color of the indicator corresponding to the specified score
     */
    getColorForScore: function(score) {
        
        function colorFinder(record, id) {
            var ret = record.data.lower <= score && record.data.upper >= score;
            return ret;
        }

        var recordIndex = this.findBy(colorFinder);
        var bands = colorList[colorBands.length - 2];
        return bands[recordIndex];
    },
    
    getImageUrlForScore: function(score) {
        var color = this.getColorForScore(score);
        var imageBase = SailPoint.getRelativeUrl('/images/icons/risk_indicator_');
        var imageFormat = '.png';
        var image = imageBase + color + imageFormat;
        return image;
    }
});

Ext.define('SailPoint.Risk.NeutralColorStore', {
    extend : 'SailPoint.Risk.ColorStore',
    model : 'SailPoint.model.Color',
    data : [
            {id: 1, lower: 0, upper: 333, color: 'white', enabled: true},
            {id: 2, lower: 334, upper: 666, color: 'light_blue', enabled: true},
            {id: 3, lower: 667, upper: 1000, color: 'blue', enabled: true}
            ],
    initComponent: function() {
        SailPoint.Risk.NeutralColorStore.superclass.initComponent.apply(this, arguments);
        this.callParent(arguments);
    }
});