/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

////////////////////////////////////////////////////////////////////////////////
//
// GENERAL FUNCTIONS
//
////////////////////////////////////////////////////////////////////////////////

function disableFormInputs() {
    Ext.getDom('configForm:saveButton').disabled = true;
    Ext.getDom('configForm:cancelButton').disabled = true;
}

function enableFormInputs() {
    Ext.getDom('configForm:saveButton').disabled = false;
    Ext.getDom('configForm:cancelButton').disabled = false;
}


////////////////////////////////////////////////////////////////////////////////
//
// SOURCE MAPPING MANAGEMENT
//
////////////////////////////////////////////////////////////////////////////////

// This object holds the currently selected source mapping for the purpose of reordering it
var currentSelection = {};

currentSelection.table = null;
currentSelection.row = null;
currentSelection.sequenceId = null;
currentSelection.sequenceIndex = null;

function selectMe(source) {
    resetSourceMappingTables();

    var selectedTable = Ext.getDom('sources');
    if (selectedTable.rows.length > 1) {
        currentSelection.table = selectedTable;
        selectedTable.className = 'selectionBox';
        var selectedRow = Ext.getDom(source);

        currentSelection.row = selectedRow;
        selectedRow.className = 'selectedSourceMapping';

        currentSelection.sequenceId = 'sources';
        currentSelection.sequenceIndex = getSequenceIndexForRow(selectedRow);

        var selectedArrows = Ext.getDom('selectionArrows');
        selectedArrows.style['display'] = '';
    }
}

function resetSourceMappingTables() {
    currentSelection.table = null;
    currentSelection.row = null;
    var allSourceTables = Ext.getDom('mappedSourceTable').getElementsByTagName('table');

    for (var i = 0; i < allSourceTables.length; ++i) {
        var currentTable = allSourceTables[i];
        if (allSourceTables[i].id == 'sources') {
          var rowsInTable = currentTable.rows;

          currentTable.className = 'selectionBox';
          // Reset all the other backgrounds to their defaults
          for (var j = 0; j < rowsInTable.length; ++j) {
              rowsInTable[j].className = '';
          }
        }
    }
}

// This function moves the current selection up a row
function moveMeUp() {
    if (currentSelection.row != null) {
        var currentRow = currentSelection.row;
        var currentRowIndex = currentRow.rowIndex;

        if (currentRowIndex > 0) {
            var targetRow = currentSelection.table.rows[currentRowIndex - 1];
            var targetRowContents = targetRow.cells[1].innerHTML;
            targetRow.cells[1].innerHTML = currentRow.cells[1].innerHTML;
            targetRow.className = 'selectedSourceMapping';
            currentRow.cells[1].innerHTML = targetRowContents;
            currentRow.className = '';
            currentSelection.row = targetRow;
            SequenceTracker.swapValue(currentSelection.sequenceId, currentSelection.sequenceIndex, -1);
            update();
        }
    }
}

// This function moves the current selection down a row
function moveMeDown() {
    if (currentSelection.row != null) {
        var currentRow = currentSelection.row;
        var currentRowIndex = currentRow.rowIndex;
        var numRows = currentSelection.table.rows.length;

        if (currentRowIndex < numRows - 1) {
            var targetRow = currentSelection.table.rows[currentRowIndex + 1];
            var targetRowContents = targetRow.cells[1].innerHTML;
            targetRow.cells[1].innerHTML = currentRow.cells[1].innerHTML;
            targetRow.className = 'selectedSourceMapping';
            currentRow.cells[1].innerHTML = targetRowContents;
            currentRow.className = '';
            currentSelection.row = targetRow;
            SequenceTracker.swapValue(currentSelection.sequenceId, currentSelection.sequenceIndex, 1);
            update();
        }
    }
}

// Update the newSourceOrder input parameter with the current source mappings
function update() {
    var sourceMappings = document.getElementsByClassName('selectionBox');
    var serializedMap = '[';

    Ext.each(sourceMappings, function(mapping) {
        var mappingID = mapping.id;
        serializedMap += '[' + mappingID + ': ' + SequenceTracker.sequence(mappingID) + '] ';
    });

    serializedMap += ']';

    Ext.getDom('configForm:newSourceOrder').value = serializedMap;
}

