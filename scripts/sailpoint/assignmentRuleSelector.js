/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This file contains a function that initializes the selector field on pages that include
 * selector.xhtml
 */
Ext.ns('SailPoint'); 

Ext.define('SailPoint.AssignmentRule', {
    statics: {
        initializeSelectors: function(readOnly, showAllApplications) {
            var suggestFields = Ext.DomQuery.select('input[class=selectorApplicationSuggest]');
            var suggestFieldId;
            var existingSuggestId;
            var existingSuggest;
            
            for (var i = 0; i < suggestFields.length; ++i) {
                suggestFieldId = suggestFields[i].id;
                
                // Let's make sure that we are not duplicating work that was already done
                existingSuggestId = suggestFieldId + 'Cmp';
                existingSuggest = Ext.getCmp(existingSuggestId);
                if (!existingSuggest) {
                    // This input is clean, so let's apply a suggest now
                    SailPoint.AssignmentRule.appSuggest = new SailPoint.BaseSuggest({
                        id: suggestFieldId + 'Cmp',
                        renderTo: suggestFields[i].id + "Suggest",                
                        binding: suggestFields[i].id,
                        fields : ['displayName', 'id', 'name'],
                        baseParams: { 'suggestType': 'application' },
                        extraParams: showAllApplications === true ? { } : { 'aggregationType': 'account' },
                        emptyText: '#{msgs.select_application}',
                        noResultsText: '#{msgs.select_application}',
                        valueNotFoundText: '#{msgs.select_application}',
                        disabled: readOnly === true,
                        valueField: 'name'
                    });
                }
            }

            suggestFields = Ext.DomQuery.select('input[class=selectorTargetSourceSuggest]');
            for (var i = 0; i < suggestFields.length; ++i) {
                suggestFieldId = suggestFields[i].id;

                // Let's make sure that we are not duplicating work that was already done
                existingSuggestId = suggestFieldId + 'Cmp';
                existingSuggest = Ext.getCmp(existingSuggestId);
                if (!existingSuggest) {
                    // This input is clean, so let's apply a suggest now
                    SailPoint.AssignmentRule.targetSourceSuggest = new SailPoint.BaseSuggest({
                        id: suggestFieldId + 'Cmp',
                        renderTo: suggestFields[i].id + "Suggest",
                        binding: suggestFields[i].id,
                        fields : ['displayName', 'id', 'name'],
                        baseParams: { 'suggestType': 'targetSource' },
                        emptyText: '#{msgs.select_target_source}',
                        noResultsText: '#{msgs.select_target_source}',
                        valueNotFoundText: '#{msgs.select_target_source}',
                        disabled: readOnly === true,
                        valueField: 'name'
                    });
                }
            }
        }     
    }
});
