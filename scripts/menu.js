// **************************************************
// Tabbed submenu
// **************************************************
function displayAppropriatePane(contentBox, button) {
    updateContentDisplay('submenuContentBox', 'none');
    Ext.getDom(contentBox).style.display = '';
    // add some styling to the button, if one was passed
    if (button != null && Ext.getDom(button)) {
        Ext.getDom(button).className = 'sMButton sMButtonHover';
        var buttonSpans = Ext.getDom(button).getElementsByTagName('span');
        for ( var i = 0; i < buttonSpans.length; i++) {
            buttonSpans[i].className = 'sMText sMTextHover';
        }
    }
}

function subMouseOver(element) {
    if (Ext.getDom(element).className == 'sMButton')
        Ext.getDom(element).className = 'sMButtonHover';
    if (Ext.getDom(element).className == 'sMText')
        Ext.getDom(element).className = 'sMTextHover';
}

function subMouseOut(element) {
    if (Ext.getDom(element).className == 'sMButtonHover')
        Ext.getDom(element).className = 'sMButton';
    if (Ext.getDom(element).className == 'sMTextHover')
        Ext.getDom(element).className = 'sMText';
}

function refreshContentDisplay(contentBox) {
    var i, menuContentBoxes = Ext.DomQuery.select("[class*=submenuContentBox]");
    for (i = 0; i < menuContentBoxes.length; i++) {
        menuContentBoxes[i].style.display = 'none';
    }
    Ext.getDom(contentBox).style.display = '';
}

function updateContentDisplay(className, display) {
    var menuContentBoxes = Ext.DomQuery.select("[class*=" + className + "]");
    var buttons;
    var buttonsA;
    var i;

    for (i = 0; i < menuContentBoxes.length; i++) {
        menuContentBoxes[i].style.display = display;
    }

    // Turn off the other buttons
    if (Ext.getDom('submenu-tabs')) {
        buttons = Ext.DomQuery.select('li', Ext.getDom('submenu-tabs'));
        for (i = 0; i < buttons.length; i++) {
            buttons[i].className = 'sMButton';
        }

        buttonsA = Ext.getDom('submenu-tabs').getElementsByTagName('span');
        for (i = 0; i < buttonsA.length; i++) {
            buttonsA[i].className = 'sMText';
        }
    }
}