// Set the inputs needed for the back end to properly sort the attributes
function sortTable(newColumn) {
    var currentColumn = Ext.getDom('configForm:selectedSortColumn').value;

    if (currentColumn == newColumn) {
        // Toggle the direction if the user is clicking on the currently selected column
        var originalValue = Ext.getDom('configForm:sortAscending').value;
        Ext.getDom('configForm:sortAscending').value = (Ext.getDom('configForm:sortAscending').value != 'true');
    } else {
        // Reset the direction and change the column if the user is clicking on a different column
        Ext.getDom('configForm:selectedSortColumn').value = newColumn;
        Ext.getDom('configForm:sortAscending').value = true;
    }
}

function getSequenceIndexForRow(selectedRow) {
    var inputs = selectedRow.getElementsByTagName('input');
    return inputs[0].value;
}

// This function is used only for debugging
function dumpSequences() {
    var sourceMappings = document.getElementsByClassName('selectionBox');
    var alerttext = '';

    Ext.each(sourceMappings, function(mapping) {
        var mappingID = mapping.id;
        alerttext += mappingID + ': ' + SequenceTracker.sequence(mappingID) + '\n';
    });

    alert(alerttext);
}

function isAttributeID(id) {
    return beginsWith(id, 'mappedSourceTable:') && endsWith(id, 'attribute');
}


////////////////////////////////////////////////////////////////////////////////
//
// ADD SOURCE POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showAddSourcePopup(editedAttribute) {
    var popup = Ext.getCmp('addSourceWindow');
    
    // Why does my window have a panel embedded in it?  Well, it's the only way to 
    if (!popup) {
        var addSrcMappingTpl = new Ext.Template("#{msgs.add_src_to_identity_attr}");
        popup = new Ext.Window({
            id: 'addSourceWindow',
            title: addSrcMappingTpl.apply([editedAttribute]),
            border: true,
            renderTo: 'addSourceDiv',
            items: [
                {
                    xtype : 'panel',
                    contentEl: 'addSourceContentsDiv',
                    layout: 'fit',
                    bodyStyle: 'background-color: #ffffff'
                }
            ],
            modal: true,
            autoScroll: true,
            closable: false,
            plain: true,
            width: 768,
            height: 300,
            layout: 'fit',
            buttons: [{
                text: '#{msgs.button_add}', 
                handler: function(){
                    var validationSucceeded = validateSourceCreation('configForm', editedAttribute);

                    if (validationSucceeded) {
                        var errorDiv = Ext.getDom('errorMessages');
                        Validator.hideErrors(errorDiv);
                        SequenceTracker.reset();
                        Ext.getDom('configForm:stealthAddSourceButton').click();
                    }  else {
                        var errorDiv = Ext.getDom('errorMessages');
                        Validator.displayErrors(errorDiv);
                    }

                    return validationSucceeded;
                }
            },{
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    var errorDiv = Ext.getDom('errorMessages');
                    Validator.hideErrors(errorDiv);
                    clearAddSourceParams();
                    popup.hide();
                    enableFormInputs();
                }
            }],
            buttonAlign: 'center'
        });
    }
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    Ext.getDom('addSourceContentsDiv').style.display = '';
    initSuggest();
}  // showAddSourcePopup()

function initSuggest() {
    var appSuggest = Ext.getCmp('appSuggest');
    if (!appSuggest) {
        appSuggest = new SailPoint.BaseSuggest({
            id: 'appSuggest',
            pageSize: 10,
            baseParams: {'suggestType': 'application'},
            extraParams: {'aggregationType': 'account'},
            renderTo: 'sourceAppsSuggest',
            binding: 'sourceApps',
            value: Ext.getDom('sourceApps').value,
            valueField: 'displayName',                        
            width: 300,
            emptyText: '#{msgs.select_application}'
        });
            
        appSuggest.on('select', function(suggestField, record, index) {
            Ext.getDom('sourceApps').value = record[0].data['displayName'];
            Ext.getDom('configForm:updateAppBtn').click();
        });
    }
}

