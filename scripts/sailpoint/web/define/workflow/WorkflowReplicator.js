Ext.define('SailPoint.WorkflowStepReplicatorPanel', {
    extend : 'Ext.form.FieldSet',
    alias : 'widget.spworkflowstepreplicatorpanel',

    /** Name of the input to replicate. This should be an input in the form of a list **/
    referenceVar: null,

    /** Name of the variable passed to the subprocess to reference the replicated item **/
    replicatorVarName: null,

    /** stepObject being edited **/
    stepObj: null,

    /** List of variables in which the replicator can reference **/
    referenceables: null,

    /** Combo used to select the referenceVar **/
    referenceCombo: null,

    varNameTextbox: null,

    replicatorToggle: null,

    title: '#{msgs.step_replicator_title}',

    initComponent: function() {


        this.replicatorToggle = Ext.create('Ext.form.field.Checkbox', {
            itemId:'replicatorToggle',
            fieldLabel: '#{msgs.step_replicator_label}',
            labelWidth: 135,
            helpText: '#{help.help_workflow_step_replication}',
            name: 'monitorStep',
            parent: this,
            listeners: {
                change: this.toggleReplicator
            }
        });

        var variables = [];
        if(this.referenceables) {
            for(var i=0; i<this.referenceables.length; i++) {
                variables.push(this.referenceables[i].name);
            }
        }

        this.referenceCombo = Ext.create('Ext.form.ComboBox',{
            id: this.id+'_var_reference',
            fieldLabel: '#{msgs.step_replicator_reference_var}',
            labelWidth: 135,
            store:variables,
            helpText: '#{msgs.help_workflow_step_replicator_reference}',
            hidden:true,
            width:400,
            listConfig : {width:400}
        });

        this.varNameTextbox = Ext.create('Ext.form.TextField', {
            id: this.id+'_varname',
            fieldLabel: '#{msgs.step_replicator_var}',
            labelWidth: 135,
            hidden: true,
            width: 400,
            helpText: '#{msgs.help_workflow_step_replicator_var}'

        });

        this.items = [];
        this.items.push(this.replicatorToggle);
        this.items.push(this.referenceCombo);
        this.items.push(this.varNameTextbox);

        this.callParent(arguments);
    },

    toggleReplicator: function(checkbox) {
        if (checkbox && checkbox.getValue()) {
            this.parent.referenceCombo.show();
            this.parent.varNameTextbox.show();
        } else {
            this.parent.referenceCombo.hide();
            this.parent.varNameTextbox.hide();
        }
    },

    load: function() {
        if (this.stepObj && this.stepObj.replicator) {
            this.replicatorToggle.setValue(true);
            this.referenceCombo.setValue(this.stepObj.replicator.itemsVar);
            this.varNameTextbox.setValue(this.stepObj.replicator.arg);
        }
    },

    reset: function() {
        this.replicatorToggle.setValue(false);
    },

    validate : function() {

        if (this.replicatorToggle.getValue()) {
            //Replicator Enabled
            var refComb = this.referenceCombo.getValue();
            if (refComb == "" || refComb == null) {
                this.referenceCombo.focus(true, true);
                return false;
            }

            var varName = this.varNameTextbox.getValue();
            if (varName == "" || varName == null) {
                this.varNameTextbox.focus(true, true);
                return false;
            }

        }

        return true;
    },

    save: function() {
        if (this.replicatorToggle.getValue()) {
            //Replicator enabled
            var replicator = {itemsVar: this.referenceCombo.getValue(), arg: this.varNameTextbox.getValue()};
            this.stepObj.replicator = replicator;
        } else {
            //Null out the replicator on the step
            this.stepObj.replicator = null;
        }
    }


});