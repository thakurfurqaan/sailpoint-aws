Ext.ns('SailPoint.Define.Trigger.Trigger');

/**
 * The type of the IdentityTrigger for the certification event changed.  Hide
 * and show the appropriate fields.
 * 
 * @param  selectBox  The event type select box.
 */
SailPoint.Define.Trigger.Trigger.triggerTypeChanged = function(selectBox) {
    var selectedVal = selectBox.options[selectBox.selectedIndex].value;

    var attrChangeFields =
        Ext.Array.toArray([ Ext.getDom('attributeName'), Ext.getDom('oldAttributeFilter'), Ext.getDom('newAttributeFilter') ]);
    var managerFields =
        Ext.Array.toArray([ Ext.getDom('oldManagerFilter'), Ext.getDom('newManagerFilter') ]);
    var ruleFields =
        Ext.Array.toArray([ Ext.getDom('triggerRule') ]);
    var alertFields =
        Ext.Array.toArray([ Ext.getDom('identitySelect') ]);

    _showOrHide(attrChangeFields, 'AttributeChange' === selectedVal);
    _showOrHide(managerFields, 'ManagerTransfer' === selectedVal);
    _showOrHide(ruleFields, 'Rule' === selectedVal);
    _showOrHide(alertFields, 'Alert' !== selectedVal);
};
