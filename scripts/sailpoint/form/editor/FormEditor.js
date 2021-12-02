/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component that allows creation and editing of Form Objects.
 * Currently it is associated with applications, roles and workflows from Centralize Form Location.
 */

Ext.ns('SailPoint',
       'SailPoint.form',
       'SailPoint.form.editor',
       'SailPoint.form.editor.FormEditor');

// Flag to indicate if we have loaded angular on the page yet for this form editor.
// TODO: Figure out a better approach for loading angular apps in windows on Ext pages, this is hacky
SailPoint.form.editor.angularLoaded = false;

SailPoint.form.editor.FormEditor.EditorPanel = null;

SailPoint.form.editor.FormEditor.ShowEditorPanel = function(beanType, usage) {
    if (!SailPoint.form.editor.FormEditor.EditorPanel) {
        SailPoint.form.editor.FormEditor.EditorPanel = new SailPoint.form.editor.FormEditor({
            id: 'formEditor',
            beanType: beanType,
            usage: usage,
            window: window
        });
        SailPoint.form.editor.FormEditor.EditorPanel.render('formEditorPanel');
        SailPoint.form.editor.FormEditor.EditorPanel.load();
    } else {
        SailPoint.form.editor.FormEditor.EditorPanel.setUsage(usage);
    }
};

