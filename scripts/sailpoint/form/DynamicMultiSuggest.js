/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.form.DynamicMultiSuggest', {
    extend : 'SailPoint.MultiSuggest',
    alias : 'widget.spdynamicmultisuggest',

  constructor: function(config) {
    this.config = config;
    this.callParent(arguments);
  },

  layout: 'anchor',

  initComponent: function() {
    this.jsonData = {'totalCount' :0, 'objects' :[]};

    var suggestConfig = this.config;
    suggestConfig.id = this.config.itemId+"combo";

    // label is handled elsewhere so remove for combo box
    suggestConfig.fieldLabel = undefined;
    // ignore default width because we want this sized automatically
    suggestConfig.ignoreWidth = true;

    this.suggest = new SailPoint.form.DynamicComboBox(suggestConfig);
    this.callParent(arguments);
  }
});