var _message_box_guid = 0,
    _message_boxes = [],
    _message_box_shown = 0,
    _doc_block_timeout,
    _doc_blocked = false;

box_cancel = 'Cancel';
box_close = 'Close';
box_loading = 'Loading...';
box_no = 'No';
box_restore = 'Restore';
box_save = 'Save';
box_send = 'Send';
box_yes = 'Yes';

function MessageBox(options) {
    var defaults = {
        type: "MESSAGE", // "MESSAGE" || "POPUP"
        hideOnClick: true,
        title: "Alert",
        width: "410px",
        height: "auto",
        bodyStyle: "",
        closeButton: false, // AntanubiS - 'X' close button in the caption.
        fullPageLink: '', // If is set - 'box'-like button in the caption.
        progress: false, // AntanubiS - Progress bar.
        returnHidden: true, // AntanubiS - When hide - return previously hidden box.
        closeEsc: true
    };
    options = extend(defaults, options);

    var buttonsCount = 0,
        body = document.getElementsByTagName('body')[0],
        transparentBG, boxContainer, boxBG, boxContainer, boxLayout, boxTitle, boxBody, boxControls, boxProgress, buttonYes, buttonNo, boxCloseButton, boxFullPageLink,
        guid = (++_message_box_guid),
        isVisible = false,
        hiddenBox;
    transparentBG = ge('popupTransparentBG');
    if (!transparentBG) {
        transparentBG = ce('div', {
            id: 'popupTransparentBG',
            className: 'popup_transparent_bg'
        }, {
            display: 'none',
            height: getSize(document)[1]
        });
        addEvent(window, 'resize', function () {
            transparentBG.style.height = getSize(document)[1] + 'px';
        });
        onDomReady(function () {
            body.appendChild(transparentBG);
        });
    }
    var x_button = options.closeButton ? '<div class="box_x_button"></div>' : '';
    var full_page_button = options.fullPageLink ? '<a onfocus="this.blur()" class="box_full_page_link" href="' + options.fullPageLink + '"></a>' : '';
    boxContainer = ce('div', {
        className: 'popup_box_container',
        innerHTML: '<div class="box_layout"><div class="box_title_wrap">' + x_button + full_page_button + '<div class="box_title"></div></div><div class="box_body load" style="' + options.bodyStyle + '"></div><div class="box_controls_wrap"><div class="box_controls"></div></div></div>'
    }, {
        display: 'none'
    });
    boxLayout = geByClass('box_layout', boxContainer)[0];
    boxTitle = geByClass('box_title', boxContainer)[0];
    boxBody = geByClass('box_body', boxContainer)[0];
    boxControls = geByClass('box_controls', boxContainer)[0];
    boxCloseButton = options.closeButton ? geByClass('box_x_button', boxContainer)[0] : false;
    boxFullPageLink = options.fullPageLink ? geByClass('box_full_page_link', boxContainer)[0] : false;
    if (options.progress) {
        boxControls.innerHTML = '<img src="' + base_domain + 'images/upload' + (window.devicePixelRatio >= 2 ? '_2x' : '') + '.gif" width="32" height="8" id="' + options.progress + '" style="display: none" />';
        boxProgress = boxControls.firstChild;
    } else {
        boxProgress = null;
    }
    if (options.closeEsc) {
        addEvent(document, 'keydown', function (e) {
            if (e.keyCode == 27) {
                hideBox();
            }
        });
    }
    if (!_message_boxes.length) {
        addEvent(document, 'block unblock', function (e) {
            //  toggleFlash(e.type == 'unblock');
        });
    }
    onDomReady(function () {
        body.appendChild(boxContainer);
        refreshBox();
        refreshCoords();
    });
    // Refresh box position
    function refreshCoords() {
        var height = window.innerHeight ? window.innerHeight : (document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.offsetHeight);
        containerSize = getSize(boxContainer);
        var scrollTop = Math.max(intval(window.pageYOffset), document.documentElement.scrollTop, body.scrollTop);
        if (!scrollTop && window.parent && window.parent != window && window._currentFocusEl) {
            var top = getXY(window._currentFocusEl)[1];
        } else {
            var top = Math.max(0, scrollTop + (height - containerSize[1]) / 3);
        }
        boxBody.style.maxHeight = height - 200 + 'px';
        boxContainer.style.top = top + 'px';
        boxContainer.style.marginLeft = -containerSize[0] / 2 + 'px';
    }
    // Add button
    function addButton(options) {
        buttonsCount++;
        if (typeof options != 'object') options = {};
        options = extend({
            label: 'Button' + buttonsCount,
            style: 'button_blue'
        }, options);
        if (options.style == 'button_no') options.style = 'button_gray';
        if (options.style == 'button_yes') options.style = 'button_blue';
        var buttonWrap = ce('div', {
            className: options.style + ' ' + (options.left ? 'fl_l' : 'fl_r'),
            innerHTML: '<button id="button' + guid + '_' + buttonsCount + '">' + options.label + '</button>'
        });
        if (boxProgress) {
            boxControls.insertBefore(buttonWrap, boxProgress);
        } else {
            boxControls.appendChild(buttonWrap);
        }
        createButton(buttonWrap.firstChild, options.onClick);
        return buttonWrap;
    }
    // Add custom controls text
    function addControlsText(text) {
        var textWrap = ce('div', {
            className: 'controls_wrap',
            innerHTML: text
        });
        boxControls.appendChild(textWrap);
        return textWrap;
    }
    // Remove buttons
    function removeButtons() {
        var buttons = [];
        buttonsCount = 0;
        each(boxControls.childNodes, function (i, x) {
            if (x && (!boxProgress || x != boxProgress)) {
                removeEvent(x);
                buttons.push(x);
            }
        });
        each(buttons, function () {
            boxControls.removeChild(this)
        });
        // boxControls.innerHTML = '';
    }
    // Refresh box properties
    function refreshBox() {
        // Set title
        boxTitle.innerHTML = options.title;
        // Set box dimensions
        boxContainer.style.width = typeof (options.width) == 'string' ? options.width : options.width + 'px';
        boxContainer.style.height = typeof (options.height) == 'string' ? options.height : options.height + 'px';
        // Switch box type
        removeClass(boxContainer, 'box_no_controls');
        removeClass(boxContainer, 'message_box');
        removeEvent(boxContainer, 'click');
        if (options.hideOnClick && options.type == 'POPUP') {
            addEvent(boxContainer, 'click', function () {
                hideBox();
            });
        }
        switch (options.type) {
            case 'POPUP':
                addClass(boxContainer, 'box_no_controls');
                if (options.hideOnClick) {
                    addEvent(transparentBG, 'click', function () {
                        hideBox();
                    });
                }
                break;
            case 'MESSAGE':
                if (options.hideOnOutClick) {
                    addEvent(transparentBG, 'click', function () {
                        hideBox();
                    });
                } else {
                    removeEvent(transparentBG, 'click');
                }
                addClass(boxContainer, 'message_box');
                break;
        }
    }
    // Show box
    function showBox() {
        if (isVisible) return;
        isVisible = true;
        hiddenBox = 0;
        if (_message_box_shown && _message_boxes[_message_box_shown].isVisible) {
            var box = _message_boxes[_message_box_shown];
            if (options.returnHidden) {
                hiddenBox = _message_box_shown;
                box.hideContainer();
            } else {
                box.hide();
            }
        }
        //  fadeIn(boxContainer, 200); // Video wall posting fails with fadeIn
        show(boxContainer);
        refreshCoords();
        if (!_message_box_shown) {
            transparentBG.style.height = getSize(document)[1] + 'px';
            show(transparentBG);
            clearTimeout(_doc_block_timeout);
            if (!_doc_blocked) {
                _doc_blocked = true;
                triggerEvent(document, 'block');
            }
        }
        _message_box_shown = guid;
        if (options.onShow)
            options.onShow();
    }
    // Hide box
    function hideBox(speed) {
        if (!isVisible) return;
        if (options.onHideAttempt && !options.onHideAttempt()) return;
        isVisible = false;
        var onHide = function () {
            hide(boxContainer);
            var showHidden = false;
            if (options.returnHidden && hiddenBox) {
                _message_boxes[hiddenBox].showContainer();
                _message_box_shown = hiddenBox;
                showHidden = true;
            }
            if (!showHidden) {
                _message_box_shown = 0;
                hide(transparentBG);
                clearTimeout(_doc_block_timeout);
                if (_doc_blocked) {
                    _doc_block_timeout = setTimeout(function () {
                        _doc_blocked = false;
                        triggerEvent(document, 'unblock');
                    }, 50);
                }
            }
            if (options.onHide) options.onHide();
        }
        if (speed > 0)
            fadeOut(boxContainer, speed, onHide);
        else
            onHide();
    }
    var fadeToColor = function (color) {
        return function () {
            animate(this, {
                backgroundColor: color
            }, 200);
        }
    }
    if (boxCloseButton) {
        addEvent(boxCloseButton, 'mouseover', fadeToColor('#FFFFFF'));
        addEvent(boxCloseButton, 'mouseout', fadeToColor('#9DB7D4'));
        addEvent(boxCloseButton, 'click', hideBox);
    }
    if (boxFullPageLink) {
        addEvent(boxFullPageLink, 'mouseover', fadeToColor('#FFFFFF'));
        addEvent(boxFullPageLink, 'mouseout', fadeToColor('#9DB7D4'));
    }

    function onLoadError(text) {
        boxBody.innerHTML = 'Error: ' + text;
        removeButtons();
        addButton({
            label: getLang('box_close'),
            onClick: hideBox
        });
        refreshCoords();
        if (isFunction(options.onLoadError)) options.onLoadError(text);
    }
    var retBox = {
        guid: guid,
        // Show box
        show: function (speed) {
            showBox(speed);
            return this;
        },
        // Hide box
        hide: function (speed) {
            hideBox(speed);
            return this;
        },
        isVisible: function () {
            return isVisible;
        },
        // Insert html content into the box
        content: function (html) {
            boxBody.innerHTML = html;
            removeClass(boxBody, 'load');
            refreshCoords();
            return this;
        },
        // Load html content from URL
        loadContent: function (url, params, evaluate, loader_style, noloader) {
            // Show loader
            var st = loader_style ? loader_style : '';
            if (!noloader) boxBody.innerHTML = '<div class="box_loader" style="' + st + '"></div>';
            // Load remote html using get request
            if (typeof params != 'object') params = {};
            var self = this;
            Ajax.Send(url, params, {
                onSuccess: function (ajaxObj, responseText) {
                    if (evaluate) {
                        try {
                            var result = eval('(' + responseText + ')');
                            boxBody.innerHTML = result.html ? result.html : '';
                            if (result.script) window.execScript ? window.execScript(result.script) : eval.call(window, result.script);
                        } catch (e) {
                            return onLoadError(responseText);
                        }
                    } else {
                        boxBody.innerHTML = responseText;
                    }
                    refreshCoords();
                    if (isFunction(options.onLoad)) options.onLoad(responseText);
                },
                onFail: function (ajaxObj, responseText) {
                    onLoadError('Request error occured.');
                }
            });
            return this;
        },
        // Add button
        addButton: function (options) {
            var btn = addButton(options);
            return (options.returnBtn) ? btn : this;
        },
        // Add
        addControlsText: function (text) {
            var el = addControlsText(text);
            return (options.returnBtn) ? el : this;
        },
        // Remove buttons
        removeButtons: function (options) {
            removeButtons();
            return this;
        },
        // Update box options
        setOptions: function (newOptions) {
            options = extend(options, newOptions);
            if ("bodyStyle" in newOptions) {
                var items = options.bodyStyle.split(';');
                for (var i = 0; i < items.length; ++i) {
                    var name_value = items[i].split(':');
                    if (name_value.length > 1 && name_value[0].length) {
                        boxBody.style[trim(name_value[0])] = trim(name_value[1]);
                        if (boxBody.style.setProperty) {
                            boxBody.style.setProperty(trim(name_value[0]), trim(name_value[1]), '');
                        }
                    }
                }
            }
            if (options.fullPageLink && boxFullPageLink) {
                boxFullPageLink.href = options.fullPageLink;
            }
            refreshBox();
            refreshCoords();
            return this;
        },
        refreshCoord: refreshCoords,
        fixIE6: refreshBox,
        hideContainer: function () {
            isVisible = false;
            hide(boxContainer);
        },
        showContainer: function () {
            isVisible = true;
            show(boxContainer);
        },
        body: function () {
            return boxBody;
        }
    };
    _message_boxes[guid] = retBox;
    return retBox;
};

