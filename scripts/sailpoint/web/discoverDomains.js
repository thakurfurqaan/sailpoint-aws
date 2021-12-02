 /* (c) Copyright 2015 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.ns('SailPoint.DiscoverDomains');
Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '../ux');
Ext.onReady(function () {
        Ext.QuickTips.init();
        var isGCDataSaved = false;  
});

Ext.require([
             'Ext.form.Panel',
             'Ext.ux.form.MultiSelect',
             'Ext.ux.form.ItemSelector'
         ]);



SailPoint.DiscoverDomains.useTLS = function (isChecked,id) {
    if (isChecked === true) {
        Ext.getDom(id+'Btn').click();
    } else if(isChecked === false) {
      Ext.getDom(id+'Btn').click();
    }
 };

 /*
  * This function toggles TLS checkbox to enabled / disabled
  * when the values in authentication type checkout are selected as simple / strong 
  */
SailPoint.DiscoverDomains.toggleTls = function (selectedValue,selectId, suffix) {
	
	// Initializations
	var inx 	= selectId.lastIndexOf(":");
    var prefix 	= selectId.substring(0, inx);
    var idOfTls = prefix + ":" + suffix;
    
    // If user has selected strong authentication
    if(selectedValue == 'strong') {
      // then uncheck TLS, as our bean code reads it
      Ext.getDom(idOfTls).checked = false;
      // then disable TLS checkbox
	  Ext.getDom(idOfTls).disabled = true;
    }
    else {
    	// orthwise enable TLS checkbox
    	Ext.getDom(idOfTls).disabled = false;
    }
 };

 /* 
  * This function toggles bind port in gc server textbox, when user checks / unchecks
  * TLS checkbox
  */
 SailPoint.DiscoverDomains.toggleBindPort = function (tls, tlsId, suffix) {
		
	 	// Constants
		var TLS_PORT 		= "3269";
		var NON_TLS_PORT 	= "3268";
		var NON_DEFINED  	= "";
		
		// Initializations
		var inx 			= tlsId.lastIndexOf(":");
	    var prefix 			=  tlsId.substring(0, inx);
	    var idOfGcServer 	= prefix + ":" + suffix;
	    var gcServer 		= Ext.getDom(idOfGcServer).value;
	    var serverPortInx 	= gcServer.lastIndexOf(":");
	    var serverPort 		= NON_DEFINED;
	    
	    // If server port is provided by user / automatically
	    if(serverPortInx != -1) {
	    	// then get its value
	    	serverPort = gcServer.substring(serverPortInx + 1, gcServer.length);
	    }
	    
	    // If server port is either TLS, NON TLS or NOT DEFINED, then we would attempt to 
	    // modify it, otherwise if user has defined something else, we would not touch it
	    if(serverPort == TLS_PORT || serverPort == NON_TLS_PORT || serverPort == NON_DEFINED) {
	    	
	    	// If TLS is checked, then use TLS port
	    	if(tls) {
		    	serverPort = TLS_PORT;
		    }
		    else { // otherwise then use NON TLS port
		    	serverPort = NON_TLS_PORT;
		    }
	    	
	    	// Assume GC address to be without port
	    	var gcServerWithoutPort = gcServer;
            
	    	// if however port is provided
            if(serverPortInx != -1) {
            	// then extract it
            	gcServerWithoutPort = gcServer.substring(0, serverPortInx);
            }
            
            // and append port we found using above logic to this gc server
	    	gcServer = gcServerWithoutPort + ":" + serverPort;
	    	// and finally set that value in the field
	    	Ext.getDom(idOfGcServer).value = gcServer;
	    }
	 };

 /*
  * This function toggles authentication type drop down to enabled / disabled 
  * when user checks / unchecks TLS checkbox  
  */
 SailPoint.DiscoverDomains.toggleAuthenticationType = function (tls,tlsId, suffix) {
		
	 	// Initializations
		var inx 		 = tlsId.lastIndexOf(":");
	    var prefix 		 =  tlsId.substring(0, inx);
	    var idOfAuthType = prefix + ":" + suffix;
	    
	    // If TLS checkout is selected
	    if(tls) {
	    	// then select 'simple' authentication 
	    	//Ext.getDom(idOfAuthType).selected = 'simple';
	    	// and mark the authentication type drop down as disabled
	    	//Ext.getDom(idOfAuthType).disabled = true;
	    	// and grey out its color
	    	//Ext.getDom(idOfAuthType).style.backgroundColor = '#eeeeee';
	    	
	    	// Click the button to disable auth type drop down list
	    	Ext.getDom(tlsId+'Checked').click();
	    }
	    else {
	    	// otherwise enable authentication type drop down
	    	//Ext.getDom(idOfAuthType).disabled = false;
	    	// and set its background color as white
	    	//Ext.getDom(idOfAuthType).style.backgroundColor = '#ffffff';
	    	
	    	// Click the button to enable auth type drop down list
	    	Ext.getDom(tlsId+'Unchecked').click();
	    }
	 };
 
 
