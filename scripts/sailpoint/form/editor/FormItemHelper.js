/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * Helper class to add and remove a node on/from the tree structure.
 *
 * @author rahul.borate
 *
 * @create - When creating a node, instantiate this class with
 * a. nodeType - type of node to create
 * b. treeView - tree panel view
 * c. parenNode -  the parent node under which new node to add
 *
 * @delete - When deleting a node, instantiate this class with
 * a. treeView - tree panel view
 * b. rowIndex - tree row index number
 */

Ext.define('SailPoint.form.editor.FormItemHelper', {

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////
    FORM_ITEM_TYPE: 'formItemType',

    SECTION: 'section',

    ROW: 'row',

    FIELD: 'field',

    BUTTON: 'button',

    TEXT: 'text',

    SEPERATOR: ' ',

    PROPERTIES: 'properties',

    TYPE_STRING: 'string',

    /////////////////////////////////////////////
    // Constructor                             //
    /////////////////////////////////////////////
    constructor : function(config) {
        var me = this;

        Ext.apply(me, config);
    },

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////
    /**
     * Creates a new node in the form item tree
     * with the node type section, field and button.
     * @return {Ext.data.Model} node The newly created node
     */
    createNode : function() {
        var buttonNode,
            argList,
            insertionMethod,
            record;

        // refresh tree
        this.treeView.refresh();

        if (this.nodeType === this.SECTION) {
            // Check if, form has a button
            buttonNode = this.parentNode.findChild(this.FORM_ITEM_TYPE, this.BUTTON);

            // Put the new section on root node, but before button node
            if (buttonNode) {
                insertionMethod = this.parentNode.insertBefore;
                argList = [this.createSection(), buttonNode]
            }
            // Append the new section on root
            else {
                insertionMethod = this.parentNode.appendChild;
                argList = [this.createSection()];
            }
        } else if (this.nodeType === this.ROW) {

            // Expand parent node
            this.parentNode.expand();
            insertionMethod = this.parentNode.appendChild;
            argList = [this.createRow()];
        } else if (this.nodeType === this.FIELD) {

            // Expand parent node
            this.parentNode.expand();
            insertionMethod = this.parentNode.appendChild;
            argList = [this.createField()];
        } else if (this.nodeType === this.BUTTON) {
            insertionMethod = this.parentNode.appendChild;
            argList = [this.createButton()];
        }

        // This hooks the new node on the tree structure
        record = insertionMethod.apply(this.parentNode, argList);

        if (record) {
            // Get the element for newly added node
            var nodeEl = Ext.fly(this.treeView.getNode(record));

            // Scroll to the new node
            if (nodeEl.getY() > this.treeView.getHeight()) {
                this.treeView.scrollBy(nodeEl.getXY(), false);
            }

            // Add properties object to the node
            if (!record.get(this.PROPERTIES)) {
                record.set(this.PROPERTIES, {});

                // Add Extended attribute object to the properties
                record.get(this.PROPERTIES).attributes = {};
            }

            // Assign name to node of type field and section.
            if (record.get(this.FORM_ITEM_TYPE) === this.FIELD
                || record.get(this.FORM_ITEM_TYPE) === this.SECTION) {
                record.get(this.PROPERTIES).name = record.get(this.TEXT);

                // Set node as dirty
                record.dirtyNode = true;

                // Set default field type as string
                if (record.get(this.FORM_ITEM_TYPE) === this.FIELD) {
                    record.get(this.PROPERTIES).type = this.TYPE_STRING;
                }
            }

            // Change node style - this is so that,
            // it resembles to the node is clicked for edit
            this.alterNodeStyle(this.treeView.getNode(record));
        }

        return record;
    },

    /**
     * This unhooks the node from the tree structure
     */
    deleteNode : function() {
        // Find a node for given index
        var node = this.treeView.getStore().getAt(this.rowIndex);

        // Delete a node
        node.remove();
    },

    /**
     * Template to create a node of type section
     */
    createSection : function () {
        return {
            text: this.buildDisplayText(),
            formItemType: this.SECTION,
            leaf: 'false'
        };
    },

    /**
     * Template to create a node of type field
     */
    createField : function() {
        return {
            text: this.buildDisplayText(),
            formItemType: this.FIELD,
            leaf: 'true'
        };
    },

    /**
     * Template to create a node of type row
     */
    createRow : function() {
        return {
            text: this.buildDisplayText(),
            formItemType: this.ROW,
            leaf: 'false'
        };
    },

    /**
     * Template to create a node of type button
     */
    createButton : function() {
        return {
            formItemType: this.BUTTON,
            leaf: 'true'
        };
    },

    /**
     * Provides the text to display on node
     */
    buildDisplayText : function() {
        return Ext.String.format(Ext.String.capitalize(this.nodeType) + ' {0}', this.getNextIndex());
    },

    /**
     * Returns next index to display on node
     */
    getNextIndex : function() {
        var max = 0,
            itemCount = 0;

        if (this.nodeType === this.SECTION) {

            // Here parent node is root
            itemCount = (!this.parentNode.isRoot()) ? this.parentNode.childNodes.length :
                this.parentNode.childNodes.length - this.getButtonNodeCount();

            for (var i = 0; i < itemCount; i++) {
                var sectionName = this.parentNode.childNodes[i].get(this.PROPERTIES).name;
                res = sectionName ?sectionName.split(this.SEPERATOR) :
                      this.parentNode.childNodes[i].data[this.TEXT].split(this.SEPERATOR);
                if (this.nodeType === res[0].toLowerCase()) {
                    if (parseInt(res[1]) > max ) {
                        max = parseInt(res[1]);
                    }
                }
            }

        } else if (this.nodeType === this.ROW) {

            // Here Parent node is current section
            max = this.getRowNodeCount(this.parentNode.childNodes);
        } else if (this.nodeType === this.FIELD) {
            var rootChildNodes,
                nodeList;

            if (this.parentNode.data.formItemType === 'row') {

                // Here parent node is row
                rootChildNodes = this.parentNode.parentNode.parentNode.childNodes;
            } else {

                // Here parent node is section
                rootChildNodes = this.parentNode.parentNode.childNodes;
            }

            for (var i = 0; i < rootChildNodes.length; i++) {
                nodeList = [];

                this.getChildNodes(rootChildNodes[i], nodeList, this.FIELD);
                itemCount = itemCount + nodeList.length;
                for (var j = 0; j < nodeList.length; j++) {
                    var fieldName = nodeList[j].get(this.PROPERTIES).name;
                    res = fieldName ? fieldName.split(this.SEPERATOR) :
                          nodeList[j].data[this.TEXT].split(this.SEPERATOR);
                    if (this.nodeType === res[0].toLowerCase()) {
                        if (parseInt(res[1]) > max ) {
                            max = parseInt(res[1]);
                        }
                    }
                }
            }
        }


        // Compare max with field count.
        max = (itemCount > max ? itemCount : max);
        return max + 1;
    },

    /**
     * Returns row node count from given parent node
     */
    getRowNodeCount : function(childNodes) {
        var count = 0;

        for (var i = 0; i < childNodes.length; i++) {
            var fieldNode = childNodes[i];
            if (this.ROW === fieldNode.data[this.FORM_ITEM_TYPE]) {
                count ++;
            }
        }

        return count;
    },

    /**
     * Returns button node count from the tree structure
     */
    getButtonNodeCount : function() {
        var count = 0,
            records = this.treeView.getRecords(this.treeView.getNodes());

        for (var i = 0; i < records.length; i++) {
            if (this.BUTTON === records[i].get(this.FORM_ITEM_TYPE)) {
                count ++;
            }
        }

        return count;
    },

    /**
     * Modify the node appearance. This is so that,
     * it resembles to the node is clicked for edit.
     */
    alterNodeStyle : function(node) {

        // Get row element
        var rowEl = Ext.fly(node);

        // Clean the row if it selected
        rowEl.removeCls(['x-grid-row-selected', 'x-grid-row-focused']);

        // On click change the color of node
        var secondCellEl = Ext.get(rowEl.dom.children[2]);
        if (secondCellEl.hasCls('section-cell')) {
            secondCellEl.replaceCls('section-cell', 'alter-section-cell');
        } else if (secondCellEl.hasCls('field-cell')) {
            secondCellEl.replaceCls('field-cell', 'alter-field-cell');

            // change color of hidden add-cell
            var hiddenCellEl = Ext.get(rowEl.dom.children[3])
            hiddenCellEl.replaceCls('hide-field-add-cell', 'alter-hide-field-add-cell');
        } else if (secondCellEl.hasCls('button-cell')) {
            secondCellEl.replaceCls('button-cell', 'alter-button-cell');

            // change the color of hidden add-cell
            var hiddenCellEl = Ext.get(rowEl.dom.children[3])
            hiddenCellEl.replaceCls('hide-button-add-cell', 'alter-hide-button-add-cell');
        } else if (secondCellEl.hasCls('row-cell')) {
            secondCellEl.replaceCls('row-cell', 'alter-row-cell');

            // change the color of hidden add-cell
            var hiddenCellEl = Ext.get(rowEl.dom.children[3])
            hiddenCellEl.replaceCls('row-cell', 'alter-row-cell');
        }

        // change the color of edit-cell
        var editCellEl = Ext.get(rowEl.dom.children[4]);
        editCellEl.replaceCls('edit-cell', 'alter-edit-cell');

        // Turns edit icon from gray to blue
        var editIconEl = Ext.get(Ext.query('td.x-action-col-cell span', node)[1]);
        editIconEl.replaceCls('fa-gray-icon', 'fa-blue');
    },

    /**
     * Toggle create node menu style to match with fields menu
     */
    toggleCreateNodeMenuStyle : function(node, add) {

        // Get row element
        var rowEl = Ext.fly(node);

        // change the style of addCell element
        var addCell = Ext.get(rowEl.dom.children[3]);

        if (add) {
            addCell.addCls('createNodeMenuStyle');
        } else {
            addCell.removeCls('createNodeMenuStyle');
        }
    },

    /**
     * Modify the tree node's appearance. This is so that,
     * it resembles to the node is dirty if its property dirtyNode marked true.
     * */
    setNodeDirty : function(node) {
        var rowElement,
            secondCell;

        if (node) {
            rowElement = Ext.fly(node);
            secondCell = Ext.get(rowElement.dom.children[2]);
            if (!secondCell.hasCls('x-grid-dirty-cell')) {
                secondCell.addCls('x-grid-dirty-cell');
            }
        } else {
            var records = this.treeView.getRecords(this.treeView.getNodes());
            for (var i=0; i < records.length; i++) {
                if (Ext.isDefined(records[i].dirtyNode) && records[i].dirtyNode) {
                    var node = this.treeView.getNode(records[i]);
                    rowElement = Ext.fly(node);
                    secondCell = Ext.get(rowElement.dom.children[2]);
                    if (!secondCell.hasCls('x-grid-dirty-cell')) {
                        secondCell.addCls('x-grid-dirty-cell');
                    }
                }
            }
        }
    },

    /**
     * Mark nodeEditing property for currently edited node.
     * Making nodeEditing false for all tree nodes expect current which
     * is being edited this will keep consistency as there only one node
     * at a time in editing.
     * */
    markNodeForEdit : function(record) {
        var parentNode;

        if (record.data[this.FORM_ITEM_TYPE] === this.SECTION || record.data[this.FORM_ITEM_TYPE] === this.BUTTON) {
            parentNode = record.parentNode;
        } else if (record.parentNode.data[this.FORM_ITEM_TYPE] === this.ROW) {
            parentNode = record.parentNode.parentNode.parentNode;
        } else {
            parentNode = record.parentNode.parentNode;
        }

        // recursively mark nodeEditing false
        this.resetNodeEditing(parentNode);

        record.nodeEditing = true;
    },

    /**
     * Recursive method to reset nodeEditing property of tree node
     * @param {Ext.data.Model} parentNode - reset nodeEditing property of
     *                                      parentNode and its child nodes
     */
    resetNodeEditing : function(parentNode) {
        var i,
            node;

        if (parentNode.hasChildNodes()) {
            for (i = 0; i < parentNode.childNodes.length; i++) {
                node = parentNode.childNodes[i];
                node.nodeEditing = false;

                // recursive call
                this.resetNodeEditing(node);
            }
        }
    },

    
    /**
     * This recurses through all nodes under the given node and returns a node list.
     * (e.g. If you pass a RootNode of a tree it will return all child nodes form the root node.)
     *
     * @param {Ext.data.Model} parentNode A parent node whose child's to be returned.
     * @param {Array} nodeList A given node list.
     * @param {String} itemType If itemType is null or empty, then returns all child
     *        nodes else return those nodes whose type is matched to itemType.
     */
    getChildNodes : function(parentNode, nodeList, itemType) {
        var me = this,
            node,
            i;

        if (parentNode.hasChildNodes()) {
            for (i = 0; i < parentNode.childNodes.length; i++) {
                node = parentNode.childNodes[i];
                if (node.get(me.FORM_ITEM_TYPE) === itemType) {
                    nodeList.push(node);
                } else if (SailPoint.Utils.isNullOrEmpty(itemType)) {
                    // push all
                    nodeList.push(node);
                }

                // recurse
                me.getChildNodes(node, nodeList, itemType);
            }
        }
    },

    /**
     * This recurses through all nodes under the given node, and returns a number.
     * (e.g. If you pass a RootNode of a tree it will return how many total child
     * nodes are there in the tree, (other than RootNode itself))
     *
     * @param {Ext.data.Model} parentNode A parent node whose child node count to be taken back.
     */
    getNoOfAllChildNodes : function(parentNode) {
        var me = this,
            nodeList = [];

        me.getChildNodes(parentNode, nodeList, null);

        return nodeList.length;
    },

    /**
     * Get edited node Node by passing parent node
     * (e.g. if we pass RootNode of tree it will search currently edited node withing all tree nodes and return if found)
     */
    getEditedNode : function(node) {
        var editNode = null;

        if (node.nodeEditing) {
            editNode = node;
        } else if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                var firstLevelNode = node.childNodes[i];
                editNode = this.getEditedNode(firstLevelNode);
                if (editNode) {
                    break;
                }
            }
        }

        return editNode;
    },

    /**
     * Get formItemEditor object as per type of editNode
     */
    getFormItemEditor : function(formEditor, editNode) {
        var me = this,
            formItemEditor;

        if (me.SECTION === editNode.get(me.FORM_ITEM_TYPE)) {
            formItemEditor = formEditor.sectionEditor;
        } else if (me.ROW === editNode.get(me.FORM_ITEM_TYPE)) {
            formItemEditor = formEditor.rowEditor;
        } else if (me.FIELD === editNode.get(me.FORM_ITEM_TYPE)) {
            formItemEditor = formEditor.fieldEditor;
        } else if (me.BUTTON === editNode.get(me.FORM_ITEM_TYPE)) {
            formItemEditor = formEditor.buttonEditor;
        }

        return formItemEditor;
    },

    /**
     * Check for unapplied changes in form item editor if found return true
     * to warn user
     */
    hasNotAppliedChanges : function(formItemEditor, editNode) {
        var me = this,
            hasChange;

        formItemEditor.items.each(function(panelItem) {
            // Check for unapplied changes
            if (!panelItem.skipValidation) {
                if (formItemEditor.commit(panelItem, true)) {
                    hasChange = true;
                    return false;
                }
            }
        });
        return hasChange;
    },

    /**
     * Get Localized display text for given catalog key
     */
    getLocalizedDisplayText : function(catalogKey, record, node) {

        var me = this,
            url = "/rest/messageCatalog/";
        Ext.Ajax.request({
            scope: this,
            method: 'GET',
            url: SailPoint.getRelativeUrl(url),
            params: {
                catKey: catalogKey
            },
            success: function(response) {
                var respObj = JSON.parse(response.responseText);
                record.set(this.TEXT, respObj);
                if (node) {
                    // Reload clicked CSS
                    me.alterNodeStyle(node);
                }
            },
            failure: function(response) {
                SailPoint.FATAL_ERR_ALERT.call(this);
            }
        });
    },

    /**
     * Reset the display text of a Row belongs to given Section.
     */
    resetRowNodeText : function(sectionNodes) {
        var me = this,
            rowCount,
            rowText,
            childNode;

        for (var i = 0; i < sectionNodes.length; i++) {
            rowCount = 1;
            for (var j = 0; j < sectionNodes[i].childNodes.length; j++) {
                childNode = sectionNodes[i].childNodes[j];
                if (childNode.get(me.FORM_ITEM_TYPE) === me.ROW) {
                    rowText = 'Row ' + rowCount++;
                    childNode.set(me.TEXT, rowText);
                    childNode.get(me.PROPERTIES).text = rowText;
                }
            }
        }
    },

    /**
     * Drag fields outside row when user has minimized row fields
     * Dragging scenario
     *  1. If row has next sibling node then insert dragged field before this sibling node.
     *  2. If row don't have any sibling node then append dragged node to the row node.
     * @param deltaColumnCount - number of fields to be dragged
     * @param rowNode - The row whose fields are reduced.
     */
    dragFieldsOutsideRow : function(deltaColumnCount, rowNode) {
        var parentNode = rowNode.parentNode,
            insertionMethod,
            argList = [],
            lastNodeIndex,
            draggedNode;

        while (deltaColumnCount) {
            lastNodeIndex = rowNode.childNodes.length - 1;
            draggedNode = rowNode.childNodes[lastNodeIndex];

            if (rowNode.nextSibling) {
                insertionMethod = parentNode.insertBefore;
                argList[1] = rowNode.nextSibling;
            } else {
                insertionMethod = parentNode.appendChild;
            }
            argList[0] = draggedNode;
            insertionMethod.apply(parentNode, argList);

            deltaColumnCount--;
        }
    }
});
