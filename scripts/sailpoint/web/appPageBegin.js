/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */


Ext.onReady(function() {
  // start the session timeout monitoring process on the current window
  SailPoint.resetTimeout();
});

/** Refresh timeout whenever an ajax request is made. This ensures
 *  that ajaxy pages with no transitions don't timeout . Event is buffered
 *  so it fires at most once every 5 secs.  Session timeout reset is
 *  skipped if URL is polling. To skip, call SailPoint.addPollingUrl before any request.
 */
function checkResetTimeout(scope, request, response) {
    var url = response.url,
        queryParamIndex = url.indexOf("?");

    // Remove query params from the URL
    if (queryParamIndex > 0) {
        url = url.substring(0, queryParamIndex);
    }

    if (!SailPoint.isPollingUrl(url)) {
        SailPoint.resetTimeout();
    }
}

Ext.Ajax.on('requestcomplete', checkResetTimeout, this, {
    buffer: 5000
});

// Set the XSRF token in every request header.
// Note: some Ajax components like Ext.data.Connection won't pick up defaultHeaders automatically, so you have
// to set them manually.
Ext.Ajax.defaultHeaders = {
    'X-XSRF-TOKEN' : Ext.util.Cookies.get('CSRF-TOKEN')
};

function doLogout() {
  try {
    populateHeaderFormId();
    document.getElementById("headerForm:logoutButton").click();
  } catch(e) {}
}

function populateHeaderFormId() {
    // Try to copy the current object's ID in the headerForm
    var editFormId = Ext.getDom('editForm:id');
    var headerFormId = Ext.getDom('headerForm:id');
    if (null != editFormId && null != headerFormId) {
        headerFormId.value = editFormId.value;
    }
}

/**
 * Adding a screen reader only message to the dom if the user is about to be timed out
 */
function addEarlyWarningMsg() {
    if(!SailPoint.getTimeoutLock()) {
        Ext.Msg.show(
            {title: "#{msgs.session_pre_expiration_title}",
                msg: "#{msgs.session_pre_expiration_msg}",
                buttons: Ext.Msg.OKCANCEL,
                fn: function(button) {
                    if(button === 'ok') {
                        Ext.Ajax.request({
                            url: CONTEXT_PATH + '/rest/ping',
                            success: function() {
                                SailPoint.resetTimeout();
                            }
                        })
                    }
                },
                icon: Ext.MessageBox.WARNING
            });
    } else {
        SailPoint.resetTimeout();
    }
}

function showTimeoutMsg() {
  if(!SailPoint.getTimeoutLock()) {
      // Send a request to our fake 'checkSession' url, which will invalidate the session if needed.
      Ext.Ajax.request({
          url: CONTEXT_PATH + '/rest/checkSession',
          failure: function() {
              // Failure means that we invalidated the session, so go ahead
              // and kill the notification polling
              if (SailPoint.NotificationMenuItem) {
                  SailPoint.NotificationMenuItem.cancelNotification();
              }
          }
      });

    Ext.Msg.show(
      {title: "#{msgs.session_expiration_title}",
       msg: "#{msgs.session_expiration_msg}",
       buttons: Ext.Msg.OK,
       buttonText: {
           /** Override the ok button text **/
           ok: '#{msgs.button_login}'  
       },
       fn: function(win) {
             // Try to copy the current object's ID in the logoutForm
             // so this will get posted with the preLoginUrl.  This
             // helps us go back to the correct page after an auto-logout.
             var editFormId = Ext.getDom('editForm:id');
             if (null != editFormId) {
                 Ext.getDom('sessionTimeoutForm:id').value = editFormId.value;
             }

             /*
              * bug29141: At this point the session monitoring
              * process already timed out so we need to call
              * loginBean.checkSession method to make sure that
              * we don't have a session alive and logout the user.
              *
              * So we are unbinding Decider.warnUnsaved from the
              * 'onbeforeunload' to prevent getting the "stay or leave"
              * dialog, which would allow us to move to another page and
              * refresh the session timeout.
              */
             window.onbeforeunload = undefined;

             Ext.getDom('sessionTimeoutForm:checkSessionBtn').click();

             return true;
           },
        icon: Ext.MessageBox.ERROR
      });

  } else {
    SailPoint.resetTimeout();
  }
}

if (Ext.isIE8) {
    if(document.createStyleSheet) {
        document.createStyleSheet(CONTEXT_PATH+'/css/ie8.css');
    }
}

if (Ext.isIE9) {
    if(document.createStyleSheet) {
        document.createStyleSheet(CONTEXT_PATH+'/css/ie9.css');
    }
}

// If IE10 on desktop, add extra class to top element
// msMaxTouchPoints is IE10, maxTouchPoints is IE11+
if (navigator.msMaxTouchPoints === 0 || navigator.maxTouchPoints === 0) {
    document.documentElement.classList.add("ie10-desktop");
}
