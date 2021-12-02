Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.User');

SailPoint.Report.User.initialize = function() {
  var managersMultiSuggest = new SailPoint.MultiSuggest({
      id: 'userReportManagers',
      renderTo: 'managersMultiSuggest',
      suggestType: 'manager',
      jsonData: Ext.decode(Ext.getDom('managerSuggestInfo').innerHTML),
      inputFieldName: 'managers',
      baseParams: {'type': 'manager', context: 'Manager'}
  });                                
  
  var businessRolesMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'businessRolesMultiSuggest',
      suggestType: 'assignableRole',
      jsonData: Ext.decode(Ext.getDom('roleSuggestInfo').innerHTML),
      inputFieldName: 'businessRoles'
  });
  
  var applicationsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'applicationsMultiSuggest',
      suggestType: 'application',
      jsonData: Ext.decode(Ext.getDom('applicationSuggestInfo').innerHTML),
      inputFieldName: 'applicationsSuggest'
  });
  
  var groupsMultiSuggest = new SailPoint.MultiSuggest({
      renderTo: 'groupsMultiSuggest',
      suggestType: 'group',
      jsonData: Ext.decode(Ext.getDom('groupsSuggestInfo').innerHTML),
      inputFieldName: 'groupsSuggest',
      baseParams: {'type': 'group'}
  });
  
  var checkBox1 = Ext.getDom('editForm:lastLoginSelect');
  toggleDisplay(Ext.getDom('lastLoginDiv'), !(checkBox1.checked));
    
  var checkBox2 = Ext.getDom('editForm:lastRefreshSelect');
  toggleDisplay(Ext.getDom('lastRefreshDiv'), !(checkBox2.checked));
  
  toggleDisabled(Ext.getDom('editForm:inactiveSelect'), !Ext.getDom('editForm:useInactiveSelect').checked);
};

SailPoint.Report.User.updateGroup = function(selectBox) {
  Ext.getDom('editForm:componentSelect').disabled = true;
  Ext.getDom('editForm:groupSelect').value = selectBox.value;
  setTimeout('Ext.getDom(\'editForm:groupUpdateBtn\').click()', 100);
};