Ext.define('SailPoint.form.editor.FormEditor', {
    extend: 'Ext.panel.Panel',
    requires: [
        'SailPoint.form.editor.SectionEditor',
        'SailPoint.form.editor.RowEditor',
        'SailPoint.form.editor.FieldEditor',
        'SailPoint.form.editor.FormItemTree',
        'SailPoint.model.FormItem'
    ],
    uses: 'SailPoint.form.editor.FormItemHelper',

    /////////////////////////////////////////////
    // constants                               //
    /////////////////////////////////////////////
    statics: {
        TYPE_NONE: 'none',
        TYPE_LITERAL: 'literal',
        TYPE_RULE: 'rule',
        TYPE_SCRIPT: 'script',
        TYPE_STRING: 'string',
        TYPE_ROLE_OWNER: 'IIQRoleOwner',
        TYPE_APP_OWNER: 'IIQApplicationOwner', // Deprecated
        TYPE_REQUESTER: 'IIQRequester',
        TYPE_DEPENDENCY: 'appDependency',
        TYPE_REFERENCE: 'ref',
        TYPE_CALL: 'call'
    },

    // Miscellaneous
    LABEL_SEPERATOR: '',

    FORM_ITEM_TYPE: 'formItemType',

    SECTION: 'section',

    ROW: 'row',

    FIELD: 'field',

    BUTTON: 'button',

    // Path to the FormAppModule, required for bootstrapping angular
    FORM_APP_MODULE_PATH: 'form/FormAppModule.js',

    // ID of button to click in the sp-form-preview directive to reload form
    FORM_PREVIEW_LOAD_BTN_ID: 'spFormPreviewLoadBtn',

    // Module name for the form app
    FORM_APP_MODULE_NAME: 'sailpoint.form.app',

    // Select for the app root element
    APP_BOOTSTRAP_ELEMENT_SELECTOR: '.sp-ui-app',

    /////////////////////////////////////////////
    // configuration                           //
    /////////////////////////////////////////////
    formItemPanel: null,

    formItemStore: null,

    fieldEditorForm: null,

    fieldEditorPanel: null,

    /**
     * Form Section array to serialize into JSON.
     */
    sectionArray: null,

    /**
     * Form Buttons array to serialize into JSON.
     */
    buttonArray: null,

    /**
     * Clone of form item tree
     */
    cloneOfItems: null,

    applicationSuggest: null,

    requireApplication: false,

    requireName: false,

    formOwnerMethod: null,

    formOwnerSource: null,

    beanType: null,

    usage: null,

    formNameDescPanel : null,

    addSectionButton: null,

    previewButton : null,

    saveButton : null,

    detailButton: null,

    detailPanel: null,

    formButtonsPanel: null,

    containerPanel: null,

    formButtonsPanelItemArray: null,

    sectionEditor: null,

    rowEditor: null,

    fieldEditor: null,

    /////////////////////////////////////////////
    // functions                               //
    /////////////////////////////////////////////
    initComponent : function() {
        me = this;
        if (this.beanType == 'application') {
            this.requireName = true;
            // In this case the status of review required will be initialized when 
            // the usage is applied to this editor.  Apps are special because all the
            // usages share an editor.
        } else if (this.beanType == 'role') {
            this.requireApplication = true;
            this.requireName = true;
        } else if (this.beanType == 'identity') {
            this.requireApplication = false;
            this.requireName = true;
        } else if (this.beanType == 'workflow') {
            this.requireApplication = false;
            this.requireName = true;
        } else {
            this.requireApplication = false;
            this.requireName = false;
        }

        this.formName = new Ext.form.TextField ({
            id: 'formName',
            margin: '6 5 0 5',
            columnWidth : 0.3,
            emptyText: '#{msgs.form_editor_name}',
            submitEmptyText : false,
            allowBlank: !this.requireName
        });

        this.formDescription = new Ext.form.TextField ({
            id: 'formDescription',
            name: 'formDescription',
            margin: '6 5 0 0',
            columnWidth : 0.5,
            emptyText : '#{msgs.form_editor_description}',
            submitEmptyText : false
        });

        this.detailButton = new Ext.Button({
            id: 'details',
            cls: 'secondaryBtn',
            margin: '7 5 0 0',
            columnWidth : 0.08,
            height: 28,
            text:'#{msgs.form_editor_detail_button}',
            window: this,
            enableToggle: true,
            handler : function () {
                me.displayOwnerDetail(this);
            }
        });

        this.saveButton = new Ext.Button({
            text: '#{msgs.button_save}',
            margin: '7 0 0 0',
            columnWidth : 0.08,
            height: 28,
            window: this,
            handler: function () {
                if (me.save()) {
                    me.window.exit();
                }
            }
        });

        this.closeButton = new Ext.form.field.Display({
            value: 'X',
            cls: 'closeButton',
            height: 40,
            columnWidth : 0.04,
            border: true,
            listeners: {
                render: function(c) {
                    c.getEl().on({
                        click: function(el) {
                            me.closeForm();
                        }
                    });
                }
            }
        });

        this.formNameDescPanel = Ext.create('Ext.container.Container', {
                id: 'formNameDescPanel',
                cls: 'formNameDescPanel',
                layout: 'column',
                height: 41,
                items: [this.formName,
                        this.formDescription,
                        this.detailButton,
                        this.saveButton,
                        this.closeButton
                ]
        });

        var formTitle = new Ext.form.TextField ({
            id: 'formTitle',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_title}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        var formSubtitle = new Ext.form.TextField ({
            id: 'formSubtitle',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_subtitle}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        var formWizard = new Ext.form.field.Checkbox ({
            id: 'formWizard',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_wizard}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });
        
        var includeHidden = new Ext.form.field.Checkbox ({
            id: 'includeHidden',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_include_hidden}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });
        
        var hideIncomplete = new Ext.form.field.Checkbox ({
            id: 'hideIncomplete',
            cls: 'formAttribute',
            fieldLabel: '#{msgs.form_editor_hide_incomplete}',
            height: 30,
            labelSeparator: me.LABEL_SEPERATOR
        });

        var ownerProperties = [
                {name: '#{msgs.none}',
                 value: SailPoint.form.editor.FormEditor.TYPE_NONE},
                {name: '#{msgs.field_editor_label_requester}',
                 value: SailPoint.form.editor.FormEditor.TYPE_REQUESTER},
                {name: '#{msgs.field_editor_rule}',
                 value: SailPoint.form.editor.FormEditor.TYPE_RULE},
                {name: '#{msgs.field_editor_script}',
                 value: SailPoint.form.editor.FormEditor.TYPE_SCRIPT}
            ];

        /** Only show the role owner field if this is on the roles grid **/
        if (this.requireApplication) {
            ownerProperties.push(
                {name: '#{msgs.field_editor_owner_role}', 
                 value: SailPoint.form.editor.FormEditor.TYPE_ROLE_OWNER}
            );
        }

        if (this.requireApplication || this.beanType=='application') {
            ownerProperties.push(
                {name: '#{msgs.template_editor_owner_application}',
                 value: SailPoint.form.editor.FormEditor.TYPE_APP_OWNER}
            );
        }
    
        // Drop down - owner detail properties
        me.formOwnerCombo = new Ext.form.ComboBox({
            fieldLabel: '#{msgs.template_editor_owner}',
            labelSeparator: me.LABEL_SEPERATOR,
            cls: 'formOwnerCombo',
            queryMode:'local',
            triggerAction: 'all',
            displayField: 'name',
            valueField: 'value',
            height: 30,
            value: SailPoint.form.editor.FormEditor.TYPE_NONE,
            store : {
                model: 'SailPoint.model.NameValue',
                data: ownerProperties
            }
          });

        me.formOwnerCombo.on('change', function() {
            if (Ext.get('detailPanel') && Ext.get('detailPanel').isVisible()) {
                me.displayOwnerField(this.getValue());
            }
        });

        this.formRulesStore = new Ext.data.Store ({
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

        this.formOwnerRule = new SailPoint.Rule.Editor.RuleComboBox ({
            id: 'formOwnerRule',
            cls: 'formOwnerRule',
            name: 'formOwnerRule',
            emptyText: '#{msgs.select_rule}',
            displayField: 'name',
            valueField: 'value',
            triggerAction: 'all',
            width: 300,
            height: 30,
            listConfig : {width:300},
            store: this.formRulesStore,
            hidden: true
        });

        this.formOwnerScript = new Ext.form.TextArea ({
            id: 'formOwnerScript',
            cls: 'formOwnerScript',
            name: 'formOwnerScript',
            grow: true,
            height: 50,
            hidden: true
        });

        /** Application Suggest drop down is only for Role provisioning form
         */
        if (this.requireApplication) {
            this.applicationSuggest = new SailPoint.BaseSuggest ({
                id: 'formApplicationSuggestCmp',
                cls: 'applicationSuggest',
                baseParams: {'suggestType': 'application', 'aggregationType': 'account'},
                fieldLabel:'#{msgs.application}',
                labelSeparator: me.LABEL_SEPERATOR,
                allowBlank: false,
                binding: Ext.get('formApplication') ? 'formApplication' : null,
                emptyText: '#{msgs.select_application}',
                height: 30,
                hidden: true
            });
        }

        var attributePanelItems,
            appAndOwnerDetailsItems;

        // Owner details will not appear for the stand-alone
        // workflow form and Identity provisioning policy form.
        if (this.beanType === 'identity' || (this.beanType === 'workflow' && this.usage === 'Standalone')) {
            attributePanelItems = [formTitle, formSubtitle, formWizard, includeHidden, hideIncomplete];
        } else {
            attributePanelItems = [formTitle, formSubtitle, formWizard, includeHidden, hideIncomplete];
            appAndOwnerDetailsItems = [this.applicationSuggest, me.formOwnerCombo,
                                this.formOwnerRule, this.formOwnerScript];
        }

        // form's extended attributes panel
        var attributePanel = new Ext.form.Panel ({
            id: 'attributePanel',
            cls: 'attributePanel',
            border: false,
            fieldDefaults: {
              labelWidth: 200
            },
            items: attributePanelItems
        });

        // form's owner properties panel
        var appAndOwnerDetailsPanel = new Ext.form.Panel ({
            id: 'appAndOwnerDetailsPanel',
            cls: 'ownerDetailPanel',
            border: false,
            items: appAndOwnerDetailsItems
        });

        this.detailPanel = new Ext.Panel ({
            id: 'detailPanel',
            cls: 'detailPanel',
            layout: 'column',
            width: this.window.width,
            border: false,
            hidden: true,
            items: [attributePanel, appAndOwnerDetailsPanel],
            renderTo: Ext.getBody()
        });

        this.addSectionButton = new Ext.Button({
            id: 'addSectionBtn',
            cls: 'secondaryBtn',
            margin: '3 4 5 0',
            text: '#{msgs.form_editor_add_section}',
            columnWidth : 0.166,
            handler : function () {
                var rootNode = me.formItemPanel.getRootNode(),
                    hasNotApplied;

                // Instantiate helper - lazy loading is preferred
                var formItemHelper = new SailPoint.form.editor.FormItemHelper({
                    nodeType: me.SECTION, // Crate a node of type section
                    treeView: me.formItemPanel.getView(),
                    parentNode: rootNode
                });

                // Check for edit node if exists
                var editNode = formItemHelper.getEditedNode(rootNode);

                if (editNode) {
                    var formItemEditor = formItemHelper.getFormItemEditor(me, editNode);
                    hasNotApplied = formItemHelper.hasNotAppliedChanges(formItemEditor, editNode);
                    if (hasNotApplied) {
                        Ext.Msg.confirm('#{msgs.form_item_edit_confirm_title}',
                            '#{msgs.form_item_edit_confirm_msg}',
                                function(btnText) {
                                    if ('yes' === btnText) {
                                        me.sectionEditor.initSection(formItemHelper);
                                    }
                                }
                        );
                        return false;
                    }
                }
                if (!editNode || !hasNotApplied) {
                    me.sectionEditor.initSection(formItemHelper);
                }
            }
        });

        // Flag to indicate the first time the preview panel is loaded, so we can bootstrap
        this.firstPreview = true;

        this.previewButton = new Ext.Button({
            id: 'previewBtn',
            cls: 'secondaryBtn',
            margin: '3 0 5 0',
            text: "#{msgs.form_editor_preview_button}",
            columnWidth : 0.166,

            handler : function () {
                me.setGlobalPreviewForm();

                me.addSectionButton.hide();
                if (me.addFormButton) {
                    me.addFormButton.hide();
                }
                me.previewButton.hide();
                me.formItemPanel.hide();
                me.fieldEditorPanel.hide();
                me.previewLabel.show();
                me.backButton.show();
                me.previewPanel.show();

                if (!SailPoint.form.editor.angularLoaded) {
                    // First load on the page, do the bootstrap using System.import with AppInitializer.js.
                    // This will also load angular for the first time.
                    System.import(me.FORM_APP_MODULE_PATH);
                    SailPoint.form.editor.angularLoaded = true;
                    me.firstPreview = false;
                } else if (me.firstPreview) {
                    // first load of this instance of FormEditor. This will happen if
                    // multiple FormEditor windows are opened on the same page.
                    // Do the bootstrap here manually since we are not allowed to load angular again.
                    // This is what normally happens in AppInitializer.js
                    var appElement = angular.element(document).find(me.APP_BOOTSTRAP_ELEMENT_SELECTOR)[0];
                    angular.bootstrap(appElement, [me.FORM_APP_MODULE_NAME]);
                    me.firstPreview = false;
                } else {
                    // Otherwise, our app is already bootstrapped, so click the load button to get the form changes
                    document.getElementById(me.FORM_PREVIEW_LOAD_BTN_ID).click();
                }
            }
        });

        this.previewLabel = new Ext.form.Label ({
            id: 'previewLabel',
            cls: 'previewLabel',
            columnWidth : 0.166,
            hidden : true,
            margin: '6 5 0 5',
            text : '#{msgs.form_editor_preview_label}'
        });

        this.backButton = new Ext.Button({
           id : 'backButton',
           cls : 'secondaryBtn',
           columnWidth : 0.166,
           hidden : true,
           margin : '3 4 5 0',
           text : '#{msgs.form_editor_back_button}',

           handler : function() {
               me.previewLabel.hide();
               me.backButton.hide();
               me.previewPanel.hide();

               me.addSectionButton.show();
               if (me.addFormButton) {
                   me.addFormButton.show();
               }
               me.previewButton.show();

               me.formItemPanel.show();
               me.fieldEditorPanel.show();
           }
        });

        formButtonsPanelItemArray = [this.addSectionButton];

        /**
         * Add Button will appear only in case of work flow provisioning form.
         */
        if (this.beanType === 'workflow') {
            formButtonsPanelItemArray.push(this.addFormButton);
        }

        formButtonsPanelItemArray.push(this.previewButton);
        formButtonsPanelItemArray.push(this.previewLabel);
        formButtonsPanelItemArray.push(this.backButton);

        this.formButtonsPanel = new Ext.form.FormPanel({
            id : "formButtonsPanel",
            cls: 'formButtonsPanel',
            layout: 'column',
            height: 35,
            border: false,
            items: formButtonsPanelItemArray
        });

        this.formItemStore = new SailPoint.PagingTreeStore ({
            model: 'SailPoint.model.FormItem',
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'children'
                }
            },
            data: {}
        });

        // form item tree panel
        this.formItemPanel = new SailPoint.form.editor.FormItemTree({
            columnWidth : .5,
            height : this.getcontainerPanelHeight(),
            store : this.formItemStore
        });

        // Initialize SectionEditor class while loading a form
        this.sectionEditor = new SailPoint.form.editor.SectionEditor({
            formEditor: me
        });

        // Initialize RowEditor class while loading a form
        this.rowEditor = new SailPoint.form.editor.RowEditor({
            formEditor: me
        });

        // Initialize FieldEditor class while loading a form
        this.fieldEditor = new SailPoint.form.editor.FieldEditor({
            formEditor: me
        });

        this.fieldEditorPanel = new Ext.Panel ({
            id: 'fieldEditorPanel',
            cls: 'fieldEditorPanel',
            title: '#{msgs.field_editor_title}',
            header: {
                height: 32
            },
            height: this.getcontainerPanelHeight(),
            columnWidth: .5,
            activeItem: 0,
            layout:'card',
            items: [
                new Ext.form.Panel({}), // empty form
                this.sectionEditor,     // section editor form
                this.fieldEditor,       // field editor form
                this.rowEditor,         // row editor form
                this.buttonEditor       // button editor form

            ]
        });

        // Preview panel
        this.previewPanel = new Ext.Panel ({
            id : 'previewPanel',
            cls : 'previewPanel',
            border: false,
            columnWidth: 1,
            height : this.getcontainerPanelHeight(),
            hidden : true,
            autoScroll: true,
            html: '<div class="sp-ui-app"><sp-form-preview sp-config-key="previewFormJSON"/></div>'
        });

        // The Container Panel includes formItemPanel and fieldEditorPanel
        this.containerPanel = new Ext.form.Panel({
            id : "containerPanel",
            border: true,
            height: this.getcontainerPanelHeight(),
            layout: 'column',
            items: [this.formItemPanel, this.fieldEditorPanel, this.previewPanel]
        });

        this.statusBar = Ext.ComponentManager.create ({
            xtype: 'statusbar',
            id: 'formEditorStatusBar',
            defaultText: ''
        });

        // Error panel to display error messages
        this.errorPanel = new Ext.panel.Panel ({
            id: 'errorPanel',
            cls: 'errorPanel',
            title: '#{msgs.label_errors}',
            border: false,
            hidden: true,
            items: [this.statusBar],
            header: {
                titlePosition: 0,
                html: "<span id='errorIcon' class='errorIcon' />" +
                      "<span id='closeIcon' class='closeIcon' onclick='me.displayError(false)' />"
            }
        });

        Ext.apply(this, {
            header: false,
            bodyCls: 'formEditorBody',
            items: this.getItems()
        });

        this.callParent(arguments);
    },

    /**
     * An overridable function for loading the items to be displayed in this panel.
     */
    getItems : function() {
        if (me.beanType === 'workflow' && me.usage !== 'Standalone') {
            return [this.formNameDescPanel,
                this.errorPanel,
                this.approvalPanel,
                this.formButtonsPanel,
                this.containerPanel
            ];
        } else {
            return [this.formNameDescPanel,
                this.errorPanel,
                this.detailPanel,
                this.formButtonsPanel,
                this.containerPanel
            ];
        }
    },

    displayOwnerDetail : function(button) {
        var me = this,
            height,
            margin = 5;

        if (!button.pressed) {
            Ext.get('formOwnerScript') ? Ext.get('formOwnerScript').hide() : null;
            Ext.get('formOwnerRule') ? Ext.get('formOwnerRule').hide() : null;
            Ext.get('sourceTextfield') ? Ext.get('sourceTextfield').hide() : null;
            Ext.get('aprovalSourceCall') ? Ext.get('aprovalSourceCall').hide() : null;
            Ext.get('aprovalSourceReference') ? Ext.get('aprovalSourceReference').hide() : null;

            if (me.beanType === 'workflow' && me.usage !== 'Standalone') {
                me.hideComponent(me.approvalPanel.id);
            } else  {
                me.hideComponent(me.detailPanel.id);
            }
            height = me.getcontainerPanelHeight();
            if (Ext.get('errorPanel') && Ext.get('errorPanel').isVisible()) {
                height = height - me.errorPanel.getHeight() - margin;
            }
            me.resizeContainerPanel(height);

        } else {

            if (me.requireApplication) {
                Ext.get('formApplicationSuggestCmp').show();
            }

            // Call displayComponent as per beanType and usage
            if (me.beanType === 'workflow' && me.usage !== 'Standalone') {
                me.displayComponent(me.approvalPanel.id);
                me.approvalPanel.displayApprovalPanelField(
                    me.approvalPanel.approvalPanelCombo.getValue(),
                    me
                );
            } else {
                me.displayComponent(me.detailPanel.id);
                me.displayOwnerField(me.formOwnerCombo.getValue());
            }
        }
    },

    /**
     * Displays the correct default value field based on what the value source is set to.
     */
    displayOwnerField: function(ownerType) {
        var me = this,
            height,
            margin = 2;

        Ext.get('formOwnerScript') ? Ext.get('formOwnerScript').hide() : null;
        Ext.get('formOwnerRule') ? Ext.get('formOwnerRule').hide() : null;

        // calculating new height after details panel expansion
        height = me.getcontainerPanelHeight() - me.getDetailPanelheight();

        if (Ext.get('errorPanel') && Ext.get('errorPanel').isVisible()) {
            height = height - me.errorPanel.getHeight() - 10;
        }
        if (ownerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
            me.displayComponent('formOwnerScript');

            // Check for role provisioning form
            if (this.requireApplication) {
                margin = 28;
            }

        } else if (ownerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
            me.displayComponent('formOwnerRule');

            // Check for role provisioning form
            if (this.requireApplication) {
                margin = 10;
            }
        }
        height = height - margin;
        me.resizeContainerPanel(height);
    },

    /**
     * Save owner field.
     */
    saveOwnerField : function() {
        if (this.formOwnerCombo.getValue()) {
            this.formOwnerSource = '';
            this.formOwnerMethod = this.formOwnerCombo.getValue();

            if (this.formOwnerMethod === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                this.formOwnerSource = this.formOwnerScript.getValue();
            } else if (this.formOwnerMethod === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                this.formOwnerSource = this.formOwnerRule.getValue();
            } else if (this.formOwnerMethod !== SailPoint.form.editor.FormEditor.TYPE_NONE) {
                this.formOwnerSource = this.formOwnerMethod;
            }

            this.setFieldValue('formOwner', this.formOwnerSource);
            this.setFieldValue('formOwnerType', this.formOwnerMethod);
        }
    },

    /**
     * Save form's extended attributes
     */
    saveFormAttributes : function(attributePanel, attrObject) {

        // Check for formObject present
        if (!me.formObject) {
            me.formObject = { };
        }

        // Check for attributes object present
        if (!Ext.isDefined(me.formObject.attributes) || !me.formObject.attributes) {
            me.formObject.attributes = { };
        }

        attrObject = (attrObject ? attrObject.attributes : me.formObject.attributes);

        // title
        if(attributePanel.items.getCount() > 0) {
            attrObject.title = attributePanel.items.get(0).getValue();
        }
        if (!attrObject.title) {
            delete attrObject.title;
        }

        // subtitle
        if(attributePanel.items.getCount() > 1) {
            attrObject.subtitle = attributePanel.items.get(1).getValue();
        }
        if (!attrObject.subtitle) {
            delete attrObject.subtitle;
        }

        // isWizard
        if(attributePanel.items.getCount() > 2) {
            attrObject.isWizard = attributePanel.items.get(2).getValue().toString();
        }
        if (attrObject.isWizard == "false") {
            delete attrObject.isWizard;
        }
        
        // includeHidden
        if(attributePanel.items.getCount() > 3) {
            attrObject.includeHiddenFields = attributePanel.items.get(3).getValue().toString();
        }
        if (attrObject.includeHiddenFields == "false") {
            delete attrObject.includeHiddenFields;
        }
        
        // hideIncomplete
        if(attributePanel.items.getCount() > 4) {
            attrObject.hideIncompleteFields = attributePanel.items.get(4).getValue().toString();
        }
        if (attrObject.hideIncompleteFields == "false") {
            delete attrObject.hideIncompleteFields;
        }

        return attrObject;

    },

    /**
     * load form's extended attributes
     */
    loadFormAttributes : function(attrObject) {
        if (Ext.isDefined(attrObject.attributes)) {
            var attributePanel = (me.detailPanel) ? me.detailPanel.items.items[0] : me.approvalPanel.items.items[0];
            attributePanel.items.items[0].setValue(attrObject.attributes.title);
            attributePanel.items.items[1].setValue(attrObject.attributes.subtitle);
            attributePanel.items.items[2].setValue(attrObject.attributes.isWizard);
            attributePanel.items.items[3].setValue(attrObject.attributes.includeHiddenFields);
            attributePanel.items.items[4].setValue(attrObject.attributes.hideIncompleteFields);
        }
    },

    /**
     * Flatten out the node into array.
     * Form items cane be - sections, rows, fields and buttons.
     */
    flattenOutNode : function(node, parentArray) {
        var i, formItemArray;

        switch (node.data.formItemType) {
            case (me.SECTION):
                formItemArray = [];

                if (node.hasChildNodes()) {
                    for (i = 0; i < node.childNodes.length; i++) {
                        this.flattenOutNode(node.childNodes[i], formItemArray);
                    }
                }

                // Poor man's deep object cloning.
                var sectionProperties = JSON.parse(JSON.stringify(node.data.properties));

                // Put FormItem [ Rows / Fields ] array to the section.
                // I would like to call this sectionProperties.formItems,
                // but keeping it as fields to avoid major changes.
                sectionProperties.fields = formItemArray;

                if (sectionProperties) {
                    this.sectionArray.push(sectionProperties);
                }
                break;

            case (me.ROW):
                // This will only contain fields, but reusing item array.
                formItemArray = [];

                if (node.hasChildNodes()) {
                    for (i = 0; i < node.childNodes.length; i++) {
                        this.flattenOutNode(node.childNodes[i], formItemArray);
                    }
                }

                var rowProperties = JSON.parse(JSON.stringify(node.data.properties));

               // Put Fields array to the row.
                rowProperties.fields = formItemArray;

                if (rowProperties) {
                    parentArray.push(rowProperties);
                }
                break;

            case (me.FIELD):
                if (node.data.properties) {
                    parentArray.push(node.data.properties);
                }
                break;

            case (me.BUTTON):
                if (node.data.properties) {
                    this.buttonArray.push(node.data.properties);
                }
                break;
        }
    },

    /**
     * Flatten out the form items tree into arrays.
     */
    flattenOutFormItemsTree : function(rootNode) {
        this.sectionArray = [];
        this.buttonArray = [];

        if (rootNode.hasChildNodes()) {
            for (i = 0; i < rootNode.childNodes.length; i++) {
                this.flattenOutNode(rootNode.childNodes[i], null);
            }
        }
    },

    /**
     * Clone the form item tree. The inline
     * workflow form editor uses the clone tree.
     */
    cloneFormItemTree : function (rootNode) {
        var me = this;

        me.cloneOfItems = {id: 'root', text: 'root', children: []};

        me.iterateChildNodes(rootNode, me.cloneOfItems);
    },

    /**
     * Recursive function to iterate over form items tree.
     *
     * @param node - Node to be iterated
     * @param itemsTree - Tree to be populated
     */
    iterateChildNodes: function (node, itemsTree) {
        var i, childNode, formItemArray,
            me = this;

        if (node.hasChildNodes()) {
            for (i = 0; i < node.childNodes.length; i++) {
                childNode = node.childNodes[i];

                if (me.SECTION === childNode.data.formItemType) {
                    // Array of Rows and Fields
                    formItemArray = [];
                    me.iterateChildNodes(childNode, formItemArray);
                    me.pushNodeToTree(itemsTree.children, childNode.data, formItemArray);

                } else if (me.ROW === childNode.data.formItemType) {
                    // Array of column Fields
                    formItemArray = [];
                    me.iterateChildNodes(childNode, formItemArray);
                    // itemsTree here is section.formItemArray
                    me.pushNodeToTree(itemsTree, childNode.data, formItemArray);

                } else if (me.FIELD === childNode.data.formItemType) {
                    // itemsTree here is formItemsArray of Section / Row
                    me.pushNodeToTree(itemsTree, childNode.data, null);

                } else if (me.BUTTON === childNode.data.formItemType) {
                    me.pushNodeToTree(itemsTree.children, childNode.data, null);
                }
            }
        }
    },

    /**
     * Push form item node to an array with following data -
     *     children, expanded, formItemType, leaf, properties, text
     *
     * @param itemArray - FormItem array to be populated
     * @param data      - FormItem node data
     * @param childArray  - Children of FormItem in case of Section and Row
     */
    pushNodeToTree: function (itemArray, data, childArray) {
        if (data.properties) {
            itemArray.push({
                children: childArray,
                expanded: childArray ? true : false,
                formItemType: data.formItemType,
                leaf: data.leaf,
                properties: data.properties,
                text: data.text
            });
        }
    },

    /**
     * Save Form object
     */
    save : function() {
        var me = this,
            itemStore = Ext.getCmp('formItemPanel').getStore(),
            rootNode = itemStore.getRootNode(),
            formItemHelper = new SailPoint.form.editor.FormItemHelper({}),
            editNode = formItemHelper.getEditedNode(rootNode),
            formItemEditor,
            errors = [];

        // Get formItemEditor based on item type
        if (editNode) {
            formItemEditor = formItemHelper.getFormItemEditor(me, editNode);
        }

        if (me.validate(formItemEditor, editNode, errors)) {
            if (editNode) {
                return me.showWarning(formItemEditor, editNode, rootNode, formItemHelper);
            } else {
                return me.submitFormChanges(rootNode);
            }
        } else {
            me.displayError(true, errors);
        }
        return false;
    },

    /**
     * Submit form changes after validating form
     */
    submitFormChanges : function(rootNode) {
        var me = this,
            saveAttributes;

        // Skip it for centralize forms, inline App forms, inline Role forms and identity forms
        if (me.beanType === 'workflow' && me.usage !== 'Standalone') {

            // Clone the item tree for further usage
            me.cloneFormItemTree(rootNode);
        }

        /**
         * Save form's extended attributes as per form type
         */
        saveAttributes = function() {
            var attrObject,
                attributePanel = me.detailPanel.items.items[0];

            // Save form attributes for centralize forms
            if (me.usage === 'Standalone') {
                me.saveFormAttributes(attributePanel, null);
            }

            // Save form attributes for inline workflow form
            else if (me.beanType === 'workflow') {
                me.saveFormAttributes(me.approvalPanel.items.items[0], null);
            }

            // Save form attributes for Application, Role and Identity provisioning policy form
            else {
                if (me.formObject.attributes) {
                    attrObject = Ext.JSON.decode(me.formObject.attributes);
                    me.saveFormAttributes(attributePanel, attrObject);
                } else {
                    attrObject = me.saveFormAttributes(attributePanel, null);
                    attrObject = {attributes : attrObject};
                }

                // convert to json string
                me.formObject.attributes = Ext.JSON.encode(attrObject);
            }
        };

        // Save form's extended attributes
        saveAttributes();

        // Serialize and save the the form items as an Array
        me.flattenOutFormItemsTree(rootNode);

        // Inline App, Role provisioning policy form and Identity provisioning policy form
        if (me.beanType !== 'workflow' && me.usage !== 'Standalone') {
            me.saveChanges();
        }

        // Save owner field
        me.saveOwnerField();

        return me.submitChanges();
    },

    /**
     * JSF based approach - Application, Role and Identity provisioning policy
     */
    saveChanges : function() {
        var me = this;

        // Save form name and description
        me.setFieldValue('formName', me.formName.getValue());
        me.setFieldValue('formDescr', me.formDescription.getValue());

        // Save Extended attributes of a form
        me.setFieldValue('presentationalAttributes', me.formObject.attributes);

        // @ignore
        // Since applicationSuggest drop-down has a binding with
        // the formApplication, the application will be saved automatically.

        // Save from items
        me.setFieldValue('formItemsJSON', Ext.JSON.encode({sections: me.sectionArray,
                                                           buttons: me.buttonArray}));
    },

    /**
     * Load Form details on the Form Editor Panel.
     * This function is called on before show event listener of FormEditorWindow
     *
     * Used by inlilne Identity provisioning form, Application and Role provisioning form
     */
    load : function() {
        var me = this,
            items,
            formItemHelper;

        // Set default behavior for a form editor UI components
        me.loadDefaultUI();

        // Set the form object with a form data.
        // Useful in error handling.
        me.formObject = {
            name: me.getFieldValue('formName'),
            description: me.getFieldValue('formDescr'),
            ownerType: me.getFieldValue('formOwnerType'),
            owner: me.getFieldValue('formOwner'),
            appId: Ext.getDom('editForm:formApplicationId').innerHTML,
            appName: Ext.getDom('editForm:formApplicationName').innerHTML,
            attributes: me.getFieldValue('presentationalAttributes'),
            items: Ext.getDom('formItems')
        };

        me.formName.setValue(me.formObject.name);
        me.formName.clearInvalid();
        me.formDescription.setValue(me.formObject.description);

        // load form attributes
        if (me.formObject.attributes) {
            var attrObject = Ext.JSON.decode(me.formObject.attributes);
            me.loadFormAttributes(attrObject);
            me.formObject.attributes = Ext.JSON.encode(attrObject);
        }

        // owner details
        me.loadOwnerField(me.formObject);

        // Initialize application
        if (me.requireApplication) {
            Ext.getDom('formApplication').value = me.formObject.appId;
        }

        // Application drop-down
        me.getApplication(me.formObject)

        // load form items
        items = me.getFormItems(me.formObject);
        me.formItemStore.setRootNode(items.root);

        // Count of the number of nodes in the form item list
        me.setFormItemsCount();
    },

    /**
     * Bring out default behavior of UI when
     * loading a form editor.
     *
     * @ignore
     * Used by inline Application, Role
     * and Identity provisioning policy.
     */
    loadDefaultUI : function () {
        var me = this;

        // Cancel details button click
        if (me.detailButton.pressed === true) {
            me.detailButton.pressed = false;

            me.displayOwnerDetail(me.detailButton);
        }

        // Reset form attribute's UI element
        var attributePanel = (this.beanType === 'workflow' && this.usage !== 'Standalone') ? me.approvalPanel.items.items[0] :
                              me.detailPanel.items.items[0];

        attributePanel.items.items.forEach(function(item) {
            item.reset();
        });

        // Show empty panel
        me.fieldEditorPanel.getLayout().setActiveItem(0);

        // Remove previously associated error panel
        if (Ext.isDefined(me.errorPanel) && me.errorPanel.isVisible()) {
            me.displayError(false, '');
        }

        // Hide preview panel
        me.previewLabel.hide();
        me.backButton.hide();
        me.previewPanel.hide();

        me.addSectionButton.show();
        if (me.addFormButton) {
            me.addFormButton.show();
        }
        me.previewButton.show();

        me.formItemPanel.show();
        me.fieldEditorPanel.show();
    },

    /**
     * An overridable function for loading owner fields while editing the form
     */
    loadOwnerField : function(form) {
        var me = this;

        me.setOwnerType(form.ownerType, form.owner);
    },

    /**
     * Display application for a Form object of type Role
     */
    getApplication: function(form) {
        var me = this;
        if (me.requireApplication) {
            var appId = "",
                appName = "";

            if (form) {
                appId = form.appId;
                appName = form.appName;
            }

            if (appId && appName) {
                var data = {
                    objects: [{
                        id: appId,
                        displayName: appName
                    }],
                    count: 1
                };

                me.applicationSuggest.getStore().loadRawData(data);
                me.applicationSuggest.setValue(appId);
            } else  {
                // keep it blank
                me.applicationSuggest.setValue('');
                me.applicationSuggest.clearInvalid();

                // press details button
                me.detailButton.pressed = true;
                me.displayOwnerDetail(me.detailButton);
            }
        }
    },

    /**
     * Set owner type while editing the form.
     */
    setOwnerType : function(ownerType, owner) {
        var me = this;

        if (!ownerType) {
            ownerType = SailPoint.form.editor.FormEditor.TYPE_NONE;
        }

        me.formOwnerCombo.setValue(ownerType);

        if (ownerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
            me.formOwnerScript.setValue(owner);
        } else if (ownerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
            me.formOwnerRule.setValue(owner);
        }
    },

    /**
     * Get form items
     */
    getFormItems : function(form) {
        return JSON.parse(form.items.value);
    },

    /**
     * Get form fields
     */
    getFieldValue : function(fieldName) {
        var field = Ext.getDom('editForm:'+fieldName);

        if (field) {
            return field.value;
        }
    },

    /**
     * Set form fields while editing the form
     */
    setFieldValue : function(fieldName, value) {
        var field = Ext.getDom('editForm:'+fieldName);
        if (field) {
            field.value = value;
        }
    },

    /**
     * Count of the number of nodes in the form item list
     */
    setFormItemsCount : function () {
        var me = this,
            formItemHelper = new SailPoint.form.editor.FormItemHelper({});

        me.originalCount = formItemHelper.getNoOfAllChildNodes(me.formItemPanel.getRootNode());
    },

    /**
     * Submits the Form.
     */
    submitChanges : function() {
        Ext.getDom('editForm:formSaveBtn').click();
        return true;
    },

    /**
     * validation
     */
    getNameValidationKey : function() {
        return '#{msgs.error_provisioning_policy_name_required}';
    },

    /**
     * Perform validation of entire form
     */
    validate : function(formItemEditor, editNode, errors) {
        var me = this;

        // Empty error list from status bar
        if (Ext.get('errorPanel') && Ext.get('errorPanel').isVisible()) {
            me.displayError(false, '');
        }

        if (!me.formName.validate()) {
            errors.push('#{msgs.form_editor_name_required}');
            me.formName.markInvalid('#{msgs.field_editor_field_required}');
        }

        if (me.requireApplication && !me.applicationSuggest.validate()) {
            errors.push('#{msgs.form_editor_app_name_required}');
            me.applicationSuggest.markInvalid('#{msgs.field_editor_field_required}');
        }

        // Validates Identity provisioning policy form
        if (me.beanType === 'identity') {
            me.identityFormValidation(errors);
        }

        if (editNode) {
            var isValid = formItemEditor.validate(errors);
        }

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Validates Identity provisioning policy form
     *
     * @ignore
     * Validation is performed when form usage is CreateIdentity.
     * When a usage is create, then name field is required. In addition,
     * password and passwordConfirm fields are mandatory if password
     * configuration is set.
     */
    identityFormValidation : function (errors) {
        var me = this,
            fieldList,
            hasField,
            validateRequiredField,
            getAllFields;

        /**
         * Return whether a field with the
         * given name is defined in this form.
         *
         * @param {String} fieldName A field name
         * @param {Array} fields A field list
         */
        hasField = function (fieldName, fields) {
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].get('properties').name === fieldName) {
                    return true;
                }
            }

            return false;
        };

        /**
         * Validate that the form contains a field with the given name. If not,
         * display the given error message in the status bar and return false.
         *
         * @param {String} fieldName A field name
         * @param {Array} fields A field list
         */
        validateRequiredField = function(fieldName, fields) {
            if (!hasField(fieldName, fields)) {
                return false;
            }

            return true;
        };

        /**
         * Get all field nodes from the form item tree.
         */
        getAllFields = function () {
            var rootNode = me.formItemPanel.getRootNode(),
                formItemHelper = new SailPoint.form.editor.FormItemHelper({}),
                type = me.FIELD,
                fields = [];

            // Get all child items of the root
            formItemHelper.getChildNodes(rootNode, fields, type);

            return fields;
        };

        // If creating new identity, ensure it has
        // a name field and passwords if required.
        if (me.usage === 'CreateIdentity') {

            // Get all field nodes from the form item tree
            fieldList = getAllFields();

            // validate the name field
            if (!validateRequiredField('name', fieldList)) {
                errors.push('#{msgs.error_identity_provisioning_policy_name}')
            }

            // Validate a password field
            if (Ext.getDom('passwordRequired') &&
                    (Ext.getDom('passwordRequired').value === true
                            || Ext.getDom('passwordRequired').value === 'true')) {
                if (!validateRequiredField('password', fieldList)) {
                    errors.push('#{msgs.error_identity_provisioning_policy_password}');
                }

                if (!validateRequiredField('passwordConfirm', fieldList)) {
                    errors.push('#{msgs.error_identity_provisioning_policy_password_confirmation}');
                }
            }
        }
    },

    /**
     * Format error message for bullet points effect
     */
    formatErrorMessage : function(errorMessage) {
        var formattedText = '<ul>';
        formattedText = formattedText + '<li>' + errorMessage + '</li>'
        formattedText = formattedText + '</ul>';
        return formattedText;
    },

    /**
     * Set usage.
     */
    setUsage: function(usage) {
        this.usage = usage;
    },

    /**
     * Field Panel height is calculated as per parent window height & form editor components.
     */
    getcontainerPanelHeight: function() {
        // consider margin 10 pixel for container Panel
        return (this.window.height
                - this.formNameDescPanel.height
                - this.formButtonsPanel.height - 10);
    },

    /**
     * Detail Panel height is calculated as per Hide/Show of its components.
     */
    getDetailPanelheight: function() {

        var attributePanel = this.detailPanel.items.items[0],
            attributePanelHeight,
            detailPanelHeight,
            resizedHeight;

        // Get height of forms extended attribute UI component
        attributePanelHeight = attributePanel.items.items[0].height
                               + attributePanel.items.items[1].height
                               + attributePanel.items.items[2].height
                               + attributePanel.items.items[3].height
                               + attributePanel.items.items[4].height;

        // Get detail panel height
        if (this.requireApplication) {
            detailPanelHeight = this.applicationSuggest.height + this.formOwnerCombo.height;
        } else if (this.beanType === 'workflow' && this.usage !== 'Standalone') {
            detailPanelHeight = (this.approvalPanel.formSend.height + this.approvalPanel.formReturn.height +
                    this.approvalPanel.approvalPanelCombo.height);
        } else {
            detailPanelHeight = this.formOwnerCombo.height;
            
        }

        // Compare detail panel with attribute panel height and return appropriate height
        resizedHeight = (detailPanelHeight > attributePanelHeight ? detailPanelHeight : attributePanelHeight);
        return resizedHeight + 40;
    },

    /**
     * Resizing container, tree and editor panels.
     */
    resizeContainerPanel: function(height) {
        this.containerPanel.setHeight(height);
        this.formItemPanel.setHeight(height);
        this.fieldEditorPanel.setHeight(height);
        this.previewPanel.setHeight(height);
    },

    /**
     * Hide component in slider fashion
     * */
    hideComponent : function(componentId) {
        Ext.get(componentId).slideOut('t', {
            easing: 'easeOut',
            duration: 200,
            remove: false,
            useDisplay: false
        });
    },

    /**
     * Display component in slider fashion
     */
    displayComponent : function(componentId) {
        Ext.get(componentId).slideIn('t', {
            easing: 'easeOut',
            duration: 200
        });
    },

    /**
     * Show warning pop-up if user has un applied changes on form item editor
     */
    showWarning : function(formItemEditor, editNode, rootNode, formItemHelper) {
        var me = this,
            hasNotApplied;

        hasNotApplied = formItemHelper.hasNotAppliedChanges(formItemEditor, editNode);
        if (hasNotApplied) {
            Ext.Msg.confirm('#{msgs.form_editor_confirm_save}',
                '#{msgs.form_editor_confirm_save_msg}',
                    function(btnText) {
                        if ('yes' === btnText) {
                            if (me.submitFormChanges(rootNode)) {
                                me.window.exit();
                            }
                        }
                    }
            );
            return false;
        } else {
            return me.submitFormChanges(rootNode);
        }
    },

    /**
     * Display error
     */
    displayError : function(showPanel, errors) {
        var me = this,
            height,
            margin = 5,
            errorText = '';

        // update statusBar with latest error
        if (errors !== undefined && errors instanceof Array) {
            for(i = 0; i < errors.length; i++) {
                errorText = errorText + me.formatErrorMessage(errors[i]);
            }
            me.statusBar.setText(errorText);
        }
        if (showPanel) {
            this.errorPanel.show();
            height = me.getcontainerPanelHeight() - me.errorPanel.getHeight();
        } else {
            this.errorPanel.hide();
            height = me.getcontainerPanelHeight();
        }

        // Resize detail panel or approval panel
        if (Ext.get('detailPanel') && Ext.get('detailPanel').isVisible()) {
            height = height - me.getDetailPanelheight() - 3;
            if (Ext.get('formOwnerScript') && Ext.get('formOwnerScript').isVisible()) {
                if (me.requireApplication) {
                    margin = 30;
                }
            } else if (Ext.get('formOwnerRule') && Ext.get('formOwnerRule').isVisible()) {
                if (me.requireApplication) {
                    margin = 10;
                }
            }
        } else if (Ext.get('workflowDetailPanel') && Ext.get('workflowDetailPanel').isVisible()) {
            margin = 20;
            height = height - me.getDetailPanelheight();
            if (Ext.get('approvalFormOwnerScript') && Ext.get('approvalFormOwnerScript').isVisible()) {
                height = height - me.approvalPanel.formOwnerScript.height;
            } else if (Ext.get('approvalFormOwnerRule') && Ext.get('approvalFormOwnerRule').isVisible()) {
                height = height - me.approvalPanel.formOwnerRule.height;
            } else if (Ext.get('sourceTextfield') && Ext.get('sourceTextfield').isVisible()) {
                height = height - me.approvalPanel.stringComponent.height;
            } else if (Ext.get('aprovalSourceReference') && Ext.get('aprovalSourceReference').isVisible()) {
                height = height - me.approvalPanel.reference.height;
            }  else if (Ext.get('aprovalSourceCall') && Ext.get('aprovalSourceCall').isVisible()) {
                height = height - me.approvalPanel.callables.height;
            }
        }
        height = height - margin;
        me.resizeContainerPanel(height);
    },

    /**
     * Close form
     */
    closeForm : function() {
        var me = this;

        if (me.hasUnsavedChanges()) {
            Ext.Msg.confirm('#{msgs.form_editor_confirm_close_title}',
                '#{msgs.form_editor_confirm_close_msg}',
                    function(btnText) {
                        if ('yes' === btnText) {
                            me.window.exit();
                        }
                    }
            );
        } else {
            me.window.exit();
        }
    },

    /**
     * Check for unsaved changes on click of close form
     */
    hasUnsavedChanges : function() {
        var me = this;
        if (me.formObject === null ||
           !Ext.isDefined(me.formObject.name) || !me.formObject.name) {
            if (me.hasUnsavedchangesNewForm()) {
                return true;
            }
        } else {

            // Get panel object as per form type and dusage
            var attributePanel = (this.beanType === 'workflow' && this.usage !== 'Standalone') ?
                    me.approvalPanel.items.items[0] : me.detailPanel.items.items[0],

                // decode  attribute's json for Application, Role and Identity provisioning forms.
                attributes = (!me.formObject.attributes) ? {} :
                    (this.beanType !== 'workflow' && this.usage !== 'Standalone') ?
                          Ext.JSON.decode(me.formObject.attributes).attributes :
                          me.formObject.attributes;

            if (!me.fieldEditor.isEqual(attributePanel.items.items[0].getValue(), attributes.title)) {
                return true;
            }

            if (!me.fieldEditor.isEqual(attributePanel.items.items[1].getValue(), attributes.subtitle)) {
                return true;
            }

            if (!me.fieldEditor.isEqual(attributePanel.items.items[2].getValue(), attributes.isWizard)) {
                return true;
            }

            if (attributePanel.items.items[3] &&
                !me.fieldEditor.isEqual(attributePanel.items.items[3].getValue(), attributes.includeHiddenFields)) {
                return true;
            }
            
            if (attributePanel.items.items[4] &&
                !me.fieldEditor.isEqual(attributePanel.items.items[4].getValue(), attributes.hideIncompleteFields)) {
                return true;
            }
            
            if (me.formObject.name !== me.formName.getValue()) {
                return true;
            }
            if (!me.fieldEditor.isEqual(me.formObject.description, me.formDescription.getValue())) {
                return true;
            }
            // Check for unsaved changes in application drop-down for role.
            if (me.requireApplication) {
                if (!Ext.isDefined(me.formObject.appId) || !me.formObject.appId) {
                    me.formObject.appId = null;
                }
                if (me.formObject.appId !== me.applicationSuggest.getValue()) {
                    return true;
                }
            }

            // Check unsaved changes for Approval panel or Owner panel
            if (me.usage !== 'Standalone' && me.beanType === 'workflow') {
                var inputOwnerType = me.approvalPanel.approvalPanelCombo.getValue(),
                    ownerType = me.formObject.ownerMethod,
                    ownerSource = me.formObject.ownerSource;
                if (me.formObject.sendVal !== me.approvalPanel.formSend.getValue()) {
                    return true;
                }
                if (me.formObject.returnVal !== me.approvalPanel.formReturn.getValue()) {
                    return true;
                }
                if (ownerType !== inputOwnerType) {
                    return true;
                } else {
                    if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                        if (ownerSource !== me.approvalPanel.formOwnerScript.getValue()) {
                            return true;
                        }
                    } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                        if (ownerSource !== me.approvalPanel.formOwnerRule.getDisplayValue()) {
                            return true;
                        }
                    } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_STRING) {
                        if (!me.fieldEditor.isEqual(ownerSource, me.approvalPanel.stringComponent.getValue())) {
                            return true;
                        }
                    } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_REFERENCE) {
                        if (ownerSource !== me.approvalPanel.reference.getValue()) {
                            return true;
                        }
                    } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_CALL) {
                        if (ownerSource !== me.approvalPanel.callables.getValue()) {
                            return true;
                        }
                    }
                }
            } else if (me.beanType !== 'workflow') {
                var ownerType,
                    inputOwnerType = me.formOwnerCombo.getValue(),
                    ownerSource = me.formObject.owner;
                if (!me.formObject.ownerType) {
                    ownerType = 'none';
                } else {
                    ownerType = me.formObject.ownerType; 
                }
                if (ownerType !== inputOwnerType) {
                    return true;
                } else {
                    if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                        if (ownerSource !== me.formOwnerScript.getValue()) {
                            return true;
                        }
                    } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                        if (ownerSource !== me.formOwnerRule.getValue()) {
                            return true;
                        }
                    }
                }
            }
        }

        // Get tree node count using root node.
        var itemStore = Ext.getCmp('formItemPanel').getStore(),
            rootNode = itemStore.getRootNode(),
            formItemHelper = new SailPoint.form.editor.FormItemHelper({}),
            count = formItemHelper.getNoOfAllChildNodes(rootNode);

        // Check store node count with current tree node
        if (me.originalCount > count) {
            return true;
        }

        // Check for dirty node in form item tree
        if (rootNode.hasChildNodes()) {
            for (i = 0; i < rootNode.childNodes.length; i++) {
                var firstLevelNode = rootNode.childNodes[i];
                if (firstLevelNode.dirtyNode) {
                    return true;
                } else if (me.SECTION === firstLevelNode.data.formItemType && firstLevelNode.hasChildNodes()) {
                    for (j = 0; j < firstLevelNode.childNodes.length; j++) {
                        var secondLevelNode = firstLevelNode.childNodes[j];
                        if (secondLevelNode.dirtyNode) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    },

    /**
     * Check unsaved changes when a new form
     */
    hasUnsavedchangesNewForm : function() {
        var me = this;

        // Reset form attribute's UI element
        var attributePanel = (this.beanType === 'workflow' && this.usage !== 'Standalone') ? me.approvalPanel.items.items[0] :
                              me.detailPanel.items.items[0];

        if (attributePanel.items.items[0].getValue()) {
            return true;
        }

        if (attributePanel.items.items[1].getValue()) {
            return true;
        }

        if (attributePanel.items.items[2].getValue()) {
            return true;
        }

        if (attributePanel.items.items[3] && attributePanel.items.items[3].getValue()) {
            return true;
        }
        
        if (attributePanel.items.items[4] && attributePanel.items.items[4].getValue()) {
            return true;
        }
        
        if (me.formName.getValue()) {
            return true;
        }
        if (me.formDescription.getValue()) {
            return true;
        }
        if (me.requireApplication) {
            if (me.applicationSuggest.getValue()) {
                return true;
            }
        }
        if (me.beanType === 'workflow' && me.usage !== 'Standalone') {
            var inputApprovalType = me.approvalPanel.approvalPanelCombo.getValue();
            if (me.approvalPanel.formSend.getValue()) {
                return true;
            }
            if (me.approvalPanel.formReturn.getValue()) {
                return true;
            }
            if (inputApprovalType) {
                if (inputApprovalType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                    if (me.approvalPanel.formOwnerScript.getValue()) {
                        return true;
                    }
                } else if (inputApprovalType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                    if (me.approvalPanel.formOwnerRule.getValue()) {
                        return true;
                    }
                } else if (inputApprovalType === SailPoint.form.editor.FormEditor.TYPE_STRING) {
                    if (me.approvalPanel.stringComponent.getValue()) {
                        return true;
                    }
                } else if (inputApprovalType === SailPoint.form.editor.FormEditor.TYPE_REFERENCE) {
                    if (me.approvalPanel.reference.getValue()) {
                        return true;
                    }
                } else if (inputApprovalType === SailPoint.form.editor.FormEditor.TYPE_CALL) {
                    if (me.approvalPanel.callables.getValue()) {
                        return true;
                    }
                }
            }
        } else {
            var inputOwnerType = me.formOwnerCombo.getValue();
            if (inputOwnerType !== 'none') {
                if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_SCRIPT) {
                    if (me.formOwnerScript.getValue()) {
                        return true;
                    }
                } else if (inputOwnerType === SailPoint.form.editor.FormEditor.TYPE_RULE) {
                    if (me.formOwnerRule.getValue()) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Set form JSON object to global SailPoint object
     */
    setGlobalPreviewForm : function() {
        var formEncoded = null,
            formJSON = null,
            itemStore = Ext.getCmp('formItemPanel').getStore(),
            rootNode = itemStore.getRootNode(),
            formAttributes;

        if (me.formObject && me.formObject.attributes) {
            formAttributes = (this.beanType !== 'workflow' && this.usage !== 'Standalone') ?
                              Ext.JSON.decode(me.formObject.attributes).attributes :
                              me.formObject.attributes;
        } else {
            formAttributes = { };
        }

        this.flattenOutFormItemsTree(rootNode);

        // Load attribute value
        if (me.beanType === 'workflow' && me.usage !== 'Standalone') {
            this.getFormPreviewAttributes(formAttributes, me.approvalPanel.items.items[0]);
        } else {
            this.getFormPreviewAttributes(formAttributes, me.detailPanel.items.items[0]);
        }

        formJSON = {
                name : this.formName.getValue(),
                description : this.formDescription.getValue(),
                owner : this.formOwnerSource,
                ownerType : this.formOwnerMethod,
                formType : this.beanType,
                application : (this.requireApplication) ?
                        this.applicationSuggest.getValue() : null,

                // Use correct attributes map to send it to preview the form
                attributes : formAttributes,
                sections : this.sectionArray,
                buttons : this.buttonArray
        };

        // Put encoded form JSON in configData so the form preview directive can get it from configService
        SailPoint.configData.previewFormJSON = Ext.JSON.encode(formJSON);
    },

    /**
     * Get form attribute values for preview
     */
    getFormPreviewAttributes : function(formAttributes, attributePanel) {
        formAttributes.title = attributePanel.items.items[0].getValue();
        formAttributes.subtitle = attributePanel.items.items[1].getValue();
        formAttributes.isWizard = attributePanel.items.items[2].getValue();
        formAttributes.includeHiddenFields = (attributePanel.items.items[3]) ?
            attributePanel.items.items[3].getValue() : false;
        formAttributes.hideIncompleteFields = (attributePanel.items.items[4]) ?
            attributePanel.items.items[4].getValue() : false;
    }
});
