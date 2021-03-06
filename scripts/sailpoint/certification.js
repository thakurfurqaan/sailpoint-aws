/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.Certification');

var CertificationPanelParams = function(itemId, identityId, certificationId, workItemId,
    actionType, isDelegationReview, isReadOnly)
{
    this.params = {
        certificationItemId: itemId,
        certificationIdentityId: identityId,
        certificationId: certificationId,
        workItemId: workItemId,
        actionType: actionType,
        isDelegationReview: isDelegationReview,
        isReadOnly: isReadOnly
    };
};

CertificationPanelParams.prototype = {
    // Add the given name/value pair to the parameters.
    //
    // paramName:   The name of the parameter to add.
    // paramValue:  The value of the parameter to add.
    addParam: function(paramName, paramValue) {
        var paramObject = {};
        paramObject[paramName] = paramValue;
        Ext.apply(this.params, paramObject);
    },

    // Return the value of the parameter with the given name.
    getParam: function(paramName) {
        return this.params[paramName];
    },

    // Return the parameters as a query string.
    toQueryString: function() {
        return this.params.toQueryString();
    }
};

var CertificationLoadingSpinner = new SailPoint.LoadingSpinner();

// Used to prevent showing the "loading" div if the AJAX request has already completed.
var identityLoadCompleted = false;

/**
 * Get the scroll Y offset.  This is borrowed from prototype 1.6
 * document.viewport.getScrollOffsets(), and should work across browsers.  Once
 * we upgrade to prototype 1.6, we can get rid of this.
 */
function getScrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
}

/**
 * Show the "loading data" div when loading a certification entity's data.
 */
function showLoadingUserDiv() {

    if (!identityLoadCompleted) {
        var myDiv = Ext.get('loadingUserDiv');
        showInCenter(myDiv);
    }
}

/**
 * Show an element in the middle of the page.
 */
function showInCenter(elt) {
    if (null != elt) {
        elt.style.display="";
        elt.style.top =  (parseInt((document.body.offsetHeight/2) - (elt.offsetHeight/2)) + parseInt(getScrollY())) + 'px';
        elt.style.left = parseInt((document.body.offsetWidth/2) - (elt.offsetWidth/2)) + 'px';
        elt.show();
    }
}

/**
 * Mark the beginning of loading a certification entity's data and display the
 * loading data dialog.
 */
function startIdentityLoading() {
    identityLoadCompleted = false;
    showLoadingUserDiv();
}

/** The certification item tables in the entity view can have an unknown
 * number of columns in each table.  This makes it impossible to determine before load
 * how many columns the hidden columns should span.  This function looks at the header of
 * each dynamicColumnTable and determines how many columns to span each row
 * @return
 */
function setupDynamicColSpans() {
  var tables = Ext.DomQuery.select('table[class*=dynamicColumnTable]');
  for(var j=0; j<tables.length; j++) {
    
    /** Count the number of cells in the header **/
    var ths = Ext.DomQuery.select('th', tables[j]);
    var headerCellCount = ths.length;
    
    var cells = Ext.DomQuery.select('td[class*=dynamicColumnCell]', tables[j]);
    for(var i=0; i<cells.length; i++) {
      /** Count how many cells in this cell's row **/
      var cell = cells[i];
      var rowCellCount = cell.parentNode.children.length;
      if(rowCellCount<headerCellCount) {
        cell.colSpan = (headerCellCount-rowCellCount+1);
      }
    }
  }
}

/**
 * A component used to display the startup help for the certification entity
 * page.
 */
var StartUpHelpCertificationEntity = {

    // Keep a reference to this so we will only show it once per page refresh.
    startUpHelp: null,

    /**
     * Display the startup help for the certification entity page if we have not
     * yet displayed it.
     */
    init: function() {
        if (null == this.startUpHelp) {
            this.startUpHelp = new SailPoint.StartUpHelp({
                startupHelpContent: '#{sp:escapeJavascript(msgs.startup_help_certification_entity_view_content)}',
                startupHelpTitle: "#{sp:escapeJavascript(msgs.startup_help_certification_entity_view_title)}",
                trackStartUpHelpAJAXURL: "/manage/certification/startupHelpCertEntityPersistStateJSON.json"
            });

            this.startUpHelp.show();
        }
    }
};

function resetMenu(menu, decision) {
  if(!menu)
    return;
  if (decision) {
      menu.status = decision;
  }

  menu.menuCreated = false;
}

/**
 * Convert the given list to a comma-separated value string.
 */
