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
        type: 'MESSAGE', // "MESSAGE" || "POPUP"
        hideOnClick: true,
        title: false,
        width: 410,
        height: 'auto',
        bodyStyle: '',
        closeButton: false, // AntanubiS - 'X' close button in the caption.
        fullPageLink: '', // If is set - 'box'-like button in the caption.
        returnHidden: true, // AntanubiS - When hide - return previously hidden box.
        closeEsc: true,
        onShow: false,
        onHide: false,
        onLoadError: false,
        onLoad:false
    };

    options = extend(defaults, options);

    var buttonsCount = 0,
        boxContainer,
        boxLayout,
        boxTitle,
        boxBody,
        boxControls,
        boxCloseButton,
        boxFullPageLink,
        guid = (++_message_box_guid),
        isVisible = false,
        hiddenBox;



    var x_button = options.closeButton ? '<div class="box_x_button"></div>' : '';
    var full_page_button = options.fullPageLink ? '<a onfocus="this.blur()" class="box_full_page_link" href="' + options.fullPageLink + '"></a>' : '';

    boxContainer = ce('div', {
        className: 'popup_box_container',
        innerHTML: '<div class="box_layout"><div class="box_title_wrap">' + x_button + full_page_button + '<div class="box_title"></div></div><div class="box_body box_progress" style="' + options.bodyStyle + '"></div><div class="box_controls_wrap"><div class="box_controls"></div></div></div>'
    }, {
        display: 'none'
    });
    boxLayout = geByClass1('box_layout', boxContainer);
    boxTitle = geByClass1('box_title', boxContainer);
    boxBody = geByClass1('box_body', boxContainer);
    boxControls = geByClass1('box_controls', boxContainer);
    boxCloseButton = options.closeButton ? geByClass1('box_x_button', boxContainer) : false;
    boxFullPageLink = options.fullPageLink ? geByClass1('box_full_page_link', boxContainer) : false;

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
        BGLayer();
        bodyNode.appendChild(boxContainer);
        refreshBox();
        boxRefreshCoords(boxContainer, true);
    });

    function addButton(options) {
        buttonsCount++;
        options = options || {};
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
        boxControls.appendChild(buttonWrap);
        createButton(buttonWrap.firstChild, options.onClick);
        return buttonWrap.firstChild;
    }

    function addControlsText(text) {
        var textWrap = ce('div', {
            className: 'controls_wrap',
            innerHTML: text
        });
        boxControls.appendChild(textWrap);
        return textWrap;
    }

    function removeButtons() {
        var buttons = [];
        buttonsCount = 0;
        each(boxControls.childNodes, function (i, x) {
            if (x) {
                removeEvent(x);
                buttons.push(x);
            }
        });
        each(buttons, function () {
            boxControls.removeChild(this)
        });
    }
    // Refresh box properties
    function refreshBox() {
        boxTitle.innerHTML = options.title;
        boxContainer.style.width = typeof (options.width) == 'string' ? options.width : options.width + 'px';
        boxContainer.style.height = typeof (options.height) == 'string' ? options.height : options.height + 'px';
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
        boxBody.style.maxHeight = windowHeight() - 200 + 'px';
        show(boxContainer);
        boxRefreshCoords(boxContainer, true);
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
        if (options.onShow) options.onShow();
    }

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
        };
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
    };

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
        boxRefreshCoords(boxContainer, true);
        if (isFunction(options.onLoadError)) options.onLoadError(text);
    }
    var retBox = {
        guid: guid,
        show: function (speed) {
            showBox(speed);
            return this;
        },
        hide: function (speed) {
            hideBox(speed);
            return this;
        },
        isVisible: function () {
            return isVisible;
        },
        content: function (html) {
            boxBody.innerHTML = html;
            removeClass(boxBody, 'box_progress');
            boxRefreshCoords(boxContainer, true);
            return this;
        },
        loadContent: function (url, params, evaluate, loader_style, noloader) {
            var st = loader_style ? loader_style : '';
            if (!noloader) boxBody.innerHTML = '<div class="box_loader" style="' + st + '"></div>';
            params = params || {};
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
                    boxRefreshCoords(boxContainer, true);
                    if (isFunction(options.onLoad)) options.onLoad(responseText);
                },
                onFail: function (ajaxObj, responseText) {
                    onLoadError('Request error occured.');
                }
            });
            return this;
        },
        addButton: function (options) {
            return addButton(options);
        },
        addControlsText: function (text) {
            return addControlsText(text);
        },
        removeButtons: function (options) {
            removeButtons();
            return this;
        },
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
            boxRefreshCoords(boxContainer, true);
            return this;
        },
        refreshCoord: function(){
            boxRefreshCoords(boxContainer, true);
        },
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
}

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
        aBox.addButton({label: options.no || getLang('box_no'), style: 'button_no', onClick: aBox.hide});
        aBox.addButton({label: options.yes || getLang('box_yes'),onClick: function () {
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

function ConfirmBox(title, text, callback, options) {
    options = options || {};
    options = extend({boxType: 'CONFIRM'}, options);
    return AlertBox(title, text, callback, options);
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

function showDoneBox(msg, opts) {
    opts = opts || {};
    var l = (opts.w || 200) + 20;
    var style = opts.w ? opts.w : l;
    var resEl = ce('div', {
        className: 'top_result_baloon_wrap',
        innerHTML: '<div class="top_result_baloon" style="width:'+style+'px">' + msg + '</div>'
    });
    bodyNode.appendChild(resEl);
    boxRefreshCoords(resEl, true);
    var out = opts.out || 2000;
    var _fadeOut = function() {
        setTimeout(function() {
            if (opts.permit && !opts.permit()) {
                _fadeOut();
                return;
            }
            fadeOut(resEl.firstChild, 500, function() {
                re(resEl);
                if (opts.callback) {
                    opts.callback();
                }
            });
        }, out);
    };
    _fadeOut();
}