function validateSourceCreation(formName, attributeName) {
    var isValid, sourceApplication, sourceRule;

    var sourceOption = getSelectedRadioInput(formName + ':sourceOption');

    if (sourceOption == 'APPLICATION') {
      sourceApplication = Ext.getDom('sourceApps').value;
      isValid = Validator.validateNonBlankString(sourceApplication, 'No application was selected.');

      if (isValid) {
        var sourceAttribute = Ext.getDom('configForm:sourceAttributes').value;
        isValid = Validator.validateNonBlankString(sourceAttribute, 'No attribute was selected.');
      }
    } else if (sourceOption == 'RULE') {
      sourceRule = Ext.getDom('configForm:sourceRules').value;
      isValid = Validator.validateNonBlankString(sourceRule, 'No rule was selected.');

    } else if (sourceOption == 'APPRULE') {

      sourceApplication = Ext.getDom('sourceApps').value;
      isValid = Validator.validateNonBlankString(sourceApplication, 'No application was selected.');

      sourceRule = Ext.getDom('configForm:sourceRules').value;
      isValid = Validator.validateNonBlankString(sourceRule, 'No rule was selected.');
    }

    return isValid;
}

// This works around a JSF behavior where JSF refuses to submit inputs from
// unrendered fields.  That behavior conflicts with the a4j model, where 
// previously unrendered components may become rendered.  Our strategy, therefore,
// is for JSF to render what we need and for us to hide components accordingly
function displayIdentitySourceSelectOptions() {
     var selectedOption = getSelectedRadioInput('configForm:sourceOption');
     if ((selectedOption == 'APPLICATION')) {
         Ext.getDom('appDiv').style.display = '';
         if (Ext.getDom('sourceApps') && Ext.getDom('sourceApps').value && Ext.getDom('sourceApps').value.length > 0) {
             Ext.getDom('attributesDiv').style.display = '';
         }
         else {
             Ext.getDom('attributesDiv').style.display = 'none';
         }
         Ext.getDom('ruleDiv').style.display = 'none';
     } else if (selectedOption == 'RULE' || selectedOption == 'IDENTITY_ATTR_RULE') {
         Ext.getDom('appDiv').style.display = 'none';
         Ext.getDom('attributesDiv').style.display = 'none';
         Ext.getDom('ruleDiv').style.display = '';
     } else if ( selectedOption == 'APPRULE') {
        Ext.getDom('appDiv').style.display = '';
         Ext.getDom('attributesDiv').style.display = 'none';
         Ext.getDom('ruleDiv').style.display = '';
     }
}

function clearAddSourceParams() {
    Ext.getDom('sourceApps').value = '';
    Ext.getDom('configForm:sourceAttributes').value = '';
    Ext.getDom('configForm:sourceRules').value = '';
    Ext.getDom('attributesDiv').style.display = 'none';
    if (Ext.getDom('configForm:addAsTargetCheckbox')) {
        Ext.getDom('configForm:addAsTargetCheckbox').checked = false;
    }
    var appSuggest = Ext.getCmp('appSuggest');
    if (appSuggest) { 
        appSuggest.clearValue();
    }
}


