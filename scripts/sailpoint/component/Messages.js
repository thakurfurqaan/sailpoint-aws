/**
* (c) Copyright 2012 SailPoint Technologies, Inc., All Rights Reserved.
*
* THIS FILE IS AUTO-GENERATED FROM JAVA FILE: $iiqFolder/tools/j2js/java-code/src/sailpoint/message/Messages.java
* PLEASE DON'T MODIFY THIS FILE HERE.
*/

Ext.namespace ("sailpoint.message");


Ext.define('sailpoint.message.Messages', {
    constructor : function (config) {
        this.id = config["id"];
        this.containerElement = Ext.get(this.id);
        this.closeImageElement = Ext.get(this.id + "-closeImg");
        this.listElement = Ext.get(this.id + "-list");
        this.closeImageElement.on('click', this.close.bind(this));
    }

    , id : null
    , containerElement : null
    , closeImageElement : null
    , listElement : null
    , close : function () {
        this.containerElement.hide();
    }
    , showInfo : function (val) {
        this.showWithClass(val, "info");
    }
    , showWarning : function (val) {
        this.showWithClass(val, "warning");
    }
    , showValidation : function (val) {
        this.showWithClass(val, "validation");
    }
    , showError : function (val) {
        this.showWithClass(val, "error");
    }
    , showSuccess : function (val) {
        this.showWithClass(val, "success");
    }
    , addMessage : function (val) {
        var li = document.createElement("li");
        li.innerHTML = val;
        this.listElement.appendChild(li);
    }
    , showWithClass : function (val, className) {
        this.listElement.dom.innerHTML = "";
        this.containerElement.dom.className = className;
        this.addMessage(val);
        this.containerElement.show();
    }
});
