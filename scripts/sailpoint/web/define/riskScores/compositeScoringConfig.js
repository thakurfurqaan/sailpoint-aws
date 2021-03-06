/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/**
 * This page contains the logic that controls the sliders on the compositeScoringInclude.xhtml page
 */
var sliderData;
var range = 100;
var sliderGroup;
var cachedInputValues = [];
var imageFormat = '.png';

Ext.ns('SailPoint', 'SailPoint.Risk');

var slideInConfig = {
        easing: 'easeIn',
        duration: 250
    },
    slideOutConfig = {
        easing: 'easeOut',
        duration: 250,
        useDisplay: true
    };

SailPoint.Risk.isCompositePanelLoaded = false;

SailPoint.Risk.initCompositePanel = function() {
    if (!SailPoint.Risk.isCompositePanelLoaded) {
        var i;
        var sliders = [];

        for (i = 0; i < sliderData.length; ++i) {
            if (sliderData[i] && sliderData[i] != null) {
                sliders.push(createCompositeSlider(sliderData[i].id, sliderData[i].weight));
            }
        }
        sliderGroup = new Control.SliderGroup(sliders, range);
        SailPoint.Risk.isCompositePanelLoaded = true;
    }
};

// This function fetches the input for the specified category ID
function getInputFor(categoryId) {
    var inputs,
        targetDiv = Ext.getDom('weightInput' + categoryId);

    if (targetDiv) {
        inputs = targetDiv.getElementsByTagName('input');
    } else {
        inputs = null;
    }

    if (inputs != null) {
        return inputs.item(0);
    } else {
        return null;
    }
}
  
// This function caches all the input values so that we can always back
// a change out if it proves invalid
function cacheInputs() {
    var i = 0;
    
    currentInput = getInputFor(i);
    
    while (currentInput != null) {
        cachedInputValues[i] = currentInput.value;
        i++;
        currentInput = getInputFor(i);
    }
}

// This was a convenience function that creates a slider with the logic required
// to function as part of a sliderGroup -- leaving the comments in case we ever need
// another set of slider gropus
//    function createCompositeSlider(categoryId, categoryWeight) {
//        var newSlider = 
//            new Control.Slider('handle' + categoryId, 'slider' + categoryId,
//                {
//                    range: $R(0, range),
//                    sliderValue: categoryWeight,
//                    axis: 'horizontal',
//                    onSlide: function(v) {
//                      getInputFor(categoryId).value = Math.round(v);
//                    },
//            
//                    onChange: function(v) { 
//                        var currentSlider = sliders[categoryId];
//             
//                        delta = Math.round(v - (cachedInputValues[categoryId] * 1.0));
//                
//                        if (sliderGroup.updateInProgress || 
//                            currentSlider.value == cachedInputValues[categoryId]) {
//                            // No adjustments needed in this case.  Just set the value
//                            newValue = Math.round(v);
//                            getInputFor(categoryId).value = newValue;
//                            cachedInputValues[categoryId] = newValue;                      
//                        } else {
//                            var delta = Math.round(v - (cachedInputValues[categoryId] * 1.0));
//                            newDelta = sliderGroup.adjustValuesForSlider(currentSlider, delta);
//                            v += (newDelta - delta);
//                
//                            // Need to adjust and set the value
//                            newValue = Math.round(v);
//                            getInputFor(categoryId).value = newValue;
//                            cachedInputValues[categoryId] = newValue;
//                            currentSlider.setValue(newValue);
//                       
//                            updateCompositeScoring();
//                        }                                                                    
//                    }
//                }
//            );
//
//        newSlider.id = categoryId;
//        return newSlider;
//    }

// This is a convenience function that creates a composite slider 
function createCompositeSlider(categoryId, categoryWeight) {

    var extSlider = Ext.create('Ext.slider.Single', {
        id: categoryId,
        width: 300,
        value: categoryWeight,
        increment: 1,
        minValue: 0,
        maxValue: 100,
        useTips: false,
        animate: false,
        renderTo: 'handle' + categoryId,
        listeners: {
            change: {
                fn: function(slider, newVal, thumb, eOpts) {
                    // No adjustments needed in this case.  Just set the value
                    var newValue = Math.round(newVal);
                    var inputElement = getInputFor(categoryId);
                    inputElement.value = newValue;
                    cachedInputValues[categoryId] = newValue;

                    var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
                    var indicator = Ext.getDom('weightIndicatorFor' + categoryId);
                    indicator.src = colorStore.getImageUrlForScore(inputElement.value * 10);
                    isPageDirty = true;
                }
            }
        }
    });

    var inputElement = getInputFor(categoryId);
    var colorStore = Ext.StoreMgr.lookup('neutralColorStore');
    var indicator = Ext.getDom('weightIndicatorFor' + categoryId);
    indicator.src = colorStore.getImageUrlForScore(inputElement.value * 10);
    
    return extSlider;
}