////////////////////////////////////////////////////////////////////////////////
//
// DELETE SOURCES POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showDeleteSourcesPopup(editedAttribute) {
    var popup = Ext.getCmp('deleteSourcesWindow');
    
    // Why does my window have a panel embedded in it?  Well, it's the only way to 
    if (!popup) {
        var deleteSrcMappingTpl = new Ext.Template("#{msgs.delete_src_from_identity_attr}");
        popup = new Ext.Window({
            id: 'deleteSourcesWindow',
            title: deleteSrcMappingTpl.apply([editedAttribute]),
            border: true,
            renderTo: 'deleteSourceDiv',
            closable: false,
            items: [
                new Ext.Panel({
                    contentEl: 'deleteSourceContentsDiv',
                    layout: 'fit',
                    bodyStyle: 'background-color: #ffffff; overflow-y:auto'
                })
            ],
            modal: true,
            plain: true,
            width: 768,
            height: 300,
            layout: 'fit',
            buttons: [{
                text: '#{msgs.button_delete}', 
                handler: function() {
                    SequenceTracker.reset();
                    Ext.getDom('configForm:stealthDeleteSourcesButton').click();
                    enableFormInputs();
                }
            },{
                text: '#{msgs.button_cancel}',
                cls : 'secondaryBtn',
                handler: function() {
                    clearDeleteSourceParams();
                    popup.hide();
                    enableFormInputs();
                }
            }],
            buttonAlign: 'center'
        });
    }
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    Ext.getDom('deleteSourceContentsDiv').style.display = '';
}

function clearDeleteSourceParams() {
    var inputsToUncheck = Ext.DomQuery.select('input[checked=true]', 'configForm:deleteSourceTable');
    var i;
    
    for (i = 0; i < inputsToUncheck.length; ++i) {
        inputsToUncheck[i].checked = false;
    }
}


////////////////////////////////////////////////////////////////////////////////
//
// ADD TARGET POPUP
//
////////////////////////////////////////////////////////////////////////////////

function showTargetPopup(editedAttribute, isAdd) {
    var titleTpl =
        (isAdd) ? new Ext.Template("#{msgs.add_identity_attr_target_title}")
                : new Ext.Template("#{msgs.edit_identity_attr_target_title}");
    var popup = new Ext.Window({
        id: 'addTargetWindow',
        title: titleTpl.apply([editedAttribute]),
        border: true,
        renderTo: 'addTargetDiv',
        items: [
            new Ext.Panel({
                contentEl: 'addTargetContentsDiv',
                layout: 'fit',
                bodyStyle: 'background-color: #ffffff'
            })
        ],
        modal: true,
        autoScroll: true,
        closable: false,
        plain: true,
        width: 768,
        height: 300,
        layout: 'fit',
        buttons: [{
            text: (isAdd) ? '#{msgs.button_add}' : '#{msgs.button_save}', 
            handler: function(){
                var valid = validateTarget();
                if (valid) {
                    var btn = (isAdd) ? 'configForm:stealthAddTargetButton'
                                      : 'configForm:stealthEditTargetButton';
                    Ext.getDom(btn).click();
                }  else {
                    Validator.displayErrors(Ext.getDom('targetErrorMessages'));
                }
                return valid;
            }
        },{
            text: '#{msgs.button_cancel}',
            cls : 'secondaryBtn',
            handler: function() {
                closeTargetWindow();
            }
        }],
        buttonAlign: 'center'
    });

    // The app suggest is created outside of the window, so we need to
    // explicitly destroy it when the window is destroyed.
    popup.on('destroy', function(window, opts) {
        Ext.getCmp('targetAppSuggest').destroy();
    });
    
    disableFormInputs();
    
    popup.show();
    popup.alignTo('identityAttributeSettingsTbl', 't-t');
    Ext.getDom('addTargetContentsDiv').style.display = '';
    initTargetAppSuggest();
}

function closeTargetWindow() {
    Ext.getCmp('addTargetWindow').close();
    enableFormInputs();
}

function initTargetAppSuggest() {
    var appName = Ext.getDom('targetApp').value;
    var appSuggest = new SailPoint.BaseSuggest({
        id: 'targetAppSuggest',
        pageSize: 10,
        baseParams: {'suggestType': 'application'},
        extraParams: {'aggregationType': 'account'},
        renderTo: 'targetAppSuggest',
        binding: 'targetApp',
        initialData: appName,
        valueField: 'displayName',
        width: 300,
        emptyText: '#{msgs.select_application}'
    });

    appSuggest.on('select', function(suggestField, record, index) {
        Ext.getDom('targetApp').value = record[0].data['displayName'];
        Ext.getDom('configForm:updateTargetAppBtn').click();
    });
}

