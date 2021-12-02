/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This plugin provides drag and/or drop functionality for a Form Editor Items.
 *
 * @author rahul.borate
 *
 * Note that, the plugin must be added to the tree view, not to the tree panel. 
 * For example using viewConfig:
 *   viewConfig: {
 *         plugins: { ptype: 'formitemdragdrop' }
 *   }
 */

Ext.define('SailPoint.form.editor.plugin.FromItemDragDrop', {
    extend: 'Ext.tree.plugin.TreeViewDragDrop',
    alias: 'plugin.formitemdragdrop',
    uses: [
           'SailPoint.form.editor.plugin.ItemDragZone',
           'SailPoint.form.editor.plugin.ItemDropZone'
    ],

    /**
     * @cfg {Boolean} allowParentInsert
     * Allow dropping a dragged node on the expanded target with position after.
     */
    allowParentInsert: true,

    /**
     * Registers DropZone object container with the Scrollmanager for auto scrolling during drag operations.
     * A {@link Ext.dd.ScrollManager} configuration may also be passed.
     * @cfg {Object/Boolean} containerScroll
     */
    containerScroll: true,

    /**
     * @cfg {String} [displayField=text]
     * The name of the node field that is used to display the text for the nodes.
     */
    displayField: 'text',

    /**
     * @cfg {String} expandDelay
     * The delay in milliseconds to wait before expanding a target tree node 
     * while dragging a droppable node over the target.
     */
    expandDelay: 500,

    /**
     * Creates drag and drop zones for Form Items.
     * @param {Ext.tree.View} view The source TreeView from which the drag originated.
     */
    onViewRender : function(view) {
        var me = this;

        if (me.enableDrag) {
            me.dragZone = new SailPoint.form.editor.plugin.ItemDragZone({
                view: view,
                ddGroup: me.dragGroup || me.ddGroup,
                dragText: me.dragText,
                displayField: me.displayField,
                repairHighlightColor: me.nodeHighlightColor,
                repairHighlight: me.nodeHighlightOnRepair
            });
        }

        if (me.enableDrop) {
            me.dropZone = new SailPoint.form.editor.plugin.ItemDropZone({
                view: view,
                ddGroup: me.dropGroup || me.ddGroup,
                allowContainerDrops: me.allowContainerDrops,
                appendOnly: me.appendOnly,
                allowParentInsert: me.allowParentInsert,
                expandDelay: me.expandDelay,
                dropHighlightColor: me.nodeHighlightColor,
                dropHighlight: me.nodeHighlightOnDrop,
                containerScroll: me.containerScroll
            });
        }
    }
});

/**
 * @private Class to define form item drag zone.
 */
