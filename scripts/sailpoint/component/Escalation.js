/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/notification/Escalation.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.notification");


Ext.define('sailpoint.notification.EscalationConfig', {
    extend : 'sailpoint.notification.ConfigBase'

    , statics : {
        copySpecificProperties : function (from, to) {
            to.maxReminders = from.maxReminders;
            to.escalationRuleId = from.escalationRuleId;
        }

    }
    , maxReminders : 0
    , escalationRuleId : null
    , clone : function () {
        var copy =  Ext.create('sailpoint.notification.EscalationConfig');
        sailpoint.notification.ConfigBase.copyBaseProperties(this, copy);
        sailpoint.notification.EscalationConfig.copySpecificProperties(this, copy);
        return copy;
    }
});


Ext.define('sailpoint.notification.Escalation', {
    extend : 'sailpoint.notification.NotificationBase'
    , constructor : function () {
        this.callParent(arguments);
    }

    , maxRemindersRadio : null
    , afterRadio : null
    , beforeRadio : null
    , maxRemindersText : null
    , maxRemindersErrorLabel : null
    , escalationAfterText : null
    , daysAfterErrorLabel : null
    , escalationBeforeText : null
    , daysBeforeErrorLabel : null
    , escalationRuleErrorLabel : null
    , input : null
    , createConfigFromCurrentSelectedOptions : function () {
        var config =  Ext.create('sailpoint.notification.EscalationConfig');
        config.sequence = this.input.sequence;
        config.previousConfig = this.input.previousConfig;
        config.nextConfig = this.input.nextConfig;
        config.type = "Escalation";
        if (this.maxRemindersRadio.checked) {
            config.maxReminders = SailPoint.Utils.getIntValueFromElement(this.maxRemindersText, 0);
        } else if (this.afterRadio.checked) {
            config.before = false;
            config.startHowManyDays = SailPoint.Utils.getIntValueFromElement(this.escalationAfterText, 0);
        } else {
            config.before = true;
            config.startHowManyDays = SailPoint.Utils.getIntValueFromElement(this.escalationBeforeText, 0);
        }
        config.escalationRuleId = SailPoint.Utils.getValueFromSelect(this.getEscalationRuleSelect(), null);
        this.copyBaseValuesFromInput(config);
        return config;
    }
    , setInput : function (parent, addMode, val) {
        this.parent = parent;
        this.addMode = addMode;
        this.input = val;
        this.loadValuesFromInput();
    }
    , validate : function () {
        var valid = sailpoint.notification.Escalation.superclass.validate.call (this);
        if (valid == false) {
            return false;
        }
        Ext.get(this.maxRemindersErrorLabel).setVisibilityMode(Ext.Element.DISPLAY).hide();
        Ext.get(this.daysAfterErrorLabel).setVisibilityMode(Ext.Element.DISPLAY).hide();
        Ext.get(this.daysBeforeErrorLabel).setVisibilityMode(Ext.Element.DISPLAY).hide();
        Ext.get(this.escalationRuleErrorLabel).setVisibilityMode(Ext.Element.DISPLAY).hide();
        if (this.maxRemindersRadio.checked) {
            if (!SailPoint.Utils.validateNumberGreaterThanZero(this.maxRemindersText, this.maxRemindersErrorLabel)) {
                valid = false;
            }
        } else if (this.afterRadio.checked) {
            if (!SailPoint.Utils.validateNumberGreaterThanZero(this.escalationAfterText, this.daysAfterErrorLabel)) {
                valid = false;
            }
        } else {
            if (!SailPoint.Utils.validateNumberGreaterThanZero(this.escalationBeforeText, this.daysBeforeErrorLabel)) {
                valid = false;
            }
        }
        if (this.getEscalationRuleSelect().selectedIndex < 1) {
            valid = false;
            Ext.get(this.escalationRuleErrorLabel).show();
            this.escalationRuleErrorLabel.innerHTML = "#{msgs.escalation_select_rule}";
        }
        return valid;
    }
    , initDom : function () {
        sailpoint.notification.Escalation.superclass.initDom.call (this);
        this.maxRemindersRadio = Ext.getDom("maxRemindersRadio");
        this.afterRadio = Ext.getDom("afterRadio");
        this.beforeRadio = Ext.getDom("beforeRadio");
        this.maxRemindersRadio.onclick = this.onRadioClick.bind(this);
        this.afterRadio.onclick = this.onRadioClick.bind(this);
        this.beforeRadio.onclick = this.onRadioClick.bind(this);
        this.maxRemindersText = Ext.getDom("maxRemindersText");
        this.maxRemindersErrorLabel = Ext.getDom("maxRemindersErrorLabel");
        this.escalationAfterText = Ext.getDom("escalationAfterText");
        this.daysAfterErrorLabel = Ext.getDom("daysAfterErrorLabel");
        this.escalationBeforeText = Ext.getDom("escalationBeforeText");
        this.daysBeforeErrorLabel = Ext.getDom("daysBeforeErrorLabel");
        this.escalationRuleErrorLabel = Ext.getDom("escalationRuleErrorLabel");
    }
    , getEscalationRuleSelect : function () {
        return Ext.getDom("escalationRuleSelect");
    }
    , loadValuesFromInput : function () {
        sailpoint.notification.Escalation.superclass.loadValuesFromInput.call (this);
        this.enableDisableMaxReminders();
        if (this.input.maxReminders > 0) {
            this.maxRemindersRadio.checked = true;
            this.maxRemindersText.value = "" + this.input.maxReminders;
            this.escalationAfterText.value = "";
            this.escalationBeforeText.value = "";
        } else if (this.input.before) {
            this.beforeRadio.checked = true;
            this.escalationBeforeText.value = "" + this.input.startHowManyDays;
            this.maxRemindersText.value = "";
            this.escalationAfterText.value = "";
        } else {
            this.afterRadio.checked = true;
            this.escalationAfterText.value = "" + this.input.startHowManyDays;
            this.maxRemindersText.value = "";
            this.escalationBeforeText.value = "";
        }
        SailPoint.Utils.setValueInSelect(this.getEscalationRuleSelect(), this.input.escalationRuleId);
    }
    , disable : function () {
        sailpoint.notification.Escalation.superclass.disable.call (this);
        this.maxRemindersRadio.disabled = true;
        this.beforeRadio.disabled = true;
        this.afterRadio.disabled = true;
        this.maxRemindersText.disabled = true;
        this.getEscalationRuleSelect().disabled = true;
        this.escalationAfterText.disabled = true;
        this.escalationBeforeText.disabled = true;
    }
    , enable : function () {
        sailpoint.notification.Escalation.superclass.enable.call (this);
        this.maxRemindersRadio.disabled = false;
        this.beforeRadio.disabled = false;
        this.afterRadio.disabled = false;
        this.maxRemindersText.disabled = false;
        this.getEscalationRuleSelect().disabled = false;
        this.escalationAfterText.disabled = false;
        this.escalationBeforeText.disabled = false;
    }
    , enableDisableMaxReminders : function () {
        var enableMax = false;
        if (this.input.previousConfig != null && this.input.previousConfig.type == "Reminder") {
            var previousConfig = this.input.previousConfig;
            if (previousConfig.once == false) {
                enableMax = true;
            }
        }
        if (enableMax) {
            this.maxRemindersRadio.disabled = false;
            this.maxRemindersText.disabled = false;
        } else {
            this.maxRemindersRadio.disabled = true;
            this.maxRemindersText.disabled = true;
        }
    }
    , onRadioClick : function () {
        if (this.maxRemindersRadio.checked) {
            this.escalationAfterText.value = "";
            this.escalationBeforeText.value = "";
        } else if (this.afterRadio.checked) {
            this.maxRemindersText.value = "";
            this.escalationBeforeText.value = "";
        } else {
            this.maxRemindersText.value = "";
            this.escalationAfterText.value = "";
        }
    }
});