SailPoint.DiscoverDomains.ManageAllDomain = function (isChecked,id) {
       if (isChecked === true) {
           Ext.getDom(id+'Btn').click();
       } else if(isChecked === false) {
         Ext.getDom(id+'Btn').click();
       }
    };

 // The index is the row number of the Domain table
 // The domain parameter is sent to the connector which brings the corresponding
 // servers
 SailPoint.DiscoverDomains.showServers = function (index, domain) {
     var serverData = Ext.getDom('editForm:domainInfo:'+ index +':servers');
     var servers = serverData.value.split("\n");
     var data = [];
     var len = servers.length;
     var i;
     for (i=0; i < len; i++) {
         var temp = {"name": servers[i]};
         data.push(temp);
     }

      var ds = SailPoint.Store.createStore({
         url: CONTEXT_PATH + '/define/applications/discoverServers.json',
         fields: ['name','value'],
         autoLoad: true,
         baseParams: {domain : domain,
                      servers: servers}
     });
     
     var itemselectorField = new Ext.FormPanel({
         title: 'Select Servers for the Domain',
         width: 663,
         id:'selectServerId',
         bodyPadding: 4,
         height: 333,
         renderTo: 'itemselector',
         items:[{
             xtype: 'label',
             forId: 'availableServers',
             text: 'Available Servers',
             style: 'font-weight:bold; height:20px; width:150px;'
         }, {
             xtype: 'label',
             forId: 'selectedServers',
             text: 'Selected Servers',
             style: 'font-weight:bold; height:20px; width:100px; margin-left:200px;'
         }, {
             xtype: 'itemselector',
             name: 'itemselector',
             id: 'itemselectorField',
             shrinkWrap: 3, 
             anchor: '100%',
             imagePath: '../images/extjs-ux/',
             store:ds,
             displayField: 'name',
             valueField: 'name',
             allowBlank: true,
             msgTarget: 'side',
             fromTitle: 'Available',
             toTitle: 'Selected',
             listeners: {
                 afterrender: function(field) {
                     var servers = [];
                     for(var key in data) {
                         servers.push(data[key].name);
                     }
                     field.setValue(servers);
                 }
             }
         }]
     });

     var  serversWinID = Ext.create('Ext.window.Window', {
         id: 'serversWinID',
         height: 400,
         width: 675,
         modal: true,
         resizable: false,
         buttons: [{
                         text: 'Ok',
                         id: 'saveServers',
                         handler: function () {
                         this.setDisabled(false);
                         var serverStrings = '';
                         var itemField = Ext.getCmp('itemselectorField');
                         
                         if(itemField) {
                             var fieldList = itemField.toField;
                             var temp = fieldList.store.getRange();
                             var i=0;
                             var len = temp.length;
                             
                             for (i=0; i < len; i++) {
                                     if(i != 0)
                                         serverStrings += '\n';
                                     serverStrings += temp[i].data.name;
                             }
                         }
                         var obj = Ext.getDom('editForm:domainInfo:'+ index +':servers');
                         obj.value = serverStrings;
                         Ext.getCmp('serversWinID').close();
                 }
         },
         {
                 text: 'Cancel',
                 id: 'cancelServer',
                 handler: function () {
                         this.setDisabled(false);
                         Ext.getCmp('serversWinID').close();
                 }
          }],
         bodyStyle: 'background-color: white; padding: 0px; overflow: auto',
         items:[itemselectorField]
     });

     Ext.getCmp('serversWinID').show();
 };
    
