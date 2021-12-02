/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Manage.Grid.AccessRequests');

SailPoint.Manage.Grid.AccessRequests.adornColumn = function() {
  var roleEls = Ext.query(".adornColumn");
  if (roleEls) {
  // each roleColumn td elem has child hidden input elements
  // that contain the data we need to properly display 
  // the role decorations 
    Ext.each(roleEls, function(elt) {
        var metaData = elt.children;
        var iconType, roleInfo, isGroupAttribute, appName, entName, roleSearchName, roleId;
        var requestId, requestItemId, identityId, assignmentId;
        
        // checking the length here to make sure there is metadata.
        // we might run into a column that has already been adorned.
        if (metaData.length <= 1) {
          return;
        }

        for (var i=0;i<metaData.length;++i) {
          if (metaData[i].getAttribute("id").indexOf("entitlementIcon") > -1) {
            iconType = metaData[i].value + "Icon";
          }
          else if (metaData[i].getAttribute("id").indexOf("entitlementName") > -1) {
            entName = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("roleId") > -1) {
            roleId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("entitlementInfo") > -1) {
            roleInfo = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("isGroupAttribute") > -1) {
            isGroupAttribute = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("appName") > -1) {
            appName = metaData[i].value;
          } 
          else if (metaData[i].getAttribute("id").indexOf("requestId") > -1) {
            requestId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("requestItemId") > -1) {
              requestItemId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("roleSearchName") > -1) {
              roleSearchName = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("assignmentId") > -1) {
            assignmentId = metaData[i].value;
          }
          else if (metaData[i].getAttribute("id").indexOf("identityId") > -1) {
            identityId = metaData[i].value;
          }
        }

        var roleName = (document.all) ? elt.innerText : elt.textContent;
        
        if (roleId && roleId.length > 0) {
          elt.innerHTML = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, \'accessRequestItem\', \'{3}\', \'{4}\', \'{5}\')" title="#{msgs.info_role_composition}">{6}</a>', assignmentId, roleId, identityId, entName, requestId, requestItemId, Ext.String.htmlEncode(roleName));
        }

        if (isGroupAttribute == 'true') {
            if(roleSearchName){
                elt.innerHTML = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(entName) + '\', \'' + encodeURIComponent(roleSearchName) + '\');">' + elt.innerHTML + '</a>';
            }else {
                elt.innerHTML = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(entName) + '\', \'' + encodeURIComponent(roleName) + '\');">' + elt.innerHTML + '</a>';
            }
        }

        if (roleInfo && roleInfo.length > 0)
          elt.innerHTML = SailPoint.component.NameWithTooltip.getTooltipHtml(elt.innerHTML, roleInfo);

        if (iconType != 'Icon' && iconType.length > 0)
          elt.innerHTML = '<div style="padding-left:18px" class="' + iconType + '">' + elt.innerHTML + "</div>";
        else 
          elt.innerHTML = '<div>' + elt.innerHTML + "</div>";

      }
    );
  }

  SailPoint.Manage.Grid.AccessRequests.initQuickTips();
}

SailPoint.Manage.Grid.AccessRequests.initQuickTips = function() {
  // setup tooltips for role description info
  Ext.QuickTips.init();
  Ext.apply(Ext.QuickTips.getQuickTip(),
  {
    showDelay: 1000,
    autoDismiss: false,
    dismissDelay: 0,
    trackMouse: false
  }); 
  
  SailPoint.component.NameWithTooltip.registerTooltips();
}

SailPoint.Manage.Grid.AccessRequests.renderDate = function(value, p, r) {
    var val = SailPoint.Date.getDateStringFromMillis(value, SailPoint.DateTimeFormat); // from Date.js
    if(r.get('signOff')) {
        return '<span id="' + r.get('ownerId') + '-eSigTip">' + val + '<img src="' + SailPoint.CONTEXT_PATH + '/images/icons/esigned-16px.png" style="vertical-align:middle; margin-left:5px;"></span>';
    }
    return val;
};

