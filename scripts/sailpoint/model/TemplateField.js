Ext.define('SailPoint.model.TemplateField', {
    extend: 'Ext.data.Model',
    fields: [
        {name:'name', type:'string'},
        {name:'originalName', type:'string'},
        {name:'type', type:'string'},
        {name:'displayName', type:'string'},
        {name:'helpKey', type:'string'},
        {name:'required', type:'boolean'},
        {name:'reviewRequired', type:'boolean'},
        {name:'postBack', type:'boolean'},
        {name:'displayOnly', type:'boolean'},
        {name:'authoritative', type:'boolean'},
        {name:'defaultValue', type:'string'},
        {name:'rule', type:'string'},
        {name:'script',type:'string'},
        {name:'owner', type:'string'},
        {name:'ownerType', type:'string'},
        {name:'allowedValues', type:'auto'},
        {name:'allowedValuesType', type:'string'},
        {name:'multi', type:'boolean'},
        {name:'dynamic', type:'boolean'},
        {name:'section', type:'string'},
        {name:'validationRule', type:'string'},
        {name:'validationScript', type:'string'},
        {name:'label', type: 'string'},
        {name:'action', type: 'string'},
        {name:'hidden', type: 'object'},
        {name:'readOnly', type: 'object'},
        {name:'parameter', type: 'string'},
        {name:'skipValidation', type: 'boolean'},
        {name:'value', type: 'string'},
        {name:'dependentApp', type:'string'},
        {name:'dependentAttr', type:'string'},
        {name: 'localizedDisplayName', type:'string'},
        {name: 'filter', type:'string'}
    ]
});
