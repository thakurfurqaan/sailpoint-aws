/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Generic Approval panel for Inline workflow form which allow user to fill
 * approval attributes and save to database.
 * Below attributes must be passed while instantiating a class.
 * 1. referenceables - reference variable list of form
 * 2. parentObject - Parent object to call methods of parent component
 * 
 * @author Navnath.Misal
 */

Ext.define('SailPoint.form.editor.ApprovalPanel', {
    extend: 'Ext.form.Panel',

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////

    LABEL_SEPERATOR: '',

    /////////////////////////////////////////////
    //  configuration attribute                //
    /////////////////////////////////////////////

    formSend: null,

    formReturn: null,

    approvalPanelCombo: null,

    stringComponent: null,

    callables: null,

    reference: null,

    border: false,

    callablesType : 'Action',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    initComponent : function() {
        var me = this;

        var formTitle = new Ext.form.TextField ({
            id: 'workflowFormTitle',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_title}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        var formSubtitle = new Ext.form.TextField ({
            id: 'workflowFormSubtitle',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_subtitle}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        var formWizard = new Ext.form.field.Checkbox ({
            id: 'workflowFormWizard',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_wizard}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        // Form send component
        me.formSend = Ext.create('Ext.form.TextField', {
            fieldLabel: '#{msgs.workflow_send}',
            labelSeparator: me.LABEL_SEPERATOR,
            id: 'formSend',
            cls: 'approvalSendReturn',
            height: 30
        });

        // Form return component
        me.formReturn = Ext.create('Ext.form.TextField', {
            fieldLabel: '#{msgs.workflow_return}',
            labelSeparator: me.LABEL_SEPERATOR,
            id: 'formReturn',
            cls: 'approvalSendReturn',
            height: 30
        });

        var ownerProperties = [
            {name: '#{msgs.workflow_script_string}',
             value: SailPoint.form.editor.FormEditor.TYPE_STRING},
            {name: '#{msgs.workflow_script_reference}',
             value: SailPoint.form.editor.FormEditor.TYPE_REFERENCE},
            {name: '#{msgs.field_editor_rule}',
             value: SailPoint.form.editor.FormEditor.TYPE_RULE},
            {name: '#{msgs.field_editor_script}',
             value: SailPoint.form.editor.FormEditor.TYPE_SCRIPT},
            {name: '#{msgs.workflow_script_call}',
             value: SailPoint.form.editor.FormEditor.TYPE_CALL}
        ];

        // Drop down - approval panel properties
        me.approvalPanelCombo = new Ext.form.ComboBox({
            fieldLabel: '#{msgs.template_editor_owner}',
            labelSeparator: me.LABEL_SEPERATOR,
            cls: 'formOwnerCombo',
            queryMode:'local',
            triggerAction: 'all',
            displayField: 'name',
            valueField: 'value',
            height: 30,
            value: SailPoint.form.editor.FormEditor.TYPE_STRING,
            store : {
                model: 'SailPoint.model.NameValue',
                data: ownerProperties
            }
        });

        me.approvalPanelCombo.on('change', function() {
            if(Ext.get(me.id) && Ext.get(me.id).isVisible()) {
                me.displayApprovalPanelField(this.getValue(), me.parentObject);
            }
        });

        me.formRulesStore = new Ext.data.Store ({
            model : 'SailPoint.model.NameValue',
            autoLoad: true,
            proxy : {
                type : 'ajax',
                url: CONTEXT_PATH + '/include/rulesDataSource.json',
                extraParams: {'type':'Owner'},
                reader : {
                    type : 'json',
                    root: 'objects'
                }
            }
        });

        // Rule drop down and editor
        me.formOwnerRule = new SailPoint.Rule.Editor.RuleComboBox ({
            id: 'approvalFormOwnerRule',
            cls: 'formOwnerRule',
            name: 'formOwnerRule',
            emptyText: '#{msgs.select_rule}',
            displayField: 'name',
            valueField: 'value',
            triggerAction: 'all',
            width: 300,
            height: 30,
            listConfig : {width:300},
            store: me.formRulesStore,
            hidden: true
        });

        // Script text area
        me.formOwnerScript = new Ext.form.TextArea ({
            id: 'approvalFormOwnerScript',
            cls: 'formOwnerScript',
            name: 'formOwnerScript',
            height: 50,
            grow: true,
            hidden: true
        });

        // Value component
        me.stringComponent = new Ext.form.TextField({
            id: 'sourceTextfield',
            name: 'sourceTextfield',
            hidden: false,
            cls: 'approvalOwner',
            height: 30
        });

        // Call store
        me.callablesStore = SailPoint.Store.createRestStore({
            url: CONTEXT_PATH + '/rest/workflows/callables/'+me.callablesType,
            root: 'objects',
            fields: ['id', 'name', 'description', 'requiredArguments']
        });

        // Call method component
        me.callables = new Ext.form.ComboBox({
            id: 'aprovalSourceCall',
            name: 'sourceCall',
            emptyText: '#{msgs.select_method}',
            listConfig : {
                getInnerTpl : function() {
                    return '<div data-qtip="{description}<br/>' +
                        '<strong>#{msgs.workflow_required_arguments}: </strong>' +
                        '<ul><tpl for="requiredArguments">' +
                        '<li>{name}<tpl if="description"> - {description}</tpl></li>' +
                        '</tpl></ul>" class="x-combo-list-item">{name}</div>';
                }
            },
            store:me.callablesStore,
            triggerAction: 'all',
            hidden:true,
            displayField: 'name',
            height: 30,
            cls: 'aprovalSourceCall',
        });

        // The referenceables items that can be set in the "reference" value
        var variables = [];
        if(me.referenceables) {
            for(var i=0; i<me.referenceables.length; i++) {
                variables.push(me.referenceables[i].name);
            }
        }

        // Reference component
        me.reference = new Ext.form.ComboBox({
            id: 'aprovalSourceReference',
            emptyText: '#{msgs.select_reference}',
            store:variables,
            hidden:true,
            listConfig : {width:400},
            height: 30,
            cls: 'aprovalSourceReference'
        });

        var workflowAttributePanel = new Ext.form.Panel ({
            id: 'workflowAttributePanel',
            cls: 'attributePanel',
            border: false,
            columnWidth: 0.5,
            items: [formTitle, formSubtitle, formWizard]
        });

        var approvalPanel = new Ext.form.Panel ({
            id: 'approvalPanel',
            cls: 'ownerDetailPanel',
            border: false,
            columnWidth: 0.5,
            items: [me.formSend,
                    me.formReturn,
                    me.approvalPanelCombo,
                    me.formOwnerScript,
                    me.formOwnerRule,
                    me.stringComponent,
                    me.callables,
                    me.reference
                   ]
        });

        Ext.apply(me, {
            id: 'workflowDetailPanel',
            cls: 'workflowDetailPanel',
            layout: 'column',
            autoScroll: true,
            width: me.windowWidth,
            items: [workflowAttributePanel,
                    approvalPanel
                   ]
        });

        me.callParent(arguments);
    },

    /**
     * Displays the correct default value field based
     * on what the value source is set to.
     */
    displayApprovalPanelField: function(ownerType, parentObject) {
        var me = this,
            height,
            margin = 18;

        Ext.get(me.formOwnerScript.id).hide();
        Ext.get(me.formOwnerRule.id).hide();
        Ext.get(me.stringComponent.id).hide();
        Ext.get(me.callables.id).hide();
        Ext.get(me.reference.id).hide();

        // calculating new height after details panel expansion
        height = parentObject.getcontainerPanelHeight() - parentObject.getDetailPanelheight();

        // Check is errorPanel exists and consider its height
        if(Ext.get('errorPanel') && Ext.get('errorPanel').isVisible()) {
            height = height - me.parentObject.errorPanel.getHeight() - 5;
        }

        if(ownerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
            me.displayApprovalComponent(me.formOwnerScript.id);
            // consider rule drop down height
            height = height - me.formOwnerScript.height;

        } else if(ownerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
            me.displayApprovalComponent(me.formOwnerRule.id);
            // consider script area height
            height = height - me.formOwnerRule.height;

        } else if(ownerType === SailPoint.form.editor.FormEditor.TYPE_STRING) {
            me.displayApprovalComponent(me.stringComponent.id);
            // consider value text field height
            height = height - me.stringComponent.height;

        } else if(ownerType === SailPoint.form.editor.FormEditor.TYPE_REFERENCE) {
            me.displayApprovalComponent(me.reference.id);
            // consider reference drop down height
            height = height - me.reference.height;

        } else if(ownerType === SailPoint.form.editor.FormEditor.TYPE_CALL) {
            me.displayApprovalComponent(me.callables.id);
            // consider call method drop down height
            height = height - me.callables.height;
        }

        height = height - margin;
        parentObject.resizeContainerPanel(height);
    },

    /**
     * Display specified component in Slide-in fashion
     * */
    displayApprovalComponent : function(componentId) {
        Ext.get(componentId).slideIn('t', {
            easing: 'easeOut',
            duration: 200
        });
    }
})
