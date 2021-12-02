/* (c) Copyright 2016 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This class help us to keep similarities in UI appearance of
 * properties-form panel throughout section, field and button.
 *
 * @author Navnath.Misal
 *
 * Instantiate this class when creating and editing a form item.
 */

Ext.define('SailPoint.form.editor.DivisionPanel', {
    extend: 'Ext.form.Panel',

    /////////////////////////////////////////////
    //  constants                              //
    /////////////////////////////////////////////
    FA: 'fa',

    FA_GRAY: 'fa-gray-icon',

    FA_CHEVRON_UP: 'fa-chevron-up',

    FA_CHEVRON_DOWN: 'fa-chevron-down',

    /////////////////////////////////////////////
    //  functions                              //
    /////////////////////////////////////////////
    initComponent : function() {
        var me = this;

        Ext.apply(me, {
            cls: 'divisionPanel',
            layout: {type:'table', columns:1},
            defaultType: 'textfield',
            collapsible: true,
            width: 470
        });

        me.callParent(arguments);
    },

    /**
     * Method to insert component to the division panel
     */
    insertComponent : function(component) {
        var me = this;

        me.insert(me.items.length - 1, component);
    },

    /**
     * @private
     * Method to add tools on panel header. This adds
     * collapsable tool with fontAwseme (fa) icon.
     */
    initTools : function() {
        var me = this;

        me.tools = me.tools ? Ext.Array.clone(me.tools) : [];

        // Add a collapse tool unless configured to not show a collapse tool
        // or to not even show a header.
        if (me.collapsible && !(me.hideCollapseTool || me.header === false || me.preventHeader)) {
            me.collapseDirection = me.collapseDirection || me.headerPosition || 'top';
            me.collapseTool = me.expandTool = Ext.widget({
                // font awesome(fa) icon
                type: (me.collapsed && !me.isPlaceHolderCollapse()) ? me.FA_CHEVRON_DOWN : me.FA_CHEVRON_UP,
                renderTpl: '<span id="{id}-toolEl" class="'+ me.FA + ' ' + me.FA_GRAY + ' ' + '{type}" role="presentation"/>',
                handler: me.toggleCollapse,
                scope: me,
                xtype: 'tool',
            });

            // Prepend collapse tool is configured to do so.
            if (me.collapseFirst) {
                me.tools.unshift(me.collapseTool);
            }
        }

        // Add subclass-specific tools.
        me.addTools();

        // Make Panel closable.
        if (me.closable) {
            me.addClsWithUI('closable');
            me.addTool({
                type: 'close',
                handler: Ext.Function.bind(me.close, me, [])
            });
        }

        // Append collapse tool if needed.
        if (me.collapseTool && !me.collapseFirst) {
            me.addTool(me.collapseTool);
        }
    },

    /**
     * @private
     * Invoked after the Panel is Collapsed.
     * @param {Boolean} animated
     */
    afterCollapse : function(animated) {
        var me = this;

        // rotate fa icon
        me.rotateIcon(animated, true);
    },

    /**
     * @private
     * Invoked after the Panel is Expanded.
     * @param {Boolean} animated
     */
    afterExpand : function(animated) {
        var me = this;

        // rotate fa icon
        me.rotateIcon(animated, false);
    },

    /**
     * @private
     * Rotates fa cheveron icon.
     * @param {Boolean} animated
     * @param {Bpplean} collapsed
     */
    rotateIcon : function(animated, collapsed) {
        var me = this,
            ownerLayout = me.ownerLayout;

        me.isCollapsingOrExpanding = 0;
        if (me.collapseTool) {
            var spanEl = me.collapseTool.getEl().down('span.fa');
            if (spanEl.hasCls('rotate')) {
                spanEl.replaceCls('rotate', 'unrotate')
            } else if (spanEl.hasCls('unrotate')) {
                spanEl.replaceCls('unrotate', 'rotate')
            } else {
                spanEl.addCls('rotate');
            }
        }

        if (ownerLayout && animated) {
            ownerLayout.onContentChange(me);
        }

        if (collapsed) {
            me.setHiddenDocked();
            me.fireEvent('collapse', me);
        } else {
            me.fireEvent('expand', me);
        }
    }
});
