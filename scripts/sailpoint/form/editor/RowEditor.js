/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * A standalone component that allows editing of row attributes.
 *
 * Created by ketan.avalaskar.
 */
Ext.define( 'SailPoint.form.editor.RowEditor', {
    extend: 'SailPoint.form.editor.FormItemEditor',
    requires: ['SailPoint.form.editor.DivisionPanel'],

    /////////////////////////////////////////////
    // constants                               //
    /////////////////////////////////////////////

    ROW: 'row',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    /**
     * Configure RowEditor components.
     */
    initComponent: function () {
        var me = this;

        // Row combo-box label
        var rowColumnComboLabel = new Ext.form.Label ({
            cls: 'rowcomboLabel',
            text: '#{msgs.form_editor_row_combo_label}'
        });

        // Store for number of columns drop-down
        var rowColumnsComboStore = new Ext.data.Store ({
            model: 'SailPoint.model.NameValue',
            data: [
                {name: '2', value: '2'},
                {name: '3', value: '3'},
                {name: '4', value: '4'}
            ]
        });

        // Number of columns select drop-down
        var rowColumnsPropertyCombo = new Ext.form.ComboBox({
            cls: 'rowColumnCombo',
            name: 'columns',
            queryMode:'local',
            triggerAction: 'all',
            editable: false,
            displayField: 'name',
            valueField: 'value',
            value: '2',
            width: 0,
            store : rowColumnsComboStore
          });

        // Row editor panel
        var rowEditorPanel = new Ext.form.Panel ({
            id: 'rowEditorPanel',
            cls: 'divisionPanel rowEditorPanel',
            header: false,
            formItemEditor: me,
            formEditor: me.formEditor,
            width: 470,
            items: [rowColumnComboLabel, rowColumnsPropertyCombo]
        });

        Ext.apply(me, {
            id: 'rowEditor',
            autoScroll: true,
            items: [rowEditorPanel]
        });

        me.callParent(arguments);
    },

    /**
     * Create a new row node in form tree inside current
     * section and open row editor panel for editing.
     * @param formItemHelper - helper object which contains row node object 
     *                         which requires at the time of creating fields.
     */
    initRow: function(formItemHelper) {
        var me = this,
            record = formItemHelper.createNode();

        // Set text in properties
        record.data.properties['text'] = record.data.text;

        me.newRow(record, formItemHelper);

        // Set node editing
        formItemHelper.markNodeForEdit(record);

        // Set dirty icon CSS
        formItemHelper.setNodeDirty();
    },

    /**
     * Create a new row
     * @param {Ext.data.Model} record - record object of row node
     * @param formItemHelper - helper object which contains row node object 
     *                         which requires at the time of creating fields.
     */
    newRow : function(record, formItemHelper) {
        var me = this;

        me.clear();

        // Prepare formItemHelper object for creating row columns
        me.formItemHelper = formItemHelper;

        // Add record object to row editor
        me.record = record;

        // Activate row editor panel
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(3);
    },

    /**
     * Edit the row
     * @param {Ext.data.Model} record
     * @param formItemHelper
     */
    editRow: function(record, formItemHelper) {
        var me = this;

        me.clear();

        // Prepare formItemHelper object for creating row columns
        me.formItemHelper = formItemHelper;

        // Add record object to row editor
        me.record = record;
        me.load();

        // Activate row editor panel
        me.formEditor.fieldEditorPanel.getLayout().setActiveItem(3);
    },

    /**
     * Load row data
     */
    load : function() {
        var me = this;

        // Load columns value based on total number of child.
        me.record.get('properties').columns = me.record.childNodes.length;

        // Call load method of super class
        me.callParent();
    },

    /**
     * Save row configuration.
     */
    apply : function() {
        var me = this,
            properties = me.record.get(me.PROPERTIES),
            previousColumnCount = me.record.childNodes.length,
            deltaColumnCount,
            firstRowRecord;

        // update helper object for creating child fields.
        me.formItemHelper.parentNode = me.record;
        me.formItemHelper.nodeType = 'field';

        // Call apply method of super class
        me.callParent();

        // Get delta column count based on difference of current selected and previous column counts.
        deltaColumnCount = properties.columns - previousColumnCount;

        // If deltaColumnCount is greater than 0 then only add columns to row
        if (deltaColumnCount > 0) {
            for (var i = 0; i < deltaColumnCount; i++) {

                // load properties of first field in the row for editing.
                if (i == 0) {

                    // call initField method of fieldEditor object
                    // which is retrieved from traversing child-parent hierarchy.
                    firstRowRecord = 
                        me.ownerCt.ownerCt.ownerCt.fieldEditor.initField(me.formItemHelper);
                } else {
                    me.formItemHelper.createNode();
                }
            }

            // refresh tree for rendering row child's in form tree
            me.formItemHelper.treeView.refresh();

            // Change node appearance on tree structure for editing
            me.formItemHelper.alterNodeStyle(me.formItemHelper.treeView.getNode(firstRowRecord));

            // Set dirty icon after tree refresh
            me.formItemHelper.setNodeDirty();
        } else if (deltaColumnCount < 0 ) {

            // convert negative number to positive
            deltaColumnCount = - deltaColumnCount;

            // Dragged fields outside the row.
            me.formItemHelper.dragFieldsOutsideRow(deltaColumnCount, me.record)
        }
    },

    /**
     * Return row text [ Row <n> ].
     */
    getDisplayText: function () {
        var me = this;

        return me.record.get(me.PROPERTIES).text;
    },

    /**
     * No validation required for row
     */
    validate: function (errors) {
        return true;
    }
});
