/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */

//IMPORTANT: This relies on moment.js and moment-timezone-with-data.js.
/* globals moment */

//Define the TimeZone namespace if it doesn't exist.
SailPoint.TimeZone = SailPoint.TimeZone || {

    /**
     * Cache the timezone id after first load so we dont have to keep re-guessing.
     */
    TimeZoneId: undefined,

    /**
     * Use moment-timezone.js to guess the timezone and post it to the element in the form to
     * initialize it on the backend
     * @param {String} formName Name of the form containing the element for the time zone id.
     */
    getTimeZone: function(formName) {
        document.getElementById(formName + ':initialTimeZoneId').value = SailPoint.TimeZone.getTimeZoneId();
    },

    /**
     * Get the timezone ID for the logged in user. Uses moment-timezone.js to guess the timezone.
     * @return {String} ID for the timezone
     */
    getTimeZoneId: function() {
        if (!SailPoint.TimeZone.TimeZoneId) {
            // Store this so we don't have to re-guess every time.
            SailPoint.TimeZone.TimeZoneId = moment.tz.guess();
        }

        return SailPoint.TimeZone.TimeZoneId;
    },

    /**
     * Get the "correct" date for a given date, adjusting the timestamp for the offset based on the
     * historical DST rules for the date in question.
     * @param {Date} date The date to check
     * @return {Date|undefined} New date object with the corrected timestamp, or undefined if the date is not defined.
     */
    getDate: function(date) {
        if (!date) {
            return date;
        }

        return moment.tz({
            year: date.getFullYear(),
            month: date.getMonth(),
            date: date.getDate(),
            hours: date.getHours(),
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            milliseconds: date.getMilliseconds()
        }, SailPoint.TimeZone.getTimeZoneId()).toDate();
    },

    /**
     * Gets the timezone format string for the given date for the users timezone, based on historical DST rules.
     * The returned string is in the format '+500' or '-430'.
     * @param {Date} date The date to check, either Date object, milliseconds of time, or format string
     * @return {String|undefined} The timezone format string for the date, or undefined if date is not defined
     */
    getTimeZoneFormat: function(date) {
        if (!date) {
            return undefined;
        }

        // Check that the date is valid, if not then there is no valid timezone either
        var realMoment = moment(date);
        if (!realMoment.isValid()) {
            return undefined;
        }

        // 'ZZ' format returns the string in something like '+500' which indicates 5 hours after GMT
        return moment.tz(date, SailPoint.TimeZone.getTimeZoneId()).format('ZZ');
    }
};
