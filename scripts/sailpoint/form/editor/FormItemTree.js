/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class defines formitem tree grid panel.
 *
 * Author : Ketan
 */
Ext.define('SailPoint.form.editor.FormItemTree' , {

    extend : 'SailPoint.grid.TreeGridPanel',
    uses : 'SailPoint.form.editor.FormItemHelper',

    cls : 'formItemCls',
    id : 'formItemPanel',

    columns : null,

    forceFit : true,
    hideHeaders : true,
    rootVisible : false,

    viewConfig : {
        plugins : {
            ptype : 'formitemdragdrop'
        },
        // Preserves the scroll position across refresh operations
        preserveScrollOnRefresh : true,
        // Do not highlight selected item
        selectedItemCls : null
    },

    listeners : {
        // Need to reset width of tree panel when scroll bar goes away
        afteritemcollapse : function(record, index, item, eOpts) {
            var treeView = me.formItemPanel.getView(),
                formItemHelper = new SailPoint.form.editor.FormItemHelper({
                    treeView : treeView
                });

            var node = treeView.getNode(index);
            if (Ext.isDefined(record.nodeEditing) && record.nodeEditing) {
                formItemHelper.alterNodeStyle(node);
            }
            if (Ext.isDefined(record.dirtyNode) && record.dirtyNode) {
                formItemHelper.setNodeDirty(node);
            }
            setTimeout(function() {
                me.formItemPanel.doLayout();
            } , 1)
        },
        afteritemexpand: function(record, index, item, eOpts) {
            var treeView = me.formItemPanel.getView(),
                formItemHelper = new SailPoint.form.editor.FormItemHelper({
                    treeView : treeView
                }),
                editNode,
                fieldIndex = index;

            if (Ext.isDefined(record.nodeEditing) && record.nodeEditing) {
                editNode = treeView.getNode(fieldIndex);
            } else {
                for (var i = 0; i < record.childNodes.length; i++) {
                    fieldIndex++;
                    var firstLevelNode = record.childNodes[i];
                    if (Ext.isDefined(firstLevelNode.nodeEditing) && firstLevelNode.nodeEditing) {
                        editNode = treeView.getNode(fieldIndex);
                        break;
                    } else if (firstLevelNode.hasChildNodes()) {
                        for (var j = 0; j < firstLevelNode.childNodes.length; j++) {
                            fieldIndex++;
                            var secondLevelNode = firstLevelNode.childNodes[j];
                            if (Ext.isDefined(secondLevelNode.nodeEditing) && secondLevelNode.nodeEditing) {
                                editNode = treeView.getNode(fieldIndex);
                                break;
                            }
                        }
                    }
                }
            }
            if (editNode) {
                formItemHelper.alterNodeStyle(editNode);
            }
            formItemHelper.setNodeDirty();
        }
    },
    initComponent : function() {
        var me = this;

        // Get all the columns for tree node
        me.columns = me.getColumns();

        // Get field / row menu
        me.fieldMenu = me.getFieldMenu();

        me.callParent(arguments);
    },

    /**
     * Get columns for formitem tree grid panel
     */
    getColumns : function() {
        var me = this,
            columns = [
                me.getEmptyColumn(),
                me.getDragColumn(),
                me.getNameColumn(),
                me.getCreateColumn(),
                me.getEditColumn(),
                me.getDeleteColumn()
            ];
        return columns;
    },

    /**
     * Return extra column for managing tree indentation for rows.
     */
    getEmptyColumn : function() {
        var emptyColumn = {
            width : 8,

            renderer : function(value , metaData , record , rowIndex , col , store , treeView) {

                // Hide this column node for row and fields which are not part of row.
                if (record.parentNode.get('formItemType') === 'row') {
                    metaData.tdCls = metaData.tdCls + 'empty_row_field x-tree-expander';
                } else {
                    metaData.tdCls = metaData.tdCls + 'hide_tree_column';
                }
            }
        };
        return emptyColumn;
    },

    /**
     * Return column to drag item
     */
    getDragColumn : function() {
        var dragColumn = {
            xtype : 'actioncolumn',
            // Font awesome(fa) icon
            tdCls : 'fa fa-arrows fa-fw drag-cell drag-cell-move-cursor',
            width : 8,

            renderer : function(value , metaData , record , rowIndex , col , store , treeView) {
                metaData.tdAttr = 'data-qtip=#{help.form_editor_drag}';
            }
        };
        return dragColumn;
    },

    /**
     * Return column to show Form Item's Name/Label
     */
    getNameColumn : function() {
        var nameColumn = {
            xtype : 'treecolumn',
            tdCls : 'x-tree-expander',

            renderer : function(value , metaData , record , rowIndex , col , store , treeView) {
                // Encode the return value for XSS
                var returnValue = Ext.String.htmlEncode(record.get('text')),
                    properties = record.get('properties'),
                    formItemHelper = new SailPoint.form.editor.FormItemHelper({});

                if ('section' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'section-cell';

                    // Check for section label and convert to localized display text.
                    if (Ext.isDefined(properties.label) && properties.label) {
                        formItemHelper.getLocalizedDisplayText(properties.label, record, null);
                    }
                } else if ('field' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'field-cell';

                    // Check for field display name and convert to localized display text.
                    if (Ext.isDefined(properties.displayName) && properties.displayName) {
                        formItemHelper.getLocalizedDisplayText(properties.displayName, record, null);
                    }
                } else if ('button' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'button-cell';
                    returnValue = '<p style="margin: 0"><b>Button: </b>' + returnValue + '</p>';
                } else if ('row' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'row-cell';
                }

                if (Ext.isDefined(record.dirtyNode) && record.dirtyNode) {
                    metaData.tdCls = metaData.tdCls + ' x-grid-dirty-cell';
                }

                // Assign colspan to name node
                if (record.parentNode.get('formItemType') === 'row') {
                    // Column fields are indented so name width cell is smaller
                    metaData.tdAttr = 'colspan="1"';
                } else {
                    metaData.tdAttr = 'colspan="2"';
                }

                return returnValue;
            }
        };
        return nameColumn;
    },

    /**
     * Return column to create a field node
     */
    getCreateColumn : function() {
        var createColumn = {
            xtype : 'actioncolumn',
            width : 8,

            items : [{
                // Font awesome(fa) icon
                glyph : 'fa fa-plus-square fa-blue',
                getClass : function(v , meta , rec) {
                    if ('section' !== rec.get('formItemType')) {
                        return 'x-hide-display';
                    }
                },
                handler : function(treeView, rowIndex, colIndex, item, e, record) {
                    var rootNode = me.formItemPanel.getRootNode(),
                        hasNotApplied;

                    // Instantiate helper - lazy loading is preferred
                    var formItemHelper = new SailPoint.form.editor.FormItemHelper({
                        treeView : treeView,
                        parentNode : treeView.getStore().getAt(rowIndex)
                    });

                    // Used to alter create column style while hiding field menu
                    me.formItemPanel.treeView = treeView;
                    me.formItemPanel.rowIndex = rowIndex;

                    // Get co-ordinates of current create column
                    // to show field menu at bottom of create column.
                    var position = Ext.get(e.getTarget()).getXY();
                    me.formItemPanel.fieldMenu.setPosition(position[0] - 157, position[1] + 24);

                    me.formItemPanel.fieldMenu.formItemHelper = formItemHelper;

                    // Check for edit node
                    var editNode = formItemHelper.getEditedNode(rootNode);
                    if (editNode) {
                        var formItemEditor = formItemHelper.getFormItemEditor(me, editNode);
                        hasNotApplied = formItemHelper.hasNotAppliedChanges(formItemEditor, editNode);
                        if (hasNotApplied) {
                            Ext.Msg.confirm('#{msgs.form_item_edit_confirm_title}',
                                '#{msgs.form_item_edit_confirm_msg}',
                                    function(btnText) {
                                        if ('yes' === btnText) {
                                            me.formItemPanel.fieldMenu.show();
                                            formItemHelper.toggleCreateNodeMenuStyle(treeView.getNode(rowIndex), true);
                                        }
                                    }
                            );
                            return false;
                        }
                    }
                    if (!editNode || !hasNotApplied) {
                        me.formItemPanel.fieldMenu.show();
                        formItemHelper.toggleCreateNodeMenuStyle(treeView.getNode(rowIndex), true);
                    }
                }
            }],

            // The Font Awesome(fa) icon cannot be rendered using <img>, hence overridden
            // defaultRenderer method of actioncolumn to return <span>.
            defaultRenderer : function(v , meta) {
                var spanStyle = 'text-align: center;font-size: 19px;line-height: 16px;margin: 1px 0px 1px 3px;';
                return me.formItemPanel.getHtmlElement(this , meta , arguments , spanStyle);
            },

            renderer : function(value , metaData , record , row , col , store , gridView) {
                if ('section' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'add-cell';
                    metaData.tdAttr = 'data-qtip=#{help.form_editor_add}';
                } else if ('field' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'hide-field-add-cell';
                } else if ('button' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'hide-button-add-cell';
                } else if ('row' === record.get('formItemType')) {
                    metaData.tdCls = metaData.tdCls + 'row-cell';
                }
            }
        };
        return createColumn;
    },

    /**
     * Create field menu which contains add field, add Row with Columns options.
     */
    getFieldMenu : function() {
        var fieldMenu = new Ext.menu.Menu({
            cls: 'fieldMenu',
            bodyCls: 'fieldMenuBody',
            shadow: false,
            formItemHelper: null,

            items: [{
                text: '#{msgs.form_editor_add_field}',
                handler: function() {
                    this.ownerCt.formItemHelper.nodeType = 'field';
                    return me.fieldEditor.initField(this.ownerCt.formItemHelper);
                }
            },{
                text: '#{msgs.form_editor_add_row}',
                handler: function() {
                    this.ownerCt.formItemHelper.nodeType = 'row';
                    return me.rowEditor.initRow(this.ownerCt.formItemHelper);
                }
            }],

            listeners : {
                // Reset styling around create
                hide : function (eOpts) {
                    var formItemHelper = new SailPoint.form.editor.FormItemHelper({});
                    var node = me.formItemPanel.treeView.getNode(me.formItemPanel.rowIndex)
                    formItemHelper.toggleCreateNodeMenuStyle(node, false);
                }
            }
        });

        return fieldMenu;
    },

    /**
     * Return column to edit the node
     */
    getEditColumn : function() {
        var editColumn = {
            xtype : 'actioncolumn',
            // Font awesome(fa) icon
            glyph : 'fa fa-pencil fa-gray-icon',
            tdCls : 'edit-cell',
            width : 8,

            // The Font Awesome(fa) icon cannot be rendered using <img>, hence overridden
            // defaultRenderer method of actioncolumn to return <span>.
            defaultRenderer : function(v , meta) {
                var spanStyle= 'text-align: center;line-height: 15px;font-size: 15px;margin: 1px 0px 1px 6px;';
                return me.formItemPanel.getHtmlElement(this , meta , arguments , spanStyle);
            },

            renderer : function(value , metaData , record , rowIndex , col , store , treeView) {
                metaData.tdAttr = 'data-qtip=#{help.form_editor_edit}';
            },

            handler : function(treeView , rowIndex , colIndex) {

                var record = treeView.getRecord(treeView.getNode(rowIndex)),
                    rootNode = me.formItemPanel.getRootNode(),
                    hasNotApplied;

                // Instantiate helper - lazy loading is preferred
                var formItemHelper = new SailPoint.form.editor.FormItemHelper({
                    treeView : treeView,
                    parentNode : treeView.getStore().getAt(rowIndex)
                });

                // check for Edit node if exists
                var editNode = formItemHelper.getEditedNode(rootNode);

                if (editNode && editNode.id !== record.id) {
                    var formItemEditor = formItemHelper.getFormItemEditor(me, editNode);
                    hasNotApplied = formItemHelper.hasNotAppliedChanges(formItemEditor, editNode);
                    if (hasNotApplied) {
                        Ext.Msg.confirm('#{msgs.form_item_edit_confirm_title}',
                            '#{msgs.form_item_edit_confirm_msg}',
                                function(btnText) {
                                    if ('yes' === btnText) {
                                        me.formItemPanel.editNode(me, record, treeView, formItemHelper, rowIndex);
                                    }
                                }
                        );
                        return false;
                    }
                }
                if (!editNode || !hasNotApplied) {
                    me.formItemPanel.editNode(me, record, treeView, formItemHelper, rowIndex);
                }
            }
        };
        return editColumn;
    },

    /**
     * Return column to delete a node
     */
    getDeleteColumn : function() {
        var deleteColumn = {
            xtype : 'actioncolumn',
            // Font awesome(fa) icon
            glyph : 'fa fa-times fa-gray-icon',
            tdCls : 'delete-cell',
            width : 8,

            // The Font Awesome(fa) icon cannot be rendered using <img>, hence overridden
            // defaultRenderer method of actioncolumn to return <span>.
            defaultRenderer : function(v , meta) {
                var spanStyle = 'text-align: center;line-height: 15px;font-size: 16px;margin: 1px 0px 1px 6px;';
                return me.formItemPanel.getHtmlElement(this , meta , arguments , spanStyle);
            },

            handler : function(treeView , rowIndex , colIndex) {
                Ext.Msg.confirm('#{msgs.form_item_delete_confirm_title}',
                    '#{msgs.form_item_delete_confirm_msg}',
                    function(btnText) {
                        if ('yes' === btnText) {
                            var record = treeView.getRecord(treeView.getNode(rowIndex)),
                                properties = record.get('properties'),
                                parentNode = record.parentNode;

                            // Instantiate helper - lazy loading is preferred
                            var formItemHelper =
                                new SailPoint.form.editor.FormItemHelper({
                                    treeView : treeView,
                                    rowIndex : rowIndex
                                });

                            formItemHelper.deleteNode();

                            // Set row column count if field inside row is deleted
                            if (parentNode.get('formItemType') === 'row') {
                                if (parentNode) {
                                    me.rowEditor.record = parentNode;
                                    me.rowEditor.load();
                                }
                            }

                            // Reset display text of remaining rows in section.
                            if (record.get('formItemType') === 'row') {
                                formItemHelper.resetRowNodeText([parentNode]);
                            }

                            // Reset width in case scroll bar hides
                            me.formItemPanel.doLayout();
                            // Set dirty nodes
                            formItemHelper.setNodeDirty();

                            // Display blank editor panel if user deletes current node or its parent
                            var childEditNode = formItemHelper.getEditedNode(record);
                            if ((Ext.isDefined(record.nodeEditing) && record.nodeEditing) || childEditNode) {
                                me.fieldEditorPanel.getLayout().setActiveItem(0);
                            }
                        }
                    }
                );
            }
        };
        return deleteColumn;
    },

    /**
     * Action column renderer, iterates through items creating an <span> element
     * for each and tagging with an identifying class name x-action-col-{n}
     */
    getHtmlElement : function (actionColumn , meta , args , spanStyle) {
        var me = actionColumn,
            prefix = Ext.baseCSSPrefix,
            scope = me.origScope || me,
            items = me.items,
            len = items.length,
            i = 0,
            ret,
            glyph,
            item;

        // Allow a configured renderer to create initial value
        // (And set the other values in the "metadata" argument!)
        ret = Ext.isFunction(me.origRenderer) ? me.origRenderer.apply(scope, args) || '' : '';

        meta.tdCls += ' ' + Ext.baseCSSPrefix + 'action-col-cell';

        for (; i < len ; i++) {
            item = items[i];

            glyph = item.glyph;

            // Only process the item action setup once.
            if (!item.hasActionConfiguration) {

               // Apply our documented default to all items
               item.stopSelection = me.stopSelection;
               item.disable = Ext.Function.bind(me.disableAction , me , [i] , 0);
               item.enable = Ext.Function.bind(me.enableAction , me , [i] , 0);
               item.hasActionConfiguration = true;
            }

            ret += '<' + (glyph ? 'span' : 'img alt="' + (item.altText || me.altText) + '" src="'
                    + (item.icon || Ext.BLANK_IMAGE_URL) + '"') + ' class="' + (glyph ? glyph + ' '
                    : prefix + 'action-col-icon ') + prefix + 'action-col-' + String(i) + ' '
                    + (item.disabled ? prefix + 'item-disabled' : ' ') + ' ' + (Ext.isFunction(item.getClass)
                    ? item.getClass.apply(item.scope || scope, args) : (item.iconCls || me.iconCls || '')) + '"'
                    + ((item.tooltip) ? ' data-qtip="' + item.tooltip + '"' : '')
                    + (glyph ? ' style="'+ spanStyle +'"' : '') + ' />';
        }

        return ret;
    },

    /**
     * Load node properties to form item editor and prepare it for editing
     */
    editNode : function(formEditor, record, treeView, formItemHelper, rowIndex) {
        // Refresh tree view
        treeView.refresh();
        // Clear nodeEditing flag from all records
        formItemHelper.markNodeForEdit(record);
        // Change node appearance on tree structure
        formItemHelper.alterNodeStyle(treeView.getNode(rowIndex));
        // Set dirty icon
        formItemHelper.setNodeDirty();

        if (formItemHelper.SECTION === record.get(formItemHelper.FORM_ITEM_TYPE)) {
            formEditor.sectionEditor.editSection(record);
        } else if (formItemHelper.ROW === record.get(formItemHelper.FORM_ITEM_TYPE)) {
            formEditor.rowEditor.editRow(record, formItemHelper);
        } else if (formItemHelper.FIELD === record.get(formItemHelper.FORM_ITEM_TYPE)) {
            formEditor.fieldEditor.editField(record);
        } else if (formItemHelper.BUTTON === record.get(formItemHelper.FORM_ITEM_TYPE)) {
            formEditor.editButton(record);
        }
    }
});
