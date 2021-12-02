Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Remediation');

SailPoint.Report.Remediation.initialize = function(groups, savedDefinitions) {
  Ext.QuickTips.init();
  
  
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
    renderTo: 'applicationsMultiSuggest',
    suggestType: 'application',
    jsonData: Ext.decode(Ext.getDom('applicationsData').innerHTML),
    inputFieldName: 'applicationsSuggest',
    contextPath: CONTEXT_PATH
  });

  var managersMultiSuggest = new SailPoint.MultiSuggest({
    id: 'remediationProgressReportManagers',
    renderTo: 'managersMultiSuggest',
    suggestType: 'manager',
    jsonData: Ext.decode(Ext.getDom('managersData').innerHTML),
    inputFieldName: 'managers',
    baseParams: {'type': 'manager', context: 'Manager'},
    contextPath: CONTEXT_PATH
  });
  
  var groupSelectorPanel = new SailPoint.GroupedItemSelector({
      renderTo : 'groupSelector',
      savedDefinitions:savedDefinitions,
      groupComboData: groups,
      inputFieldName:'editForm:groupsInput'
  });

  var checkBox1 = Ext.getDom('editForm:startDateSelect');
  toggleDisplay(Ext.getDom('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = Ext.getDom('editForm:endDateSelect');
  toggleDisplay(Ext.getDom('endDateDiv'), !(checkBox2.checked));

  var checkBox3 = Ext.getDom('editForm:signedStartDateSelect');
  toggleDisplay(Ext.getDom('signedStartDateDiv'), !(checkBox3.checked));

  var checkBox4 = Ext.getDom('editForm:signedEndDateSelect');
  toggleDisplay(Ext.getDom('signedEndDateDiv'), !(checkBox4.checked));

  var checkBox5 = Ext.getDom('editForm:dueStartDateSelect');
  toggleDisplay(Ext.getDom('dueStartDateDiv'), !(checkBox5.checked));

  var checkBox6 = Ext.getDom('editForm:dueEndDateSelect');
  toggleDisplay(Ext.getDom('dueEndDateDiv'), !(checkBox6.checked));
};
