/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/** This script performs any important appPage.xhtml related functions at the end of the page **/

Ext.onReady(function() {
  //The following script builds tooltips for pages that include the "?" help image
  //on their page.  Script looks for images with "imgHlp" in their id and
  //takes their alt text to build a tooltip.
  if(typeof(buildTooltips) != "undefined")
    buildTooltips();

  // Disable prototype show/hide methods during duration of bootstrap show/hide events so the bootstrap
  // show/hide events don't trigger the method calls.
  function disablePrototypeJS(method, pluginsToDisable) {
      var handler = function (event) {
        event.target[method] = undefined;
      };
      pluginsToDisable.forEach(function (plugin) {
          jQuery(window).on(method + '.bs.' + plugin, handler);
      });
  }

  var pluginsToDisable = ['collapse', 'dropdown', 'modal', 'tooltip', 'popover'];

  disablePrototypeJS('show', pluginsToDisable);
  disablePrototypeJS('hide', pluginsToDisable);

  // On dropdown open
  jQuery(document).on('shown.bs.dropdown', function(event) {
    var dropdown = jQuery(event.target);
    // Set aria-expanded to true
    dropdown.find('.dropdown-menu').attr('aria-expanded', true);
  });

  // On dropdown close
  jQuery(document).on('hidden.bs.dropdown', function(event) {
    var dropdown = jQuery(event.target);
    // Set aria-expanded to false
    dropdown.find('.dropdown-menu').attr('aria-expanded', false);
  });

  // allow space bar to activate menu link
  jQuery('a.menuitem').keydown(function(e) {
    if (e.keyCode === 32) {
      this.click();
      e.stopPropagation();
      return false;
    }
  });
});
