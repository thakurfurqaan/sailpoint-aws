/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

function groupBuckets() {
  Ext.getDom('editForm:groupBucketBtn').click();
}

function searchAgain() {
  Ext.getDom('editForm:searchComplete').value = 'false';
  Ext.getDom('editForm:searchAgain').click();
}

function validateGroup() {
  validated = validateSelections(Ext.get('errorDiv'), false);
  
  if(validated)
  Ext.getDom('editForm:groupBucketBtn').click();
    
}

function validateSelections(errorDiv, validateTbl) {

  //Check to see if any checkboxes are checked
  var inputs = Ext.DomQuery.select("input[type=checkbox]", Ext.getDom('entitlementProfileResultsDiv'));
  var selectedCount = 0;
  var tableId = null;
  var parent;
  var splitId;
  
  for(var i=0; i<inputs.length; i++) {
    if(inputs[i].checked) {
      if(validateTbl) {
        parent=inputs[i].parentNode;
        while(parent.tagName!="TABLE") {
          //alert("Parent: " + parent + " " + parent.tagName);
          parent = parent.parentNode;
        }
        if(parent.id!="") {
          splitId = parent.id.split("_");
          if(tableId == null) {
            tableId = splitId[0];
          } else if(splitId[0] != tableId) {
            //errorDiv.innerHTML = "<div class='formError'> You cannot group entitlements from different applications. </div>";         
            //errorDiv.style.display='';           
            //return false;
          }
        }
      }
      
      selectedCount++;
    }
  }      
  if(selectedCount < 1) {
      errorDiv.innerHTML = "<div class='formError'> " + '#{msgs.err_entitlement_mining_group}' +  " </div>";
      errorDiv.style.display='';
      return false;
  }
  else if(Ext.get(errorDiv).isVisible()) {
    errorDiv.style.display = 'none';
  }
  return true;
}

function showGroupedBuckets(id, sourceLink) {
    var idBase = 'sp' + id,
        groupTr = Ext.get(idBase + '_groupTr');
    showHideWithLock([Ext.getDom(idBase + '_groupTr')], null, '0.5', {
        fn1: SailPoint.Utils.toggleDisclosureDiv,
        args: {link: sourceLink, div: groupTr}
    });
}

function showGroupedIdentities(id, sourceLink) {
    var idBase = 'sp' + id,
        targetTR = Ext.get(idBase + '_groupIdent_tr'),
        gridDiv = idBase + '_groupIdent_divIdentities',
        gridId = gridDiv + '_obj',
        isVisible = targetTR.isVisible();

    if (!isVisible) {
        targetTR.show();
        targetTR.dom.style.display = ''; // target.show() doesn't seem to clear this...
        renderGroupedIdentitiesGrid(gridDiv, gridId, id);
    } else {
        var grid = Ext.getCmp(gridId);
        if (grid) {
            grid.hide();
        }
        targetTR.dom.style.display = 'none';
    }
    SailPoint.Utils.toggleDisclosureLink(sourceLink, !isVisible);
}

function renderGroupedIdentitiesGrid (targetElement, gridId, groupId){

    // we need to destroy the old grid because these grids are kept in a4j panels that are re-rendered - Bug #5517
    var grid = Ext.getCmp(gridId);
    if (grid){
        grid.destroy();
    }

    var groupedIdentitiesGrid = null;
    var groupedIdentitiesStore = null;

    groupedIdentitiesStore = Ext.create('Ext.data.Store', {
        autoLoad: true,
        model : 'SailPoint.model.Empty',
        proxy : {
            url: SailPoint.getRelativeUrl('/define/roles/modeler/entitlementMiningBucketIdentityListJson.json'),
            type : 'ajax',
            extraParams:{bucketGroupId:groupId}
        },
        remoteSort:false
    });

    groupedIdentitiesGrid = Ext.create('SailPoint.grid.PagingGrid', {
        id:gridId,
        dynamic: true,
        height:300,
        viewConfig:{
            autoFill:true
        }, 
        store:groupedIdentitiesStore,
        frame:false,
        width:Ext.fly(targetElement).getWidth(),
        alwaysRefreshCols:false,
        columns: [],
        renderTo: targetElement
    });

    // this will only run the first time load is called
    groupedIdentitiesStore.on('load',function(){
        Ext.each(this.headerCt.getGridColumns(), function(item) {
            item.flex = 1;
        });
    }, groupedIdentitiesGrid, {single:true});

}