function listToCsv(list) {
    var csv = '';
    var sep = '';

    if (list) {
        for (var i=0; i<list.length; i++) {
            csv += sep + list[i];
            sep = ',';
        }
    }

    return csv;
}

function viewCertification(certificationId) {
    Ext.getDom('editForm:selectedCertificationId').value = certificationId;
    Ext.getDom('editForm:viewCertificationButton').click();
}

function exportToCSV() {
	if(Ext.get('editForm:exportItemsToCSVBtn'))
		Ext.getDom('editForm:exportItemsToCSVBtn').click();
}

/**
 * The the IDs of the certification items that are in the page.  This uses the
 * hidden "<id>_previousStatus" fields to find the IDs.
 *
 * @param  container  Optional root container in which to search.
 *
 * @return A comma-separated string of certification item IDs.
 */
function getCertificationItemIds(container) {
    container = (null == container) ? Ext.getDom('editForm') : Ext.getDom(container);
    var inputs = Ext.DomQuery.select("input.certItemPreviousStatus", container);

    var itemIds = '';
    var sep = '';

    inputs.each(function(elt) {
                    var eltId = elt.id;
                    var regex = /(\S+)_previousStatus/;
                    if ((null != eltId) && regex.test(eltId)) {
                        itemIds += sep + RegExp.$1;
                        sep = ',';
                    }
                });

    return itemIds;
}

/** Refreshes the grid **/
function refreshGrid( grid ) {
  if(grid)
    grid.getStore().load();
}

function showHideApplicationDetails(id) {
  var elements = [];
  //These can get out of whack, so only put the tr on the stack
  //if their visibility is the same.

  if(Ext.get('applicationDetailsTR_'+id).isVisible() == Ext.get('applicationDetails_'+id).isVisible()) {
    elements.push(Ext.getDom('applicationDetailsTR_'+id));
  }
  elements.push(Ext.getDom('applicationDetails_'+id));
  showHideWithLock(elements);
}

/**
* Retrieve the certification item id for the given radio.
*/
function getCertificationItemId(radio){

    var radiosWrapper = Ext.get(radio).findParent('div[class*=certificationItemApplicationKey]');
    if (!radiosWrapper || !radiosWrapper.id)
        return null;

    var idSplit = radiosWrapper.id.split('_');
    if (idSplit.length > 1)
        return idSplit[1];

    return null;
}

/**
 * Go to the details page for certification entity with gCertEntityId.
 * 
 * @param  item              The Ext.Menu.Item that was clicked if this was from
 *                           a context menu.  (optional)
 * @param  e                 The Ext.EventObject if this was from a context menu
 *                           (optional).
 * @param  forceWithoutSave  If true, we do not prompt if there are any unsaved
 *                           decisions.  Defaults to false if not specified.
 */
function certifyUserAccess(item, e, forceWithoutSave) {

    forceWithoutSave = forceWithoutSave || false;
    
    // If there are unsaved changes, prompt to see if they want to save and continue.
    if (SailPoint.IdentityItemsGrid && !forceWithoutSave && SailPoint.IdentityItemsGrid.handleUnsavedChangesBeforeDetails()) {
        return;
    }

    Ext.getDom('editForm:currentCertificationIdentityId').value = gCertEntityId;
    Ext.getDom('editForm:editButton').click();

    // If any bulk action errors have been added to the page, the web 2.0 transition
    //  below won't clean them up. This nukes the div so they go away
    if (Ext.get('errors')) {
        Ext.getDom('errors').innerHTML='';
    }

    // Web 2.0 transition - blind up the live grid, blind down the identity
    // panel, and show the "loading user panel".
    // Fixed for ie
    if(navigator.appName == 'Microsoft Internet Explorer') {
        Ext.getDom('certIdsLiveGridContainer').style.display = 'none';
    } else {
        Ext.fly('certIdsLiveGridContainer').slideOut();
    }

    Ext.fly('currentIdentityDiv').slideIn();

    window.setTimeout('showLoadingUserDiv()', 1300);

    return true;
}

////////////////////////////////////////////////////////////////////////////////
//
// RadioProxy will route commands correctly to the VirtualRadio (if defined) or
// the ImageRadio directly if there is no virtual radio.
//
////////////////////////////////////////////////////////////////////////////////

var RadioProxy = {

    setRadioValue: function(radio, value) {
        if (('undefined' != typeof vRadio) && (null != vRadio)) {
            vRadio.radioValueSet(radio, value);
        }
        else {
            ImageRadio.setRadioValue(radio, value);
        }
    }
};

