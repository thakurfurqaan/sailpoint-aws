/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component that allows editing of section attributes
 *
 * @author Navnath.Misal
 */

Ext.define('SailPoint.form.editor.SectionEditor', {
    extend: 'SailPoint.form.editor.FormItemEditor',
    requires: ['SailPoint.form.editor.DivisionPanel',
        'SailPoint.form.editor.AttributeFactory'
    ],

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////

    SECTION: 'section',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    initComponent : function() {
        var me = this,
            attrFactory;

        // Initialize attribute factory
        attrFactory = new SailPoint.form.editor.AttributeFactory({});

        // Basic panel
        var sectionBasicPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'sectionBasicPanel',
            title: '#{msgs.field_editor_basic_panel}',
            formItemEditor: me,
            formEditor: me.formEditor
        });

        // Insert attributes to the Basic panel
        sectionBasicPanel.insertComponent(attrFactory.getSectionAttributes('Basic'));

        // Settings panel
        var sectionSettingsPanel = new SailPoint.form.editor.DivisionPanel({
            id: 'sectionSettingsPanel',
            title: '#{msgs.field_editor_setting_panel}',
            collapsed: true,
            formItemEditor: me,
            formEditor: me.formEditor
        });

        // Insert attributes to the Settings panel
        sectionSettingsPanel.insertComponent(attrFactory.getSectionAttributes('Settings'));

        Ext.apply(me, {
            id: 'sectionEditor',
            autoScroll: true,
            items: [sectionBasicPanel,
                    sectionSettingsPanel
            ]
        });

        me.callParent(arguments);
    },

    /**
     * Create new section node in tree and open section editor
     */
    initSection : function(formItemHelper) {
        var me = this;

        // Create section node
        var record = formItemHelper.createNode();
        me.newSection(record);

        // Set Node editing
        formItemHelper.markNodeForEdit(record);

        // Set dirty icon
        formItemHelper.setNodeDirty();
    },

    /**
     * Create a new section
     * @param {Ext.data.Model} record
     */
    newSection : function(record) {
        var me = this;

        me.clear();
        me.loadDefaults(record);

        // Populate name attribute of section
        me.items.items[0].items.items[0].setValue(record.get('text'))

        // Activate section editor form
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(1);
    },

    /**
     * Edit the section
     * @param {Ext.data.Model} record
     */
    editSection : function(record) {
        var me = this;

        me.clear();
        me.loadDefaults(record);
        me.load();

        // Activate section editor form
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(1);
    },

    /**
     * Get the display text for node
     */
    getDisplayText : function () {
        var me = this,
            properties = me.record.get(me.PROPERTIES);

        return properties.label ? properties.label : properties.name;
    },

    /**
     * Perform validation
     */
    validate : function(errors) {
        var me = this,
            sectionBasicPanel = me.items.items[0];

        // pass variables in arguments array
        return me.callParent([sectionBasicPanel, me.SECTION, 'sectionName', 'name', errors]);
    }
});