SailPoint.Manage.Grid.AccessRequests.renderComments = function(value, p, r) {
  if (value.length === 0) {
    return value;
  }

  var i, html = '';
  for (i = 0; i < value.length; ++i) {
    var comment = value[i];

    html += '<div style="white-space: pre-line !important; word-wrap: break-word !important;">';
    html += comment.localizedMessage;
    html += '</div>';
  }

  return html;
};

SailPoint.Manage.Grid.AccessRequests.renderApplication = function(value, p, r) {
  var appInfo = r.data['applicationInfo'];
  if (appInfo && appInfo.length > 0) {
    return SailPoint.component.NameWithTooltip.getTooltipHtml(value, appInfo);
  }
  return value;
};

SailPoint.Manage.Grid.AccessRequests.renderApprovalDetails = function(value, p, r) {
  var result = Ext.String.format("#{msgs.dash_access_req_approvals_cnt}", "1");
  var detailsLink = '';
  var isAuthorized =r.data['authorized'];
  if (value != null && value.length > 0 && isAuthorized===true) {
    detailsLink = Ext.String.format(' <a onclick="SailPoint.Manage.Grid.AccessRequests.viewWorkItem(\'{0}\');">[#{msgs.access_request_approvals_grid_clickdetails}]</a>', value);
  }
  return result + detailsLink;
};

SailPoint.Manage.Grid.AccessRequests.renderEmail = function(value, p, r) {
  /*
   * bug26171 : if we don't have a workitem id, do not render the email reminder link
   * but if workitem archiving is enabled then we would have a workitem id, even though we already completed the workitem
   * in that case we look for a completion date which would tell us it was already completed, so we don't render
   * the email reminder link as no more action is required in that workitem.
   */
  if(r.data['workItemId'] === "" || r.data['workItemId'] !== "" && r.data['completiondate'] !== "") {
    return value;
  }
  var ownerId = r.data['ownerId'];
  var workItemId = r.data['workItemId'];
  var emailLink = Ext.String.format('<a onclick="SailPoint.EmailWindow.open(\'{0}\',\'accessRequestReminderEmailTemplate\',\'{1}\', \'true\');">', ownerId, workItemId);
  var imgTag = '<img title="#{msgs.cert_email_child_cert}" src="' + SailPoint.CONTEXT_PATH + '/images/icons/email.png" style="vertical-align:middle; margin-right:4px;">'
  var result = emailLink + imgTag + value + "</a>";
  return result;
};

SailPoint.Manage.Grid.AccessRequests.renderValue = function(value, p, r) {
  var roleName = r.data['name'];
  if (roleName == null || roleName.length == 0) {
    var nameValue = r.data['nameValue'];
    if (nameValue != null && nameValue.length > 0) {
      return nameValue;
    }
  }
  if (roleName == 'password') {
    value = "****";
  }
  
  if (value == null) {
      value = "";
  }
  
  return roleName + " = " + Ext.String.htmlEncode(value);
};

SailPoint.Manage.Grid.AccessRequests.renderRole = function(value, p, r) {
  var isGroupAttribute = r.data['isGroupAttribute'];
  var appName = r.data['application'];
  var roleInfo = r.data['entitlementInfo'];
  var roleId = r.data['roleId'];
  var roleSearchValue = r.data['value'];
  var roleName = r.data['name'];
  var iconType = r.data['iconType'];
  var requestId = r.raw['requestId'];
  var requestItemId = r.raw['requestItemId'];
  var assignmentId = r.raw['assignmentId'];
  var identityId = r.raw['identityId'];

  if (value == null || value.length == 0) {
    return '';
  }

  var rendered = Ext.String.htmlEncode(value);

  if (roleId && roleId.length > 0) {
    rendered = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(\'{0}\', \'{1}\', \'{2}\', true, \'accessRequestItem\', \'{3}\', \'{4}\', \'{5}\')" title="#{msgs.info_role_composition}">{6}</a>', assignmentId, roleId, identityId, roleName, requestId, requestItemId, rendered);
  }
  else if (isGroupAttribute) {
      if(roleSearchValue){
          rendered = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(roleName) + '\', \'' + encodeURIComponent(roleSearchValue) + '\');">' + Ext.String.htmlEncode(value) + '</a>';
      }else {
          rendered = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(roleName) + '\', \'' + encodeURIComponent(value) + '\');">' + Ext.String.htmlEncode(value) + '</a>';
      }
  }

  var nameWithTooltip = rendered;

  if (roleInfo != null && roleInfo.length != 0) {
    nameWithTooltip = SailPoint.component.NameWithTooltip.getTooltipHtml(rendered, roleInfo);
  }

  if (iconType == null || iconType.length == 0) {
    rendered = '<div>' + nameWithTooltip + "</div>";
  }
  else {
    rendered = '<div style="padding-left:18px" class="' + iconType + 'Icon">' + nameWithTooltip + "</div>";
  }

  return rendered;
};