Ext.define('SailPoint.form.editor.plugin.ItemDragZone', {
    extend: 'Ext.tree.ViewDragZone',

    /**
     * CSS class list to remove from ghost node.
     */
    ghostCls: ['x-tree-drop-ok-append',
        'x-tree-drop-ok-above',
        'x-tree-drop-ok-below',
        'x-tree-drop-ok-between'
    ],

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    /**
     * Called when a drag/drop obj gets a mousedown
     * @param {Event} e the mousedown event
     * Changes cursor on drag start.  
     */
    onMouseDown : function(e) {
        var nodeList = this.view.getNodes();

        // Iterate over rows
        for (var i = 0; i < nodeList.length; i++) {
            var rowEl = Ext.get(nodeList[i]);

            // Replace css for the first column
            var tdEl = Ext.get(rowEl.dom.childNodes[1]);
            tdEl.replaceCls('drag-cell-move-cursor', 'drag-cell-cursor');

            // Replace css for the second column
            tdEl = Ext.get(rowEl.dom.childNodes[2]);
            var divEl = Ext.get(Ext.query('div.x-grid-cell-inner', tdEl.dom)[0]);
            divEl.replaceCls('x-grid-cell-inner', 'expander-cell-cursor');
        }
    },

    /**
     * Called when a drag/drop obj gets a mouseup
     * @param {Event} e the mouseup event
     * Brings tree view to original state.
     */
    onMouseUp : function(e) {
        var formItemHelper = new SailPoint.form.editor.FormItemHelper({}),
            record,
            editNode;

        // refresh tree view 
        this.view.refresh();

        // Get edited node and alter its node style.
        record = formItemHelper.getEditedNode(this.view.node);
        editNode =  this.view.getNode(record);

        if (editNode) {
            formItemHelper.alterNodeStyle(editNode);

            // load row editor if edit node is of type row.
            if (record.get(me.FORM_ITEM_TYPE) === me.ROW) {
                me.rowEditor.load();
            }
        }
    },

    /**
     * The function of {@link Ext.dd.DragData}
     */
    getDragText : function() {
        var records = this.dragData.records,
            count = records.length,
            text = records[0].get(this.displayField),
            suffix = 's';

        if (count === 1 && text) {
            return Ext.String.htmlEncode(text);
        } else if (!text) {
            suffix = '';
        }

        return Ext.String.format(this.dragText, count, suffix);
    },

    /**
     * The function of {@link Ext.dd.DragSource} called when
     * dragged element is hovering over another DragDrop object.
     * @param {Event} e The event object
     * @param {String} id The id of the dragged element
     */
    onDragOver : function(e, id) {
        var target = this.cachedTarget || Ext.dd.DragDropManager.getDDById(id),
            status;

        if (this.beforeDragOver(target, e, id) !== false) {
            if (target.isNotifyTarget) {
                status = target.notifyOver(this, e, this.dragData);

                // Handled ExtJS DnD implementation glitch.
                // ExtJS DnD implementation fails to remove last applied CSS
                // on ghost node. Hence, removing older CSS manually. 
                if (status === this.dropNotAllowed) {
                   var proxyEl = this.proxy.getEl();
                   for (var i = 0; i < this.ghostCls.length; i++) {
                       if (proxyEl.hasCls(this.ghostCls[i])) {
                           proxyEl.removeCls(this.ghostCls[i]);
                       }
                   }
                }
                this.proxy.setStatus(status);
            }

            if (this.afterDragOver) {
                /**
                 * An empty function by default, but provided so that you can perform a custom action
                 * while the dragged item is over the drop target by providing an implementation.
                 * @param {Ext.dd.DragDrop} target The drop target
                 * @param {Event} e The event object
                 * @param {String} id The id of the dragged element
                 * @method afterDragOver
                 */
                this.afterDragOver(target, e, id);
            }
        }
    },

    /**
     * The function of {@link Ext.dd.DragSource}
     * @param {Event} e The event object
     * @param {String} id The id of the dragged element
     */
    onDragOut: function(e, id) {
        var target = this.cachedTarget || Ext.dd.DragDropManager.getDDById(id);
        if (this.beforeDragOut(target, e, id) !== false) {
            if (target.isNotifyTarget) {
                target.notifyOut(this, e, this.dragData);
            }

            // Handled ExtJS DnD implementation glitch.
            // ExtJS DnD implementation fails to remove last applied CSS
            // on ghost node. Hence, removing older CSS manually.
            var proxyEl = this.proxy.getEl();
            for (var i = 0; i < this.ghostCls.length; i++) {
                if (proxyEl.hasCls(this.ghostCls[i])) {
                    proxyEl.removeCls(this.ghostCls[i]);
                }
            }

            // Resets the status indicator to the default dropNotAllowed value
            this.proxy.setStatus(this.dropNotAllowed);

            if (this.afterDragOut) {
                /**
                 * An empty function by default, but provided so that you can perform a custom action
                 * after the dragged item is dragged out of the target without dropping.
                 * @param {Ext.dd.DragDrop} target The drop target
                 * @param {Event} e The event object
                 * @param {String} id The id of the dragged element
                 * @method afterDragOut
                 */
                this.afterDragOut(target, e, id);
            }
        }
        this.cachedTarget = null;
    }
});

