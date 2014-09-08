if(!window.jt) jt = {};
jt['boxes2'] = '1.0.0';

box_cancel = 'Cancel';
box_close = 'Close';
box_loading = 'Loading...';
box_no = 'No';
box_restore = 'Restore';
box_save = 'Save';
box_send = 'Send';
box_yes = 'Yes';

createUiClass('MessageBox', {
    defaultOptions: {
        type: 'MESSAGE',        // "MESSAGE" || "POPUP"
        hideOnOutClick: false,
        title: false,
        width: 410,
        dark: false,
        height: 'auto',
        bodyStyle: '',
        closeButton: false,     // AntanubiS - 'X' close button in the caption.
        fullPageLink: '',       // If is set - 'box'-like button in the caption.
        returnHidden: true,     // AntanubiS - When hide - return previously hidden box.
        closeEsc: true,
        onShow: function(){},
        onHide: function(){},
        onLoadError: function(){},
        onLoad: false
    },
    beforeInit: function(){
        if(!window._message_boxes){
            window._message_box_guid = 0;
            window._message_boxes = [];
            window._message_box_shown = 0;
            window._doc_block_timeout = null;
            window._doc_blocked = false;
        }
        this.guid = (++_message_box_guid);
    },
    bgLayer: function(){
        if (!ge('popupTransparentBG')) {
            window.transparentBG = ce('div', {
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
                bodyNode.appendChild(transparentBG);
            });
        }
    },
    initOptions: function(options){
        this.options = extend({}, this.defaultOptions, options);
        this.options.type = this.options.type == 'POPUP' ? 'POPUP' : 'MESSAGE';
    },
    init: function(options){
        this.buttonsCount = 0;
        this.boxContainer = null;
        this.boxLayout = null;
        this.boxTitle = null;
        this.boxBody = null;
        this.boxControls = null;
        this.closeButton = null;
        this.fullPageLink = null;
        this.isVisible = false;
        this.hiddenBox = null;
        this.closeButton = null;
        this.fullPageLink = null;
        this.bgLayer();
    },
    fadeToColor: function(color){
        return function () {
            animate(this, {
                backgroundColor: color
            }, 200);
        }
    },
    setCloseButton: function(){
        if(!this.boxContainer || this.closeButton) return false;
        var self = this;
        this.closeButton = ce('div', {className:'box_x_button'});
        if(this.fullPageLink){
            this.boxTitle.parentNode.insertBefore(this.closeButton, this.fullPageLink);
        } else {
            this.boxTitle.parentNode.insertBefore(this.closeButton, this.boxTitle);
        }
        addEvent(this.closeButton, 'mouseover', this.fadeToColor('#FFFFFF'));
        addEvent(this.closeButton, 'mouseout', this.fadeToColor('#60B0CF'));
        addEvent(this.closeButton, 'click', self.hide);
        return true;
    },
    setFullPageLink: function(){
        if(!this.boxContainer || this.options.fullPageLink == '') return false;
        if(this.fullPageLink){
            this.fullPageLink.href = this.options.fullPageLink;
            return true;
        }
        this.fullPageLink = ce('a', {className:'box_full_page_link', href:this.options.fullPageLink});
        this.boxTitle.parentNode.insertBefore(this.fullPageLink, this.boxTitle);
        addEvent(this.fullPageLink, 'mouseover', this.fadeToColor('#FFFFFF'));
        addEvent(this.fullPageLink, 'mouseout', this.fadeToColor('#60B0CF'));
        return true;
    },
    initDOM: function(options){
        var opt = this.options;
        this.boxContainer = ce('div', {
            className: 'popup_box_container',
            innerHTML: '' +
                '<div class="box_layout">' +
                    '<div class="box_title_wrap cf">' +
                        '<div class="box_title"></div>' +
                    '</div>' +
                    '<div class="box_body box_progress" style="' + opt.bodyStyle + '"></div>' +
                    '<div class="box_controls_wrap">' +
                        '<div class="box_controls cf"></div>' +
                    '</div>' +
                '</div>'
        }, {
            display: 'none'
        });

        this.boxLayout = geByClass1('box_layout', this.boxContainer);
        this.boxTitle = geByClass1('box_title', this.boxContainer);
        this.boxBody = geByClass1('box_body', this.boxContainer);
        this.boxControls = geByClass1('box_controls', this.boxContainer);

        bodyNode.appendChild(this.boxContainer);

        if(opt.type == 'MESSAGE'){
            if(opt.closeButton){
                this.setCloseButton();
            }
            if(opt.fullPageLink){
                this.setFullPageLink();
            }
        }
        this.refreshBox();
    },
    refreshBox: function(){
        var self = this,
            opt = this.options,
            hide = function(){self.hide();},
            closeEsc = function(e){if (e.keyCode == KEY.ESC) self.hide();};
        this.boxTitle.innerHTML = opt.title;
        this.boxContainer.style.width = typeof (opt.width) == 'string' ? opt.width : opt.width + 'px';
        this.boxContainer.style.height = typeof (opt.height) == 'string' ? opt.height : opt.height + 'px';
        removeClass(this.boxContainer, 'box_no_controls');
        removeClass(this.boxContainer, 'message_box');
        removeEvent(transparentBG, 'click', hide);
        removeEvent(document, 'keydown', closeEsc);
        if (opt.hideOnOutClick) {
            addEvent(transparentBG, 'click', hide);
        }
        if (opt.closeEsc) {
            addEvent(document, 'keydown', closeEsc);
        }
        addClass(this.boxContainer, opt.type == 'POPUP' ? 'box_no_controls' : 'message_box');
    },
    removeButtons: function(){
        var buttons = [], self = this;
        this.buttonsCount = 0;
        each(this.boxControls.childNodes, function (i, x) {
            if (x) {
                removeEvent(x);
                buttons.push(x);
            }
        });
        each(buttons, function () {
            self.boxControls.removeChild(this);
        });
        return this;
    },
    addButton: function(options){
        this.buttonsCount++;
        options = options || {};
        options = extend({
            label: 'Button' + this.buttonsCount,
            style: 'button_blue'
        }, options);
        if (options.style == 'button_no') options.style = 'button_gray';
        if (options.style == 'button_yes') options.style = 'button_blue';
        var buttonWrap = ce('div', {
            className: options.style + ' ' + (options.left ? 'fl' : 'fr'),
            innerHTML: '<button id="button' + this.guid + '_' + this.buttonsCount + '">' + options.label + '</button>'
        });
        this.boxControls.appendChild(buttonWrap);
        createButton(buttonWrap.firstChild, options.onClick);
        return buttonWrap.firstChild;
    },
    addControlsText: function(text){
        text = text || '';
        var textWrap = ce('div', {
            className: 'controls_wrap',
            innerHTML: text
        });
        this.boxControls.appendChild(textWrap);
        return textWrap;
    },
    content: function(html){
        html = html || '';
        this.boxBody.innerHTML = html;
        removeClass(this.boxBody, 'box_progress');
        this.refreshCoord();
        return this;
    },
    loadContent: function (url, params, evaluate, loader_style, noloader) {
        var st = loader_style ? loader_style : '';
        if (!noloader) this.boxBody.innerHTML = '<div class="box_loader" style="' + st + '"></div>';
        params = params || {};
        var self = this;
        Ajax.Send(url, params, {
            onSuccess: function (ajaxObj, responseText) {
                if (evaluate) {
                    try {
                        var result = eval('(' + responseText + ')');
                        self.boxBody.innerHTML = result.html ? result.html : '';
                        if (result.script) window.execScript ? window.execScript(result.script) : eval.call(window, result.script);
                    } catch (e) {
                        return self.onLoadError(responseText);
                    }
                } else {
                    self.boxBody.innerHTML = responseText;
                }
                self.refreshCoord();
                removeClass(self.boxBody, 'box_progress');
                if (isFunction(self.options.onLoad)) self.options.onLoad(responseText);
            },

            onFail: function (ajaxObj, responseText) {
                self.onLoadError('Request error occured.');
            }
        });
        return this;
    },
    onLoadError: function(text){
        this.boxBody.innerHTML = 'Error: ' + text;
        this.removeButtons();
        this.addButton({
            label: getLang('box_close'),
            onClick: this.hide
        });
        removeClass(this.boxBody, 'box_progress');
        this.refreshCoord();
        if (isFunction(this.options.onLoadError)) this.options.onLoadError(text);
    },
    show: function(){
        if (this.isVisible) return;
        this.isVisible = true;
        this.hiddenBox = 0;
        if (_message_box_shown && _message_boxes[_message_box_shown].isVisible) {
            var box = _message_boxes[_message_box_shown];
            if (this.options.returnHidden) {
                this.hiddenBox = _message_box_shown;
                box.hideContainer();
            } else {
                box.hide();
            }
        }
        this.boxBody.style.maxHeight = windowHeight() - 200 +(this.options.type=='POPUP'?60:0) + 'px';
        show(this.boxContainer);
        this.refreshCoord();
        if (!_message_box_shown) {
            //transparentBG.style.height = getSize(document)[1] + 'px';
            transparentBG.className = this.options.dark ? 'popup_transparent_bg_dark' : 'popup_transparent_bg';
            show(transparentBG);
            clearTimeout(_doc_block_timeout);
            if (!_doc_blocked) {
                _doc_blocked = true;
            }
        }
        _message_box_shown = this.guid;
        if (this.options.onShow) this.options.onShow();
        return this;
    },
    hide: function(){
        if (!this.isVisible) return;
        this.isVisible = false;
        hide(this.boxContainer);
        var showHidden = false;
        if (this.options.returnHidden && this.hiddenBox) {
            _message_boxes[this.hiddenBox].showContainer();
            _message_box_shown = this.hiddenBox;
            showHidden = true;
        }
        if (!showHidden) {
            _message_box_shown = 0;
            hide(transparentBG);
            clearTimeout(_doc_block_timeout);
            if (_doc_blocked) {
                _doc_block_timeout = setTimeout(function () {
                    _doc_blocked = false;
                }, 50);
            }
        }
        if (this.options.onHide) this.options.onHide();
        return this;
    },
    setOptions: function(newOptions){
        this.options = extend(this.options, newOptions);
        var self = this;
        if ("bodyStyle" in newOptions) {
            var items = this.options.bodyStyle.split(';');
            for (var i = 0; i < items.length; ++i) {
                var name_value = items[i].split(':');
                if (name_value.length > 1 && name_value[0].length) {
                    self.boxBody.style[trim(name_value[0])] = trim(name_value[1]);
                    if (self.boxBody.style.setProperty) {
                        self.boxBody.style.setProperty(trim(name_value[0]), trim(name_value[1]), '');
                    }
                }
            }
        }
        if (this.options.closeButton) this.setCloseButton();
        if (this.options.fullPageLink) this.setFullPageLink();
        this.refreshBox();
        this.refreshCoord();
        return this;
    },
    hideContainer: function () {
        this.isVisible = false;
        hide(this.boxContainer);
    },
    showContainer: function () {
        this.isVisible = true;
        show(this.boxContainer);
    },
    refreshCoord: function () {
        var wsize = windowSize(),
            top = scrollGetY(),
            containerSize = getSize(this.boxContainer);
        this.boxContainer.style.top = Math.max(0, top + (wsize[1] - containerSize[1]) / 3) + 'px';
        this.boxContainer.style.left = Math.max(0, (wsize[0] - containerSize[0]) / 2) + 'px';
    },
    afterInit: function(){
        _message_boxes[this.guid] = this;
    }
});
function getShownBox() {
    try{
        var b = _message_boxes[_message_box_shown];
        return (b && b.isVisible) ? b : false;
    } catch(e) {
        return false;
    }
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
            onClick: function(){
                aBox.hide();
            }
        });
        aBox.addButton({
            label: options.yes || getLang('box_yes'),
            onClick: function () {
                if (isFunction(callback) && callback() === false) return;
                aBox.hide();
            }
        });
    } else {
        aBox.addButton({
            label: options.no || getLang('box_close'),
            onClick: function(){
                aBox.hide();
                if(isFunction(callback))callback();
            }
        });
    }
    return aBox.content(text).show();
}

function ConfirmBox(title, text, callback, options) {
    options = options || {};
    options = extend({
        boxType: 'CONFIRM'
    }, options);
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
            onClick: function(){winBoxes[name].hide();}
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
        innerHTML: '<div class="top_result_baloon" style="width:' + style + 'px">' + msg + '</div>'
    });
    bodyNode.appendChild(resEl);
    boxRefreshCoords(resEl, true);
    var out = opts.out || 2000;
    var _fadeOut = function () {
        setTimeout(function () {
            if (opts.permit && !opts.permit()) {
                _fadeOut();
                return;
            }
            fadeOut(resEl.firstChild, 500, function () {
                re(resEl);
                if (opts.callback) {
                    opts.callback();
                }
            });
        }, out);
    };
    _fadeOut();
}