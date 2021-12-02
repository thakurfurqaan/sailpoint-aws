/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.namespace('SailPoint.systemSetup.objectAttribute');
var ns = SailPoint.systemSetup.objectAttribute;

Ext.define('SailPoint.systemSetup.objectAttribute.Util', {
    statics : {
        isNull : function(val) {
            return (typeof (val) == 'undefined' || val == null);
        },
        
        notInitialized : function(val) {
            if (ns.Util.isNull(val)) {
                return true;
            }
            if (val.trim() == '') {
                return true;
            }
            return false;
        },
        
        setFormDefaultValue : function(val) {
            Ext.getDom('mainForm:defaultValue').value = val;
        },
        
        getFormDefaultValue : function() {
            return Ext.getDom('mainForm:defaultValue').value;
        }
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.BaseHandler', {
    
    constructor : function(config) {
        this._element = null;
        this._errorElement = Ext.getDom('mainForm:defaultValueError');
    },
    
    getDefaultValue : function() {
        return Ext.getDom('mainForm:defaultValue').value;
    },

    hideElement : function() {
        this._element.style.display = 'none';
    },

    showElement : function() {
        this._element.style.display = '';
    },

    validate : function() {
        return true;
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.StringTypeHandler', {
    extend:ns.BaseHandler,
    
    constructor : function() {
        this.callParent(arguments);
        this._element = Ext.getDom('mainForm:defaultValueString');
        this._allowedValuesPanel = Ext.getDom('allowedValuesPanel');
        this._isRequiredPanel = Ext.getDom('isRequiredPanel');
        this._isRequiredCheckbox = Ext.getDom('mainForm:required');
        this._allowedValuesElement = Ext.getDom('mainForm:allowedValues');
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this._allowedValuesPanel.style.display = '';
        this._isRequiredPanel.style.display = '';
        this._element.value = this.getDefaultValue();
    },
    
    setDefaultValue : function() {
        Ext.getDom('mainForm:defaultValue').value = this._element.value;
    },

    validate : function() {
        var value = this._element.value;
        if (ns.Util.notInitialized(value)) {
            return true;
        }
        var allowedValuesString = this._allowedValuesElement.value;
        if (ns.Util.notInitialized(allowedValuesString)) {
            return true;
        }

        var allowedValues = Ext.Array.toArray(allowedValuesString.split('\n'));
        for ( var i = 0; i < allowedValues.length; ++i) {
            if (allowedValues[i].trim() == value.trim()) {
                return true;
            }
        }
        this._errorElement.style.display = '';
        return false;
    },

    onSelected : function() {
        this._element.style.display = '';
        this._allowedValuesPanel.style.display = '';
        this._isRequiredPanel.style.display = '';
        this._element.value = '';
        this._allowedValuesElement.value = '';
    },

    isRequired : function() {
        return (this._isRequiredCheckbox.checked === true);
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.IntTypeHandler', {
    extend : ns.BaseHandler,
    constructor : function(){
        this.callParent(arguments);
        this._element = Ext.getDom('mainForm:defaultValueString');
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this._element.value = this.getDefaultValue();
    },

    setDefaultValue : function() {
        Ext.getDom('mainForm:defaultValue').value = this._element.value;
    },

    onSelected : function() {
        this._element.style.display = '';
        this._element.value = '';
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.BooleanTypeHandler', {
    extend : ns.BaseHandler,
    
    constructor : function(config){
        this.callParent(arguments);
        this._element = Ext.getDom('mainForm:defaultValueBoolean');
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this._element.value = this.getDefaultValue();
    },

    setDefaultValue : function() {
        Ext.getDom('mainForm:defaultValue').value = this._element.value;
    },

    onSelected : function() {
        this._element.style.display = '';
        this._element.value = 'false';
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.DateTypeHandler', {
    extend : ns.BaseHandler,
    
    constructor : function() {
        this.callParent(arguments);
        this._element = Ext.getDom('defaultValueDate');
        this._isDateInitialized = false;
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this.setHiddenDateValue(this.getDefaultValue());
        this.initDateIfRequired();
    },

    setDefaultValue : function() {
        var val = this.getHiddenDateValue();
        if (!val) {
            val = '';
        }
        Ext.getDom('mainForm:defaultValue').value = val;
    },

    onSelected : function() {
        this._element.style.display = '';
        this.initDateIfRequired();
    },

    getHiddenDateValue : function() {
        var val = Ext.DomQuery.select('input', this._element)[0].value;
        if (ns.Util.notInitialized(val)) {
            return null;
        }
        return val;
    },

    setHiddenDateValue : function(val) {
        Ext.DomQuery.select('input', this._element)[0].value = val;
    },

    initDateIfRequired : function() {
        if (this._isDateInitialized === true) {
            return;
        }

        var dateInputs = Ext.DomQuery.select('input', this._element);
        var dateInput = dateInputs[0];

        var dateTimeInput = new SailPoint.DateTimeInput({
            inputEl : dateInput,
            renderTo : this._element.id
        });

        this._isDateInitialized = true;
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.RuleTypeHandler', {
    extend : ns.BaseHandler,
    
    constructor : function(){
        this.callParent(arguments);
        this._element = Ext.getDom('mainForm:defaultValueRule');
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this._element.value = this.getDefaultValue();
    },

    setDefaultValue : function() {
        Ext.getDom('mainForm:defaultValue').value = this._element.value;
    },

    onSelected : function() {
        this._element.style.display = '';
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.IdentityTypeHandler', {
    extend : ns.BaseHandler,
    
    constructor : function() {
        this.callParent(arguments);
        this._element = Ext.getDom('defaultValueIdentitySuggest');
        this._valueElement = Ext.getDom('defaultValueIdentity');
        this._isIdentitySelectInitialized = false;
    },
    
    loadInitialValue : function() {
        this._element.style.display = '';
        this._valueElement.value = this.getDefaultValue();
        this.initIdentitySelectIfRequired();
    },

    setDefaultValue : function() {
        var val = this.getIdentitySelectedValue();
        if (val != null) {
            Ext.getDom('mainForm:defaultValue').value = val;
        }
    },

    onSelected : function() {
        this._element.style.display = '';
        this.initIdentitySelectIfRequired();
    },

    getIdentitySelectedValue : function() {
        return this._valueElement.value;
    },

    initIdentitySelectIfRequired : function() {
        if (this._isIdentitySelectInitialized === true) {
            return;
        }

        var identitySuggest = new SailPoint.IdentitySuggest({
            id: 'objectAttIdentSuggestCmp',
            valueField : 'name',
            initialData: [
                {
                    'name': this.getIdentitySelectedValue(),
                    'displayableName': this.getIdentitySelectedValue(),
                    'icon': 'userIcon'
                }
            ],
            renderTo : 'defaultValueIdentitySuggest',
            binding : 'defaultValueIdentity',
            width : 200,
            baseParams : {
                context : 'IdentityAttribute'
            }
        });

        this._isIdentitySelectInitialized = true;
    }
});

Ext.define('SailPoint.systemSetup.objectAttribute.PageFunctions', {
    
    constructor : function(config) {
        this._typeHandlers = [];
        this.initializeTypeHandlers();
    },
    
    initializeTypeHandlers : function() {
        this._typeHandlers.push( Ext.create(ns.StringTypeHandler) );
        this._typeHandlers.push( Ext.create(ns.IntTypeHandler) );
        this._typeHandlers.push( Ext.create(ns.BooleanTypeHandler) );
        this._typeHandlers.push( Ext.create(ns.DateTypeHandler) );
        this._typeHandlers.push( Ext.create(ns.RuleTypeHandler) );
        this._typeHandlers.push( Ext.create(ns.IdentityTypeHandler) );
    },

    getSelectedIndex : function() {
        return Ext.getDom('mainForm:type').selectedIndex;
    },

    getTypeHandler : function() {
        return this._typeHandlers[this.getSelectedIndex()];
    },

    setDefaultValue : function() {
        var typeHandler = this.getTypeHandler();
        if (typeHandler.validate() == false) {
            return false;
        }

        typeHandler.setDefaultValue();

        return true;
    },

    onTypeSelectionChange : function() {
        // reset everything
        for ( var i = 0; i < this._typeHandlers.length; ++i) {
            this._typeHandlers[i].hideElement();
        }
        Ext.getDom('allowedValuesPanel').style.display = 'none';
        Ext.getDom('isRequiredPanel').style.display = 'none';
        Ext.getDom('mainForm:allowedValues').value = '';
        Ext.getDom('mainForm:defaultValueError').style.display = 'none';

        // fire change event
        this.getTypeHandler().onSelected();
    },

    loadInitialDefaultValue : function() {
        this.getTypeHandler().loadInitialValue();
    }
});

var objectAttributeHelper;

Ext.onReady(function() {
    objectAttributeHelper = Ext.create('SailPoint.systemSetup.objectAttribute.PageFunctions');
    objectAttributeHelper.loadInitialDefaultValue();
});