/**
 * @private Class to define form item drop zone.
 */
Ext.define('SailPoint.form.editor.plugin.ItemDropZone', {
    extend: 'Ext.tree.ViewDropZone',

    /**
     * Type of node.
     * Possible values can be section, field or button.
     */
    nodeType: 'formItemType',

    /**
     * section node
     */
    sectionNode: 'section',

    /**
     * field node
     */
    fieldNode: 'field',

    /**
     * button node
     */
    buttonNode: 'button',

    /**
     * row node
     */
    rowNode: 'row',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////

    /**
     * @private function of {@link SailPoint.form.editor.ItemDropZone}.
     * Defines drop positions for form items tree panel.
     * The reordering positions supported by the form item tree panel are - after, before and prepend
     * @param {Event} e The event
     * @param {Ext.dd.DragDrop} node The drop target
     */
    getPosition: function(e, node) {
        var view = this.view,
            record = view.getRecord(node),
            y = e.getY(),
            noAppend = record.isLeaf(),
            noBelow = false,
            region = Ext.fly(node).getRegion(),
            fragment;

        // If we are dragging on top of the root node of the tree, we always want to prepend.
        if (record.isRoot()) {
            return 'prepend';
        }

        if (!this.allowParentInsert) {
            noBelow = record.hasChildNodes() && record.isExpanded();
        }

        fragment = (region.bottom - region.top) / (noAppend ? 2 : 3);
        if (y >= region.top && y < (region.top + fragment)) {
            return 'before';
        } else if (!noBelow && (noAppend || (y >= (region.bottom - fragment) && y <= region.bottom))) {
            return 'after';
        } else {
            return 'prepend';
        }
    },

    /**
     * @private function of {@link SailPoint.form.editor.ItemDropZone}.
     * The {@link SailPoint.form.editor.ItemDropZone.onNodeOver} calls continuously while
     * it is being dragged over the drop zone.
     * It Detects valid drop area for dragged node. Returns false on invalid drop area.
     * @param {Ext.dd.DragDrop} node The drop target
     * @param {String} position The drop position indicator
     * @param {Event} e The event
     * @param {Ext.dd.DragZone} dragZone Not useful here
     * @param {Object} data An object containing arbitrary data supplied by the drag source
     */
    isValidDropPoint : function(node, position, dragZone, e, data) {

        if (!node || !data.item) {
            return false;
        }

        var view = this.view,
            targetNode = view.getRecord(node),
            draggedRecords = data.records,
            dataLength = draggedRecords.length,
            ln = draggedRecords.length,
            i, record;

        // No drop position, or dragged records: invalid drop point
        if (!(targetNode && position && dataLength)) {
            return false;
        }

        // If the targetNode is within the folder we are dragging
        for (i = 0; i < ln; i++) {
            record = draggedRecords[i];
            if (record.isNode && record.contains(targetNode)) {
                return false;
            }
        }

        // Respect the allowDrop field on Tree nodes
        if (position === 'prepend' && targetNode.get('allowDrop') === false) {
            return false;
        } else if (position !== 'prepend' && targetNode.parentNode.get('allowDrop') === false) {
            return false;
        }

        // If the target record is in the dragged dataset, then invalid drop
        if (Ext.Array.contains(draggedRecords, targetNode)) {
             return false;
        }

        // Defines the drop area for Form Items (sections, fields and buttons).
        for (i = 0; i < dataLength; i++) {
            // Maximum columns per row should be 4
            var MAX_COLS = 4,
                draggedNodeType = draggedRecords[i].get(this.nodeType),
                targetNodeType = targetNode.get(this.nodeType);

            // 1. Section node is not allowed to drop inside another section node.
            // 2. Section node is not allowed to drop when target node is of type field.
            // 3. Section node is not allowed to drop when target node is of type button.
            if ((draggedNodeType === this.sectionNode && targetNodeType === this.sectionNode
                   && position === 'prepend')
                || (draggedNodeType === this.sectionNode && targetNodeType === this.fieldNode)
                || (draggedNodeType === this.sectionNode && targetNodeType === this.buttonNode)
                || (draggedNodeType === this.sectionNode && targetNodeType === this.rowNode)) {
                return false;
            }
            // 1. Field node is not allowed to drop before or after section node.
            // 2. Field node is not allowed to drop when target node is of type button.
            // 3. Field node is not allowed to drop inside another row node
            //    if dragged field node's parent is different than target row node
            //    and target row node already contains 4 child fields.
            // 4. Field node is not allowed to drop before or after another field node whose
            //    parent node is row and it already has maximum child nodes that is 4
            //    and both dragged as well as dropped field node belongs do different parent.
            else if ((draggedNodeType === this.fieldNode && targetNodeType === this.sectionNode
                    && position !== 'prepend')
                || (draggedNodeType === this.fieldNode && targetNodeType === this.buttonNode)
                || (draggedNodeType === this.fieldNode && targetNodeType === this.rowNode
                    && position === 'prepend' && draggedRecords[i].parentNode.id !== targetNode.id
                    && targetNode.childNodes.length === MAX_COLS)
                || (draggedNodeType === this.fieldNode && targetNode.parentNode.get(this.nodeType) === this.rowNode
                    && draggedRecords[i].parentNode.id !== targetNode.parentNode.id
                    && targetNode.parentNode.childNodes.length === MAX_COLS)) {
                return false;
            }
            // 1. Button node is not allowed to drop if target node is of type section, button or row
            else if ((draggedNodeType === this.buttonNode && targetNodeType === this.sectionNode)
                || (draggedNodeType === this.buttonNode && targetNodeType === this.fieldNode)
                || (draggedNodeType === this.buttonNode && targetNodeType === this.rowNode)) {
                return false;
            }
            // 1. Row node is not allowed to drop outside section node.
            // 2. Row node is not allowed to drop when target node is of type button.
            // 3. Row node is not allowed to drop inside another row node.
            // 4. Row node is not allowed to drop if target node's parent node is of type row.
            else if ((draggedNodeType === this.rowNode && targetNodeType === this.sectionNode
                        && position !== 'prepend')
                || (draggedNodeType === this.rowNode && targetNodeType === this.buttonNode)
                || (draggedNodeType === this.rowNode && targetNodeType === this.rowNode && position === 'prepend')
                || (draggedNodeType === this.rowNode && targetNode.parentNode.get(this.nodeType) === this.rowNode)) {
                    return false;
            }
        }

        return view.fireEvent('nodedragover', targetNode, position, data, e) !== false;
    },

    /**
     * Called while the DropZone determines that a {@link Ext.dd.DragSource} is over a drop node
     * that has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
     * The default implementation returns this.dropAllowed, so it should be overridden to provide the proper feedback.
     * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
     * {@link #getTargetFromEvent} for this node)
     * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
     * @param {Event} e The event
     * @param {Object} data An object containing arbitrary data supplied by the drag source
     * @return {String} status The CSS class that communicates the drop status back to the source so that the
     * underlying {@link Ext.dd.StatusProxy} can be updated
     * @template
     */
    onNodeOver : function(node, dragZone, e, data) {
        var position = this.getPosition(e, node),
            returnCls = this.dropNotAllowed,
            view = this.view,
            targetNode = view.getRecord(node),
            indicator = this.getIndicator(),
            indicatorY = 0;

        // auto node expand check
        this.cancelExpand();
        if (position === 'prepend' && !this.expandProcId
              && !Ext.Array.contains(data.records, targetNode)
              && !targetNode.isLeaf() && !targetNode.isExpanded()) {
            this.queueExpand(targetNode);
        }

        if (this.isValidDropPoint(node, position, dragZone, e, data)) {
            this.valid = true;
            this.currentPosition = position;
            this.overRecord = targetNode;

            indicator.setWidth(Ext.fly(node).getWidth());
            indicatorY = Ext.fly(node).getY() - Ext.fly(view.el).getY() - 1;

            // If view is scrolled using CSS translate, account for then when positioning the indicator
            if (view.touchScroll === 2) {
                indicatorY += view.getScrollY();
            }

            /*
             * In the code below we show the proxy again. The reason for doing this is showing the indicator will
             * call toFront, causing it to get a new z-index which can sometimes push the proxy behind it. We always 
             * want the proxy to be above, so calling show on the proxy will call toFront and bring it forward.
             */
            if (position === 'before') {
                returnCls = Ext.baseCSSPrefix + 'tree-drop-ok-above';
                indicator.showAt(0, indicatorY);
                dragZone.proxy.show();
            } else if (position === 'after') {
                returnCls = Ext.baseCSSPrefix + 'tree-drop-ok-below';
                indicatorY += Ext.fly(node).getHeight();
                indicator.showAt(0, indicatorY);
                dragZone.proxy.show();
            } else {
                // Though we are using 'prepend' position, let this continue return the append Cls
                returnCls = Ext.baseCSSPrefix + 'tree-drop-ok-append';
                // @TODO: set a class on the parent folder node to be able to style it
                indicator.hide();
            }
        } else {
            this.valid = false;
        }

        this.currentCls = returnCls;
        return returnCls;
    },

    /**
     * @private function of {@link SailPoint.form.editor.ItemDropZone}.
     * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been
     * dropped onto the drop node. It provide the appropriate processing of the drop event.
     * @param {Object} data An object containing arbitrary data supplied by the drag source
     * @param {Ext.dd.DragDrop} targetNode The drop target
     * @param {String} position The drop position indicator
     */
    handleNodeDrop : function(data, targetNode, position) {
        var me = this,
            targetView = me.view,
            parentNode = targetNode ? targetNode.parentNode : targetView.panel.getRootNode(),
            Model = Ext.data.Model,
            records, i, len, record,
            insertionMethod, argList,
            needTargetExpand,
            transferData,
            sourceParentNode;

        // preserve parentNode of dragged row node.
        if (data.records[0] && data.records[0].get(this.nodeType) === this.rowNode) {
            sourceParentNode = data.records[0].parentNode;
        }

        // If the copy flag is set, create a copy of the models
        if (data.copy) {
            records = data.records;
            data.records = [];
            for (i = 0, len = records.length; i < len; i++) {
                record = records[i];
                if (record.isNode) {
                    data.records.push(record.copy());
                } else {
                    // If it's not a node, make a node copy
                    data.records.push(new Model(Ext.apply({}, record.data)));
                }
            }
        }

        // Cancel any pending expand operation
        me.cancelExpand();

        // Grab a reference to the correct node insertion method.
        // Create an arg list array intended for the apply method of the
        // chosen node insertion method.
        // Ensure the target object for the method is referenced by 'targetNode'
        if (position === 'before') {
            insertionMethod = parentNode.insertBefore;
            argList = [null, targetNode];
            targetNode = parentNode;
        } else if (position === 'after') {
            if (targetNode.nextSibling) {
                insertionMethod = parentNode.insertBefore;
                argList = [null, targetNode.nextSibling];
            } else {
                insertionMethod = parentNode.appendChild;
                argList = [null];
            }
            targetNode = parentNode;
        } else if (position === 'prepend') {
            if (!(targetNode.isExpanded() || targetNode.isLoading())) {
                needTargetExpand = true;
            }
            insertionMethod = targetNode.insertChild;

            // Insert at first position
            argList = [0];
        }
        // Append the node - The position 'append' is not useful for form item tree.
        else {
            if (!(targetNode.isExpanded() || targetNode.isLoading())) {
                needTargetExpand = true;
            }
            insertionMethod = targetNode.appendChild;
            argList = [null];
        }

        // A function to transfer the data into the destination tree
        transferData = function() {
            var color,
                n;

            // Coalesce layouts caused by node removal, appending and sorting
            Ext.suspendLayouts();

            // Insert the records into the target node
            for (i = 0, len = data.records.length; i < len; i++) {
                record = data.records[i];
                if (!record.isNode) {
                    if (record.isModel) {
                        record = new Model(record.data, record.getId());
                    } else {
                        record = new Model(record);
                    }
                    data.records[i] = record;
                }

                if (position !== 'prepend') {
                    argList[0] = record; // Add record as first function parameter
                    insertionMethod.apply(targetNode, argList);
                } else {
                    argList[1] = record; // Add record as second function parameter
                    insertionMethod.apply(targetNode, argList);
                }
            }

            // If configured to sort on drop, do it according to the TreeStore's comparator
            if (me.sortOnDrop) {
                targetNode.sort(targetNode.getOwnerTree().store.getSorters().sortFn);
            }

            Ext.resumeLayouts(true);

            // Kick off highlights after everything's been inserted, so they are
            // more in sync without insertion/render overhead.
            // Element.highlight can handle highlighting table nodes.
            if (Ext.enableFx && me.dropHighlight) {
                color = me.dropHighlightColor;

                for (i = 0; i < len; i++) {
                    n = targetView.getNode(data.records[i]);
                    if (n) {
                        Ext.fly(n).highlight(color);
                    }
                }
            }
        };

        // If dropping right on an unexpanded node, transfer the data after it is expanded.
        if (needTargetExpand) {
            targetNode.expand(false, transferData);
        }
        // If the node is waiting for its children, we must transfer the data after the expansion.
        // The expand event does NOT signal UI expansion, it is the SIGNAL for UI expansion.
        // It's listened for by the NodeStore on the root node. Which means that listeners on the target
        // node get notified BEFORE UI expansion. So we need a delay.
        // TODO: Refactor NodeInterface.expand/collapse to notify its owning tree directly when it needs to expand/collapse.
        else if (targetNode.isLoading()) {
            targetNode.on({
                expand: transferData,
                delay: 1,
                single: true
            });
        }
        // Otherwise, call the data transfer function immediately
        else {
            transferData();
        }

        // If dragged-node is of type row then reset the all row node text
        // in source as well as target node section
        if (record.get(this.nodeType) === this.rowNode) {
            var sectionNodes = [sourceParentNode],
                formItemHelper = new SailPoint.form.editor.FormItemHelper({});

            if (targetNode.get(this.nodeType) === this.fieldNode) {
                sectionNodes.push(targetNode.parentNode);
            } else if (targetNode.get(this.nodeType) === this.sectionNode) {
                sectionNodes.push(targetNode);
            }

            formItemHelper.resetRowNodeText(sectionNodes);
        }
    },

    /**
     * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been dragged out of
     * the drop node without dropping.
     * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
     * {@link #getTargetFromEvent} for this node)
     * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
     * @param {Event} e The event
     * @param {Object} data An object containing arbitrary data supplied by the drag source
     */
    onNodeOut : function(n, dd, e, data) {
        this.getIndicator().hide();
    },

    /**
     * Called while the DropZone determines that a {@link Ext.dd.DragSource} is being dragged over it,
     * but not over any of its registered drop nodes.
     * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
     * @param {Event} e The event
     * @param {Object} data An object containing arbitrary data supplied by the drag source
     * @return {String} status The CSS class that communicates the drop status back to the source so that the
     * underlying {@link Ext.dd.StatusProxy} can be updated
     */
    onContainerOver : function(dd, e, data) {
        this.valid = false;
        return this.allowContainerDrops ? this.dropAllowed :
            e.getTarget('.' + this.indicatorCls) ? this.currentCls : this.dropNotAllowed;
    }
});
