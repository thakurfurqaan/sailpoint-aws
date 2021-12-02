Ext
    .onReady(function() {
        // Setup the permissions selector
        var permissions = Ext.getDom('editForm:pamPermissionsInput').value;
        var permissionSelect = new SailPoint.form.MultiText({
            value: permissions ? permissions.slice(1, permissions.length-1).split(',') : null,
            hideEmptyLabel: true,
            width: 300,
            selectionsGridWidth: 300,
            name: 'pamPermissions',
            renderTo: 'pamPermissionsDiv',
            id: 'pamPermissions'
        });
        var onPermissionsChange = function(e) {
            Ext.getDom('editForm:pamPermissionsInput').value = '[' + permissionSelect.getValue().join(',') + ']';
        };
        permissionSelect.on('add', onPermissionsChange);
        permissionSelect.on('spChange', onPermissionsChange);
    });