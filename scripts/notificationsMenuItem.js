// Handle submenu and new notification badge for menu item manually. 
// Should be included at the end of notificationsMenuItem.xhtml
SailPoint.ns('SailPoint.NotificationMenuItem');

/**
 * Handle navigation to work item page with correct type filter based on passed in work item type
 * @param {String} menuItemName Name of the NotificationsMenuItem
 */
SailPoint.NotificationMenuItem.navigateToWorkItems = function(menuItemName) {
    jQuery('#notificationMenuItemForm\\:menuItemName').val(menuItemName);
    jQuery('#notificationMenuItemForm\\:goToWorkItemsBtn').click();
};

/**
 * Holds the ID for the timeout used for notification count polling
 */
SailPoint.NotificationMenuItem.TimeoutId = undefined;

/**
 * Cancel the notification count polling
 */
SailPoint.NotificationMenuItem.cancelNotification = function() {
    if (SailPoint.NotificationMenuItem.TimeoutId) {
        clearTimeout(SailPoint.NotificationMenuItem.TimeoutId);
    }
};

Ext.onReady(function() {
    var NEW_ITEM_COUNT_URL = SailPoint.getRelativeUrl('/rest/workItemNotifications/count'),
        TYPES_COUNT_URL = SailPoint.getRelativeUrl('/rest/workItemNotifications'),
        lastCheckedTimeElement = jQuery('#notificationMenuItemForm\\:lastCheckedTime'),
        lastResetTimeElement = jQuery('#notificationMenuItemForm\\:lastResetTime'),
        newItemCountElement = jQuery('#notificationMenuItemForm\\:newItemCount');

    /**
     * Update the value and class of the new notification badge
     * @param {Integer} newValue Number of new notifications
     */
    function updateNewItemBadge(newValue) {
        var notificationBadge = jQuery('#notificationMenuNewItemBadge'),
            notificationLink = jQuery('#notificationMenuItemLink'),
            badgeClass = 'notification-badge',
            badgeText = '';

        if (newValue) {
            if (newValue > 0 && newValue < 10) {
                badgeClass += '-single';
                badgeText = newValue.toString();
            } else if (newValue < 100) {
                badgeClass += '-double';
                badgeText = newValue.toString();
            } else {
                badgeClass += '-triple';
                badgeText = '99+';
            }

            notificationLink.removeClass('notification-badge-single notification-badge-double notification-badge-triple').
                addClass(badgeClass);
        }

        if (badgeText !== '' && badgeText !== notificationBadge.text()) {
            jQuery('#notificationMenuItemAlert').text(
                Ext.String.format('\'' + jQuery('#notificationMenuNewItemMessageFormat').val() + '\'', badgeText));
        }

        notificationBadge.text(badgeText);
    }

    /**
     * Update a value in the JSF bean
     * @param {jQuery} jQuery element to update
     * @param {Object} newValue Value to set in element.
     */
    function updateValue(element, newValue) {
        element.val(newValue);
    }

    /**
     * Get the last checked time for new notifications
     */
    function getLastCheckedTime() {
        return lastCheckedTimeElement.val() || 0;
    }

    /**
     * Set the last checked time
     */
    function setLastCheckedTime(lastCheckedTime) {
        updateValue(lastCheckedTimeElement, lastCheckedTime || 0);
    }

    /**
     * Get the new item count from the session
     */
    function getNewItemCount() {
        return parseInt(newItemCountElement.val()) || 0;
    }

    /**
     * Set the new item count and update badge
     */
    function setNewItemCount(newItemCount) {
        updateValue(newItemCountElement, newItemCount || 0);
        updateNewItemBadge(newItemCount);
    }

    /**
     * Get the interval between checks for new items
     */
    function getInterval() {
        return jQuery('#workItemNotificationsInterval').val() * 1000;
    }

    /**
     * Refresh the new items by calling REST. This will update new item count when complete and start new interval.
     */
    function refreshNewItemCount() {
        var url = NEW_ITEM_COUNT_URL;
        setLastCheckedTime((new Date()).getTime());
        Ext.Ajax.request({
            url: url,
            success: function(response) {
                setNewItemCount(parseInt(response.responseText));
                SailPoint.NotificationMenuItem.TimeoutId = setTimeout(refreshNewItemCount, getInterval());
            }
        });
    }

    /**
     * Start the new item check cycle based on session values.
     */
    function startNotification() {
        var lastCheckedTime = getLastCheckedTime(),
            currentInterval = 0, timeToNextCheck = 0;

        updateNewItemBadge(getNewItemCount());

        if (lastCheckedTime > 0) {
            currentInterval = (new Date()).getTime() - lastCheckedTime;
            if (currentInterval < getInterval()) {
                timeToNextCheck = currentInterval;
            }
        }

        SailPoint.NotificationMenuItem.TimeoutId = setTimeout(refreshNewItemCount, timeToNextCheck);
    }

    // When submenu is opened, call backend REST endpoint to get counts of work item types and update submenu
    jQuery('#notificationMenuItem').on('show.bs.dropdown', function() {
        setNewItemCount(0);

        Ext.Ajax.request({
            url: TYPES_COUNT_URL,
            success: function(response) {
                var workItemCounts = JSON.parse(response.responseText),
                    type;
                for (type in workItemCounts) {
                    if (workItemCounts.hasOwnProperty(type)) {
                        jQuery('#subMenuItem' + type).text(workItemCounts[type] || 0);
                    }
                }
            }
        });
    });

    SailPoint.addPollingUrl(NEW_ITEM_COUNT_URL);

    startNotification();
});