SailPoint.Manage.Grid.AccessRequests.renderEntitlement = function(value, p, r) {
  var isGroupAttribute = r.data['isGroupAttribute'];
  var appName = r.data['application'];
  var roleInfo = r.data['entitlementInfo'];
  var roleSearchValue = r.data['value'];
  var roleId = r.data['roleId'];
  var roleName = r.data['name'];
  var iconType = r.data['iconType']; 

  if (roleName == 'password') {
    value = '****';
  }

  if (value == null || value.length == 0) {
    return '';
  }

  var rendered = Ext.String.htmlEncode(value);

  if (roleId && roleId.length > 0) {
    rendered = Ext.String.format('<a onclick="SailPoint.RoleDetailPanel.window(null, \'{0}\', null, true)" title="#{msgs.info_role_composition}">{1}</a>', roleId, Ext.String.htmlEncode(value));
  }
  else if (isGroupAttribute == 'true') {
      if(roleSearchValue){
          rendered = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(roleName) + '\', \'' + encodeURIComponent(roleSearchValue) + '\');">' + Ext.String.htmlEncode(value) + '</a>';
      }else {
          rendered = '<a onclick="viewAccountGroup(\'' + Ext.String.htmlEncode(appName) + '\', \'' + Ext.String.htmlEncode(roleName) + '\', \'' + encodeURIComponent(value) + '\');">' + Ext.String.htmlEncode(value) + '</a>';
      }
  }

  rendered = "value " + rendered + " on " + roleName;

  var nameWithTooltip = rendered;

  if (roleInfo != null && roleInfo.length != 0) {
    nameWithTooltip = SailPoint.component.NameWithTooltip.getTooltipHtml(rendered, roleInfo);
  }

  if (iconType == null || iconType.length == 0) {
    rendered = '<div>' + nameWithTooltip + "</div>";
  }
  else {
    rendered = '<div style="padding-left:18px" class="' + iconType + 'Icon">' + nameWithTooltip + "</div>";
  }

  return rendered;
};

SailPoint.Manage.Grid.AccessRequests.columnWrap = function(value,p,r) {
    if (value == null) {
        return "";
    }
    return '<div style="white-space:normal !important; word-wrap: break-word !important;">'+ value +'</div>';
};

SailPoint.Manage.Grid.AccessRequests.viewRequestDetails = function(requestId) {
  var wid = Ext.query('input[name$=:requestId]');
  
  for (var i = 0; i < wid.length; i++) {
    wid[i].value = requestId;
  }
  
  var wib = Ext.query('input[name$=viewRequestDetails]');
  
  if (wib.length > 0 && wid[0].value.length > 0) {
    wib[0].click();
  }
}

SailPoint.Manage.Grid.AccessRequests.viewWorkItem = function(workItemId) {
  var wid = Ext.query('input[name$=workItemId]');
  
  if (wid.length > 0) {
    wid[0].value = workItemId;
  }
  
  var wib = Ext.query('input[name$=viewWorkItem]');
  
  if (wib.length > 0 && wid[0].value.length > 0) {
    wib[0].click();
  }
}
