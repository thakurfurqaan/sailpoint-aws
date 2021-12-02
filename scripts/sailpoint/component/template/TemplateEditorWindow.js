/**
 * @ignore
 * Not in use anymore in the Form Editor.
 * Get rid of this JavaScript!
 */

Ext.ns('SailPoint',
       'SailPoint.template',
       'SailPoint.template.TemplateEditorWindow');

SailPoint.template.TemplateEditor.EditorWindow = null;
SailPoint.template.TemplateEditor.DEFAULT_HEIGHT = 550;
SailPoint.template.TemplateEditor.PANEL_HEIGHT = 650;

SailPoint.template.TemplateEditor.ShowEditorWindow = function(beanType, usage) {

  if(!SailPoint.template.TemplateEditor.EditorWindow) {
    var height = Ext.getBody().getViewSize().height - 50;
    if(height<SailPoint.template.TemplateEditor.DEFAULT_HEIGHT) {
      height = SailPoint.template.TemplateEditor.DEFAULT_HEIGHT;
    }

    SailPoint.template.TemplateEditor.EditorWindow = new SailPoint.template.TemplateEditorWindow({
      beanType: beanType,
      usage: usage,
      height: height
    });
  } else {
      SailPoint.template.TemplateEditor.EditorWindow.setUsage(usage);
  }
  
  SailPoint.template.TemplateEditor.EditorWindow.show();
};

Ext.define('SailPoint.template.TemplateEditorWindow', {
  extend : 'Ext.Window',
  
  id: 'formEditorWindow',
  
  formEditor: null,

  beanType: null,
  
  usage: null,
  
  closeAction: 'hide',
  
  plain: true,
  
  autoScroll: false,
  
  createTemplateEditor : function() {
    this.formEditor = Ext.create('SailPoint.template.TemplateEditor', {
      id: 'formEditor',
      beanType: this.beanType,
      usage: this.usage
    });
  },

  initComponent : function() {

    this.createTemplateEditor();
    
    Ext.applyIf(this, {
        title       : '#{msgs.template_editor_title}',
        width       : 1000,
        autoScroll  : true,
        layout      : 'border',
        modal       : true
    });

    this.items = [ this.formEditor ];

    this.buttons = [
        { text     : '#{msgs.button_save}',
          window   : this,
          handler  : function () {
            if(this.window.formEditor.save()) {
              this.window.exit();
            }
          }
        },
        { text     : '#{msgs.button_close}',
          cls : 'secondaryBtn',
          window   : this,
          handler  : function( ){
            this.window.exit();
          }
        }
    ];

    this.on('beforeshow', function() {
      this.center();
      this.formEditor.load();
    });

    this.callParent(arguments);
  }, 
  setUsage: function(usage) {
      this.usage = usage;
      if (this.formEditor) {
          this.formEditor.setUsage(usage);
      }
  },
  exit: function() {
      this.hide();
  }
});