function getShownBox() {
    var b = _message_boxes[_message_box_shown];
    return (b && b.isVisible) ? b : false;
}
// Extends MessageBox
function AlertBox(title, text, callback, options) {
    var aBox = new MessageBox({
        title: title
    });
    if (typeof options == 'object') aBox.setOptions(options);
    else options = {};
    aBox.removeButtons();
    if (options.boxType == 'CONFIRM') {
        aBox.addButton({
            label: options.no || getLang('box_no'),
            style: 'button_no',
            onClick: aBox.hide
        }).addButton({
                label: options.yes || getLang('box_yes'),
                onClick: function () {
                    if (isFunction(callback) && callback() === false) return;
                    aBox.hide();
                }
            });
    } else {
        aBox.addButton({
            label: options.no || getLang('global-close'),
            onClick: isFunction(callback) ? function () {
                aBox.hide();
                callback();
            } : aBox.hide
        });
    }
    return aBox.content(text).show();
}

function showFastBox(o, c, yes, onYes, no, onNo) {
    return (new MessageBox(typeof (o) == 'string' ? {
        title: o
    } : o)).content(c).setButtons(yes, onYes, no, onNo).show();
}
var winBoxes = {};

function showBox(name, url, query, lnk, reload, params, files) {
    if (typeof lnk == 'object') {
        reload = lnk.reload;
        params = lnk.params;
        files = lnk.files;
        lnk = lnk.href;
    }
    if (lnk && window.event && (window.event.which == 2 || window.event.button == 1)) {
        return true;
    }
    params = extend({
        title: getLang('box_loading')
    }, params);
    if (!winBoxes[name]) {
        winBoxes[name] = new MessageBox(params);
        reload = true;
        if (files) {
            for (var i in files) {
                if (/\.css/i.test(files[i])) {
                    addCss(files[i]);
                } else if (/\.js/i.test(files[i])) {
                    attachScript('script' + i, files[i]);
                }
            }
        }
    } else if (reload) {
        winBoxes[name].setOptions(params);
    }
    if (reload) {
        winBoxes[name].removeButtons();
        winBoxes[name].addButton({
            label: getLang('box_close'),
            onClick: winBoxes[name].hide
        });
        winBoxes[name].loadContent(url, query, false);
    }
    winBoxes[name].show();
    return false;
}