// This function updates the slider when a numerical input is manually entered
function updateSlider(sliderId, value, keyupEvent) {    
    if (sliderGroup) {
        sliderGroup.getSlider(sliderId).setValue(value * 1.0);
    }
}

// This function toggles expansion for the icon that was pressed.
// If no contentDiv is specified, this function will make the following assumptions to
// guess at a proper contentDiv:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function toggleExpansion(icon, contentDiv) {
    icon = Ext.getDom(icon);
    var iconId = icon.id;

        if (!contentDiv) {
            var prefixEnd = iconId.lastIndexOf('expander');
            var prefix = iconId.substring(0, prefixEnd);
            contentDiv = Ext.getDom(prefix + 'content');
        }
        
        if (icon.isMaximized) {
            icon.isMaximized = false;
            icon.src = CONTEXT_PATH + '/images/icons/plus.png';
            Ext.get(contentDiv).slideOut('t', slideOutConfig);
        }
        else {
            if (icon.isMaximized == false) {
                icon.isMaximized = true;
                icon.src = CONTEXT_PATH + '/images/icons/minus.png';
                displaySliderDivs(contentDiv.id);
                Ext.get(contentDiv).slideIn('t', slideInConfig);
            }
            else {
                // Not initialized yet
                icon.isMaximized = false;
                icon.src = CONTEXT_PATH + '/images/icons/plus.png';
                Ext.get(contentDiv).slideOut('t', slideOutConfig);
            }
        }
}

// This function collapses all sub tables within the specified table.
// It makes the following assumptions to determine the icon that needs 
// to be changed and to distinguish between sliders and content panels:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function contractContents(contentTable) {

        var contents = contentTable.getElementsByTagName('div');
        
        for (var i = 0; i < contents.length; ++i) {
            var contentId = contents[i].id;
            var prefixEnd = contentId.lastIndexOf('content');
            
            if (prefixEnd != -1) {
                var prefix = contentId.substring(0, prefixEnd);
                var icon = Ext.getDom(prefix + 'expander');

                if (icon.isMaximized != false) {
                    hideChildren(contents[i]);
                    Ext.get(contents[i]).slideOut('t', slideOutConfig);
                    icon.isMaximized = false;
                    icon.src = CONTEXT_PATH + '/images/icons/plus.png';
                }
            }
        }
}

function hideChildren(parentDiv) {
    var children = parentDiv.getElementsByTagName('div');

    for (var i = 0; i < children.length; ++i) {
        children[i].style['display'] = 'none';
    }
}

// This function expands all sub tables within the specified table.
// It makes the following assumptions to determine the icon that needs 
// to be changed and to distinguish between sliders and content panels:
// 1. The icon's id ends with 'expander'
// 2. The content div's id is identical to the icon's id, with the exception that the word
//    'expander' is replaced with 'content'
function expandContents(contentTable) {

        var contents = contentTable.getElementsByTagName('div');

        for (var i = 0; i < contents.length; ++i) {
            var contentId = contents[i].id;
            var prefixEnd = contentId.lastIndexOf('content');
            
            if (prefixEnd != -1) {
                var prefix = contentId.substring(0, prefixEnd);
                var icon = Ext.getDom(prefix + 'expander');

                if (icon.isMaximized == false) {
                    displaySliderDivs(contentTable.id);
                    Ext.get(contents[i]).slideIn('t', slideInConfig);
                    icon.isMaximized = true;
                    icon.src = CONTEXT_PATH + '/images/icons/minus.png';
                }
            }
        }
}

function hideSliderDivs(parentDiv) {
    var sliderDivs = parentDiv.getElementsByTagName('div');
    
    for (var i = 0; i < sliderDivs.length; ++i) {
        sliderDivs[i].style['display'] = 'none';
    }
}

function displaySliderDivs(parentDivId) {
    var sliderDivs = Ext.getDom(parentDivId).getElementsByTagName('div');

    for (var i = 0; i < sliderDivs.length; ++i) {
        sliderDivs[i].style['display'] = '';
    }
}
