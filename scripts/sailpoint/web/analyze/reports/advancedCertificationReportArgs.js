Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.AdvancedCertification');
var debug;

SailPoint.Report.AdvancedCertification.initialize = function() {
  var groupsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'groupsMultiSuggest',
      suggestType: 'group',
      jsonData: Ext.decode(Ext.getDom('groupsSuggestInfo').innerHTML),
      inputFieldName: 'groupsSuggest',
      baseParams: {'type': 'group'}
  });
  
  if(Ext.get('managerMultiData')){
    var managersMultiSuggest = new SailPoint.MultiSuggest({
        renderTo: 'managersMultiSuggest',
        suggestType: 'manager',
        jsonData: Ext.JSON.decode(Ext.getDom('managerMultiData').value),
        inputFieldName: 'managers',
        baseParams:
        {
            'type':'manager',
            context: 'Manager'
        },
        contextPath: CONTEXT_PATH
    });
  }
  
  if(Ext.get('applicationMultiData')) {
    var applicationsMultiSuggest = new SailPoint.MultiSuggest({
        renderTo: 'applicationsMultiSuggest',
        suggestType: 'application',
        jsonData:Ext.JSON.decode(Ext.getDom('applicationMultiData').value),
        inputFieldName: 'applicationsSuggest',
        contextPath:CONTEXT_PATH
    });
  }
  
  if(Ext.get('signersSuggestInfo')) {
    var signersSuggest = new SailPoint.MultiSuggest({
        id: 'signersMultiSuggest',
        renderTo: 'signersSuggestDiv',
        suggestType: 'identity',
        jsonData: Ext.decode(Ext.getDom('signersSuggestInfo').innerHTML),
        baseParams: {context: 'Global'},
        inputFieldName : 'signersSuggest',
        contextPath: CONTEXT_PATH
    });                      
  }
}