function validateTarget(formName) {
    var sourceApplication = Ext.getDom('targetApp').value;
    var appValid = Validator.validateNonBlankString(sourceApplication, '#{msgs.target_no_app_selected}');

    var sourceAttribute = Ext.getDom('configForm:targetAttribute').value;
    var attrValid = Validator.validateNonBlankString(sourceAttribute, '#{msgs.target_no_attr_selected}');

    return (appValid && attrValid);
}


////////////////////////////////////////////////////////////////////////////////
//
// IDENTITY ATTRIBUTE METHODS
//
////////////////////////////////////////////////////////////////////////////////

function validateAttributeCreation() {
    var isValid;

    var attributeName = Ext.getDom('createIdentityAttributeForm:attributeName').value;
    isValid = Validator.validateNonBlankString(attributeName, 'The name is missing.');

    if (isValid) {
      isValid = Validator.validateAlphanumericOrSpace(attributeName, 'The name contained non-alphanumeric characters.');
    }

    // Fix spaces
    var nameParts = attributeName.split(' ');
    var validName = nameParts[0];

    for (var i = 1; i < nameParts.length; ++i) {
        if (nameParts[i] != '') {
            validName += ' ';
            validName += nameParts[i];
        }
    }

    Ext.getDom('createIdentityAttributeForm:attributeName').value = validName;

    return isValid;
}

function setSearchableIfNeeded(isStandardAttribute) {
    var wasSetToGroupFactory = Ext.getDom('configForm:groupFactory').checked;
    var isSearchable;
      
    if (isStandardAttribute === false) {
        if (wasSetToGroupFactory === true) {
            isSearchable = Ext.getDom('configForm:extended').checked;
            if (isSearchable === false) {
                Ext.getDom('configForm:extended').click();
            }
        }
    }
}
  
function disableGroupFactoryIfNeeded() {
    var wasSetSearchable = Ext.getDom('configForm:extended').checked;
    var isGroupFactory;
      
    if (wasSetSearchable === false) {
        isGroupFactory = Ext.getDom('configForm:groupFactory').checked;
        if (isGroupFactory === true) {
            Ext.getDom('configForm:groupFactory').click();
        }
    }
}
  
function checkAttributeType(initialName, initialIsMulti, initialIsExtended) {
    var type = Ext.getDom('configForm:attributeType').value;
    var multiValued = Ext.getDom('configForm:multiValued');
    var extended = Ext.getDom('configForm:extended');
    var standard = (Ext.getDom('configForm:standard').value === 'true');

    // IMPORTANT: Do not check extended or searchable for standard attributes
    if (type === 'sailpoint.object.Identity') {
      multiValued.checked = false;
      multiValued.disabled = true;
      if (extended) {
          extended.checked = !standard;
          extended.disabled = true;
      }
      Ext.getDom('configForm:multiValuedCheckboxValue').value = false;
      Ext.getDom('configForm:searchableCheckboxValue').value = !standard;
    } else {
      multiValued.disabled = false;
      multiValued.checked = initialIsMulti;
      if (extended) {
          extended.disabled = false;
          extended.checked = initialIsExtended;                  
      }
      Ext.getDom('configForm:multiValuedCheckboxValue').value = initialIsMulti;
      Ext.getDom('configForm:searchableCheckboxValue').value = initialIsExtended;
    }
}
  
function copyCheckboxValuesFromFields() {
    var multiValued = Ext.getDom('configForm:multiValued');
    var extended = Ext.getDom('configForm:extended');
    if (multiValued) {
        Ext.getDom('configForm:multiValuedCheckboxValue').value = multiValued.checked;
    }
    if (extended) {
        Ext.getDom('configForm:searchableCheckboxValue').value = extended.checked;
    }
}

function copyCheckboxValuesToFields() {
    var multiValued = Ext.getDom('configForm:multiValued');
    var extended = Ext.getDom('configForm:extended');
    if (multiValued) {
        multiValued.checked = Ext.getDom('configForm:multiValuedCheckboxValue').value === "true";
    }
    if (extended) {
        extended.checked = Ext.getDom('configForm:searchableCheckboxValue').value === "true";
    }
}
