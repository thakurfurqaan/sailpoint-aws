Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.ARM');

SailPoint.Report.ARM.initialize = function() {
  var approversMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'approversMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode(Ext.getDom('approverSuggestInfo').innerHTML),
      id: 'armReportsApprovers',
      baseParams: {context: 'Owner'},
      inputFieldName: 'approvers'
  });
  
  var requestorsMultiSuggest = new SailPoint.MultiSuggest({
      id: 'armReportsRequestors',
      renderTo: 'requestorsMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode(Ext.getDom('requestorSuggestInfo').innerHTML),
      inputFieldName: 'requestors',
      baseParams: {context: 'Global'}
  });
  
  var rolesMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'businessRolesMultiSuggest',
      suggestType: 'role',
      jsonData: Ext.decode(Ext.getDom('roleSuggestInfo').innerHTML),
      inputFieldName: 'businessRolesSuggest',
      contextPath: CONTEXT_PATH
  });
  
  var checkBox1 = Ext.getDom('editForm:startDateSelect');
  toggleDisplay(Ext.getDom('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = Ext.getDom('editForm:endDateSelect');
  toggleDisplay(Ext.getDom('endDateDiv'), !(checkBox2.checked));

  var checkBox3 = Ext.getDom('editForm:approvedStartDateSelect');
  toggleDisplay(Ext.getDom('approvedStartDateDiv'), !(checkBox3.checked));

  var checkBox4 = Ext.getDom('editForm:approvedEndDateSelect');
  toggleDisplay(Ext.getDom('approvedEndDateDiv'), !(checkBox4.checked));
}                                
