/* (c) Copyright 2009 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.EmailWindow');

/**
 * Open a window to send an email to a user.
 * 
 * @param {String} id        The ID of the Identity who will be the recipient.
 * @param {String} template  The name of the system configuration key of the
 *                           email template to send.
 * @param {String} objectId  (optional) The ID of the object being used for the
 *                            email.
 */
SailPoint.EmailWindow.open = function(id, template, objectId, disableSuggest) {
   var windowUrl =CONTEXT_PATH + "/emailPanel.jsf?recipientId=" + id + "&template="+template + "&objectId=" + objectId + "&disableSuggest="+disableSuggest;

   SailPoint.confirm({url: windowUrl},
    {windowParameters: {title: '#{msgs.dialog_title_send_email}',
                        width:750},
     okLabel: '#{msgs.button_send}',
     cancelLabel: '#{msgs.button_cancel}',
     ok:function(win) {
       Ext.getDom('emailPanelForm:sendEmailBtn').click();
       /* bug24255 checking if subject and message content was provided
        * to avoid NPE when server code is triggered. If content was provided
        * we close the window, must be closed here because only the opener
        * is able to close it.
        */
       if (Ext.getDom('emailPanelForm:subject').value.length && Ext.getDom('emailPanelForm:body').value.length) {
         win.close();
       }
       return true;
     }
    }
   );
}
