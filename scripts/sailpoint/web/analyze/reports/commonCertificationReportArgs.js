Ext.ns('SailPoint', 
       'SailPoint.Report', 
       'SailPoint.Report.Certification');

SailPoint.Report.Certification.initializeCommonArgs = function() {
    var tagsMultiSuggest = new SailPoint.MultiSuggest({
        renderTo: 'tagsMultiSuggest',
        suggestType: 'tag',
        jsonData: Ext.JSON.decode(Ext.getDom('tagsMultiData').value),
        inputFieldName: 'tags',
        contextPath: CONTEXT_PATH
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
