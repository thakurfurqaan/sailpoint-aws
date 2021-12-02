Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Role');

SailPoint.Report.Role.initialize = function() {
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'applicationsMultiSuggest',
      suggestType: 'application',
      jsonData: Ext.decode(Ext.getDom('applicationsSuggestInfo').innerHTML),
      inputFieldName: 'applicationsSuggest',
      contextPath: CONTEXT_PATH
      });                
  
  var ownersMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'ownersMultiSuggest',
      suggestType: 'identity',
      jsonData: Ext.decode(Ext.getDom('ownersSuggestInfo').innerHTML),
      inputFieldName: 'owners',
      id: 'roleReportsOwnersFilter',
      baseParams: {context: 'Owner'},
      contextPath: CONTEXT_PATH
      });
      
  var checkBox1 = Ext.getDom('editForm:startDateSelect');
  toggleDisplay(Ext.getDom('startDateDiv'), !(checkBox1.checked));

  var checkBox2 = Ext.getDom('editForm:endDateSelect');
  toggleDisplay(Ext.getDom('endDateDiv'), !(checkBox2.checked));
};
