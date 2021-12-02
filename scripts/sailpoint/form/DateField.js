/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DateField', {
	extend : 'Ext.form.field.Date',
	alias : 'widget.spdate',

    invalidText: "#{msgs.error_invalid_date_input}",
    
    constructor: function(config) {

        /**
         * We pass around long times but the components want Date values
         * @param config the config object to do the translation
         * @param key the name of the property to translate
         */
        function translateDate(config, key) {
            if (config[key] && config[key] !== '') {
                config[key] = new Date(config[key]);
            }
        }

        translateDate(config, 'value');
        translateDate(config, 'minValue');
        translateDate(config, 'maxValue');

        config.format = SailPoint.DateFormat;
        this.callParent(arguments);
    },

    getSPFormValue: function() {
        var dtVal = '';

        if (this.value && this.value !== this.emptyText) {
            var dt = new Date(SailPoint.form.DateField.superclass.getValue.call(this));
            if (dt && (this.endDate === true || this.endDate === 'true')) {
                // If this is an endDate in a date range, advance the date to
                // the last millisec of the day
                dt.setHours(23);
                dt.setMinutes(59);
                dt.setSeconds(59);
                dt.setMilliseconds(999);
            }

            // Use SailPoint.TimeZone to fix the offset if needed for historical dates.
            dtVal = SailPoint.TimeZone.getDate(dt).getTime();
        }

        return dtVal;
    }

});