SailPoint.DiscoverDomains.startDiscover = function () {
        Ext.getDom('forestResultsDiv').className = 'workingText';
        Ext.getDom('forestResultsDiv').innerHTML = '#{msgs.discover_domains}';
        Ext.select('.discoverDomainSpinner').setStyle('display', 'inline');
};


SailPoint.DiscoverDomains.manageAllDomainStart = function () {
    Ext.getDom('forestResultsDiv').className = 'workingText';
    Ext.getDom('forestResultsDiv').innerHTML = '#{msgs.discover_domains}';
    Ext.select('.discoverDomainSpinner').setStyle('display', 'inline');
};

SailPoint.DiscoverDomains.manageAllDomainEnd = function () {
    Ext.select('.discoverDomainSpinner').setStyle('display', 'none');
};


SailPoint.DiscoverDomains.endDiscover = function () {
        Ext.select('.discoverDomainSpinner').setStyle('display', 'none');
};

SailPoint.DiscoverDomains.togglePartitionCount = function (isChecked,id) {
    if ( isChecked == true ) {
        Ext.get(id).setStyle('display', 'block');
    } else if( isChecked == false ) {
        Ext.get(id).setStyle('display', 'none');
    }
};

SailPoint.DiscoverDomains.addInForestTable = function () {
    addDomainForestEntry = Ext.getDom('editForm:footDomainForestName').value;
    if (addDomainForestEntry !== null) {
        Ext.getDom('editForm:footForestName').value = addDomainForestEntry;
        Ext.getDom('editForm:addForestData').click();
        //Ext.getDom('editForm:clickme').click();
    }
};

// This is a private function that helps determine the checkboxes' container.  
// Note that the id of the 'all' checkbox is assumed to end in 'selectAllToggle,' as 
// demonstrated in the sample scenario above.  Some details as to why this is needed
// are provided below in the toggleAll function comments.
function getTablePrefixForToggle(toggleId) {
    var endOfPrefix = toggleId.lastIndexOf(':selectAllToggle');
    return toggleId.substring(0, endOfPrefix);
}

// This function accepts three parameters: a toggle id that ends in 'selectAllToggle,' 
// the new value to which all the checkboxes will be set, and an optional filterClass
// parameter that specifies the class of checkbox elements that should be set.  If no
// filterClass is specified, all the checkboxes in the table will be toggled.
// See the sample scenario at the top of this file for more info. 
// Forcing the id of the controlling checkbox to be 'selectAllToggle' is admittedly ugly,
// but the alternative is to pass in the JSF-generated prefix for the table, which is 
// potentially difficult.  I thought that this solution was the lesser of the two evils 
// -- Bernie
SailPoint.DiscoverDomains.toggleAll = function(toggleId, newValue, filterClass) {
    var tableId = getTablePrefixForToggle(toggleId);
  
    var inputs;
    
    if (filterClass) {
        inputs = Ext.getDom(tableId).getElementsByClassName(filterClass);
    } else {
        inputs = Ext.getDom(tableId).getElementsByTagName('input');
    }
    
    for (var i = 0; i < inputs.length; ++i) {
        if (inputs[i].type == 'checkbox' && inputs[i].disabled == false ) {
            inputs[i].checked = newValue;
        }
    }
}

// --><!]]>
