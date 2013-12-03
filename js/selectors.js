function Dropdown(input, data, options) {
    if (!options) options = {};
    return new Selector(
        input,
        options.autocomplete ? data : [], extend({
            introText: '',
            multiselect: false,
            autocomplete: false,
            selectedItems: options.selectedItem
        }, options, {
            defaultItems: data
        }));
}

function Autocomplete(input, data, options) {
    return new Selector(input, data, options);
}
createChildClass('Selector', UiControl, {
    CSS: {},
    defaultOptions: {
        selectedItems: [],
        defaultItems: [],
        multiselect: true,
        autocomplete: true,
        dropdown: true,
        cacheLength: 100,
        showMax: 10,
        maxItems: 50,
        maxItemsShown: function (query_length) {
            if (query_length > 6) {
                return 500;
            } else if (query_length > 4) {
                return 200;
            } else if (query_length > 2) {
                return 150;
            } else {
                return 100;
            }
        },
        selectFirst: true,
        dividingLine: 'smart',
        enableCustom: false,
        valueForCustom: -1,
        width: 300,
        height: 250,
        progressBar: false,
        highlight: function (label, term) {
            label = term.indexOf(' ') == -1 ? label.split(' ') : [label];
            var tmp = '';
            var termRus = parseLatin(term);
            if (termRus != null) {
                term = term + '|' + termRus;
            }
            var re = new RegExp("(?![^&;]+;)(?!<[^<>]*)((\\(*)(" + term.replace('+', '\\+') + "))(?![^<>]*>)(?![^&;]+;)", "gi");
            for (var i in label) {
                tmp += (i > 0 ? ' ' : '') + label[i].replace(re, "$2<em>$3</em>");
            }
            return tmp;
        },
        placeholder: '',
        placeholderColor: '#afb8c2',
        introText: 'Начните вводить',
        noResult: 'Ничего не найденно',
        noImageSrc: '/images/question_s.gif',
        formatResult: function (data) {
            return data[1] + (typeof (data[2]) == 'string' ? ' <span>' + data[2] + '</span>' : '');
        },
        hrefPrefix: 'id'
    },
    controlName: 'Selector',
    // Standart object methods
    beforeInit: function (input) {
        if (input == null || input['autocomplete']) {
            try {
                console.error("Can't init ", input);
            } catch (e) {}
            return false;
        }
        this.guid = _ui.reg(this);
    },
    initOptions: function (input, data, options) {
        var opts = this.options = extend({}, this.defaultOptions, {
            resultField: input['name'] || 'selectedItems',
            customField: input['name'] ? (input['name'] + '_custom') : 'selectedItems_custom'
        }, this.prepareOptionsText(options || {}));
        // if highlight is set to false, replace it with a do-nothing function
        opts.highlight = opts.highlight || function (label) {
            return label;
        };
        // Get selected value
        if (!isArray(opts.selectedItems) && isEmpty(opts.selectedItems)) {
            opts.selectedItems = [];
        }
        if (input['value'] && !opts.selectedItems.length) {
            opts.selectedItems = input['value'];
        }
        opts.width = parseInt(opts.width) > 0 ? parseInt(opts.width) : this.defaultOptions.width;
        opts.height = parseInt(opts.height) > 0 ? parseInt(opts.height) : this.defaultOptions.height;
        opts.resultListWidth = parseInt(opts.resultListWidth) > 0 ? parseInt(opts.resultListWidth) : opts.width;
        if (opts.imageId) {
            opts.imageId = ge(opts.imageId);
        }
    },
    init: function (input, data) {
        this.dataURL = typeof (data) == 'string' ? data : null;
        this.dataItems = isArray(data) ? data : [];
        this.currentList = this.dataItems;
        if (this.dataURL) {
            this.cache = new Cache(this.options);
        } else {
            this.indexer = new Indexer(this.dataItems, {
                indexkeys: this.options.indexkeys
            });
        }
        this._selectedItems = [];
        this.input = input;
        this.disabled = false;
        this.mouseIsOver = false;
        this.hasFocus = 0;
        this.scrollbarWidth = 0;
        this.timeout = null;
        this.readOnly = (!this.options.autocomplete ? 'readonly="true"' : '');
        this.requestTimeout = null;
        this.selectedTokenId = 0;
        this.selectorWidth = this.options.width;
    },
    initDOM: function (input, data, options) {
        var opts = this.options,
            self = this;
        this.container = ce('div', {
            id: 'container' + this.guid,
            className: 'selector_container' + (!opts.autocomplete ? ' dropdown_container' : '') + (browser.mobile ? ' mobile_selector_container' : ''),
            innerHTML: '<table cellspacing="0" cellpadding="0" class="selector_table">\
                  <tr>\
                    <td class="selector">\
                      <span class="selected_items"></span>\
                      <input type="text" class="selector_input" ' + this.readOnly + ' />\
        <input type="hidden" name="' + opts.resultField + '" id="' + opts.resultField + '" value="" class="resultField"><input type="hidden" name="' + opts.customField + '" id="' + opts.customField + '" value="" class="customField">\
      </td>' + (opts.dropdown ? '<td id="dropdown' + this.guid + '" class="selector_dropdown">&nbsp;</td>' : '') + '\
    </tr>\
  </table>\
  <div class="results_container">\
    <div class="result_list" style="display:none;"></div>\
    <div class="result_list_shadow">\
      <div class="shadow1"></div>\
      <div class="shadow2"></div>\
    </div>\
  </div>'
        }, {
            width: opts.width + 'px'
        });
        input.parentNode.replaceChild(this.container, input);
        each({
            selector: 'selector',
            resultList: 'result_list',
            resultListShadow: 'result_list_shadow',
            input: 'selector_input',
            selectedItemsContainer: 'selected_items',
            resultField: 'resultField',
            customField: 'customField',
            dropdownButton: 'selector_dropdown'
        }, function (k, v) {
            self[k] = geByClass(v, self.container)[0];
        });
        if (browser.chrome) {
            this.resultList.style.opacity = 1;
        }
        //if (!this.disabled) // always enabled at init
        input.style.color = opts.placeholderColor;
        input.autocomplete = '1';
        if (opts.dividingLine) {
            addClass(this.resultList, 'dividing_line')
        }
        this.resultList.style.width = this.resultListShadow.style.width = opts.resultListWidth + 'px';
        if (this.options.dropdown) {
            this.initDropdown();
        }
        this.select = new Select(this.resultList, this.resultListShadow, {
            selectFirst: opts.selectFirst,
            height: opts.height,
            onItemActive: function (value) {
                self.showImage(value);
                self.activeItemValue = value;
            },
            onItemSelect: self._selectItem.bind(self),
            onShow: function () {
                _ui.sel(self.guid);
                self.highlightInput(true);
                if (options.onShow) {
                    options.onShow();
                }
            },
            onHide: function () {
                _ui.sel(false);
                self.highlightInput(false);
                if (options.onHide) {
                    options.onHide();
                }
            }
        });
    },
    initEvents: function () {
        var self = this;
        if (this.options.dropdown) {
            this.initDropdownEvents();
        }
        var keyev1 = browser.opera || browser.mozilla ? 'keypress' : 'keydown';
        var keyev2 = browser.opera ? 'keypress' : 'keydown';
        this.onEvent = function (e) {
            if (e.type == 'mousedown') {
                var outside = true,
                    t = e.target;
                while (t && t != t.parentNode) {
                    if (t == self.container) {
                        outside = false;
                        break;
                    }
                    t = t.parentNode;
                }
                if (outside) {
                    self.select.hide();
                    self.deselectTokens();
                }
            }
            if (e.type == keyev1) {
                self.handleKeyboardEventOutside(e);
            }
            if (e.type == keyev2) {
                self.select.handleKeyEvent(e);
            }
        }
        addEvent(this.input, 'paste keypress keydown keyup focus blur', this.handleKeyboardEvent, false, {
            self: this
        });
        addEvent(this.selector, 'mousedown', function (e) {
            var click_over_token = false;
            var el = e.target;
            while (el != null) {
                if (hasClass(el, 'token')) {
                    click_over_token = true;
                    break;
                }
                el = el.parentNode;
            }
            if (!click_over_token) {
                return self.onInputClick(e);
            }
            return true;
        }, false, {
            self: this
        });
    },
    afterInit: function () {
        this.updateInput();
        var opt = this.options,
            self = this;
        if (opt.selectedItems !== undefined) {
            if (isArray(opt.selectedItems)) {
                for (var i in opt.selectedItems) {
                    this._selectItem(opt.selectedItems[i], false);
                }
            } else {
                each((opt.selectedItems + '').split(','), function (i, x) {
                    self._selectItem(x, false);
                });
            }
        }
        // Select first item if it is dropdown
        if (!this._selectedItems.length && !this.options.autocomplete && !this.options.multiselect && this.options.defaultItems.length) {
            this._selectItem(this.options.defaultItems[0], false);
        }
    },
    // Extended methods
    prepareOptionsText: function (options) {
        each(['disabledText', 'placeholder'], function () {
            if (this in options) {
                options[this] = winToUtf(stripHTML(options[this]));
            }
        });
        return options;
    },
    fadeButtonToColor: function () {
        if (this.options.customArrow) return;
        var state = window.is_rtl ? {
            backgroundColor: '#E1E8ED',
            borderRightColor: '#D2DBE0'
        } : {
            backgroundColor: '#E1E8ED',
            borderLeftColor: '#D2DBE0'
        };
        var self = this;
        animate(this.dropdownButton, state, 200, function () {
            if (!self.mouseIsOver) {
                if (!self.select.isVisible()) {
                    self.fadeButtonToWhite();
                } else {
                    self.dropdownButton.style.backgroundColor = self.dropdownButton.style[window.is_rtl ? 'borderRightColor' : 'borderLeftColor'] = '';
                }
            }
        });
    },
    fadeButtonToWhite: function () {
        if (this.options.customArrow) return;
        var self = this;
        animate(this.dropdownButton, {
            backgroundColor: '#FFFFFF',
            borderLeftColor: '#FFFFFF'
        }, 200, function () {
            self.dropdownButton.style.backgroundColor = self.dropdownButton.style[window.is_rtl ? 'borderRightColor' : 'borderLeftColor'] = '';
            if (self.mouseIsOver) {
                self.fadeButtonToColor();
            }
        });
    },
    initDropdown: function () {
        this.scrollbarWidth = this.options.customArrowWidth || window.sbWidth();
        if (this.scrollbarWidth <= 3) {
            this.scrollbarWidth = browser.mobile ? 20 : 14;
        }
        if (!this.options.customArrow) {
            this.dropdownButton.style.width = this.scrollbarWidth + 'px';
        }
        this.selectorWidth -= this.scrollbarWidth;
    },
    initDropdownEvents: function () {
        var self = this;
        addEvent(this.dropdownButton, 'mouseover', function () {
            addClass(this, 'selector_dropdown_hover');
        });
        addEvent(this.dropdownButton, 'mouseout', function () {
            removeClass(this, 'selector_dropdown_hover');
        });
        addEvent(this.container, 'mouseover', function (e) {
            self.mouseIsOver = true;
            if (self.disabled) return;
            self.fadeButtonToColor();
        });
        addEvent(this.container, 'mouseout', function () {
            self.mouseIsOver = false;
            if (self.disabled) return;
            setTimeout(function () {
                if (self.mouseIsOver) return;
                if (!self.select.isVisible()) {
                    self.fadeButtonToWhite();
                } else {
                    self.dropdownButton.style.backgroundColor = self.dropdownButton.style[window.is_rtl ? 'borderRightColor' : 'borderLeftColor'] = '';
                }
            }, 0);
        });
        addEvent(this.dropdownButton, 'mousedown', function () {
            if (!self.select.isVisible()) {
                self.showDefaultList();
            } else {
                self.select.toggle();
            }
        });
    },
    destroyDropdown: function () {
        if (vk.al) cleanElems(this.dropdownButton);
        removeEvent(this.container, 'mouseover');
        removeEvent(this.container, 'mouseout');
        this.scrollbarWidth = 0;
        this.selectorWidth = this.options.width;
    },
    destroy: function () {
        if (!vk.al || this.destroyed) return;
        this.destroyDropdown();
        var img = ge(this.options.imageId);
        if (img) removeEvent(img, 'click');
        this.select.destroy();
        cleanElems(this.container, this.input, this.selector, this.resultList, this.resultListShadow);
        for (var el = this.selectedItemsContainer.firstChild; el; el = el.nextSibling) {
            cleanElems(el, el.firstChild.nextSibling);
        }
        this.destroyed = true;
    },
    updateInput: function () {
        if (!this._selectedItems.length && !this.hasFocus) {
            this.input.value = ((this.disabled && this.options.disabledText) ? this.options.disabledText : this.options.placeholder);
            if (!this.disabled) this.input.style.color = this.options.placeholderColor;
        }
        if (!this.options.autocomplete && this.options.multiselect && this._selectedItems.length) {
            hide(this.input);
        } else {
            if (!isVisible(this.input)) show(this.input);
            this.input.style.width = '20px';
            var offset = this._selectedItems.length ? this.input.offsetLeft : (window.is_rtl ? this.selectorWidth - 9 : 0);
            var w = window.is_rtl ? offset : (this.selectorWidth - offset - 9);
            this.input.style.width = Math.max(20, w) + 'px';
        }
    },
    handleKeyboardEvent: function (e) {
        var self = e.data.self;
        switch (e.type) {
            case 'keyup':
                if (self.options.onKeyup) self.options.onKeyup(self.input.value);
                break;
            case 'paste':
                clearTimeout(self.timeout);
                self.timeout = setTimeout(function () {
                    self.onChange();
                }, 0);
                break;
            case 'keypress':
                if (e.which == KEY.RETURN && browser.opera && self.options.enableCustom && (self.select.selectedItem() === null || self.select.selectedItem() === undefined)) {
                    self.select.hide();
                    if (!self.options.noBlur) {
                        self.input.blur();
                    } else if (isFunction(self.options.onChange)) {
                        self.updateCustom();
                        self.options.onChange(self.resultField.value);
                    }
                    return false;
                } else if (e.which == KEY.SPACE || e.which > 40 && !e.metaKey) {
                    clearTimeout(self.timeout);
                    self.timeout = setTimeout(function () {
                        self.onChange();
                    }, 0);
                }
                break;
            case 'keydown':
                switch (e.keyCode) {
                    case KEY.DOWN:
                        if (!self.select.isVisible()) {
                            setTimeout(self.showDefaultList.bind(self), 0);
                            return false;
                        }
                        break;
                    case KEY.DEL:
                        if (self.input.value.length > 0) {
                            clearTimeout(self.timeout);
                            self.timeout = setTimeout(self.onChange.bind(self), 0);
                        } else {
                            if (self.selectedTokenId) {
                                var nextTokenId = 0;
                                for (var i = self._selectedItems.length - 2; i >= 0; i--) {
                                    if (self._selectedItems[i][0] == self.selectedTokenId && self._selectedItems[i + 1]) {
                                        nextTokenId = self._selectedItems[i + 1][0];
                                    }
                                }
                                self.removeTagData(self.selectedTokenId);
                                if (nextTokenId) {
                                    self.selectToken(nextTokenId);
                                } else if (!self.readOnly && !self.hasFocus) {
                                    self.input.focus();
                                }
                            } else if (self.hasFocus && self._selectedItems.length) {
                                self.selectToken(self._selectedItems[self._selectedItems.length - 1][0]);
                            }
                            cancelEvent(e);
                        }
                        return true;
                        break;
                    case KEY.RETURN:
                        if (!browser.opera && self.options.enableCustom && (self.select.selectedItem() === null || self.select.selectedItem() === undefined)) {
                            self.select.hide();
                            if (!self.options.noBlur) {
                                self.input.blur();
                            } else if (isFunction(self.options.onChange)) {
                                self.updateCustom();
                                self.options.onChange(self.resultField.value);
                            }
                            return false;
                        }
                        break;
                    case KEY.ESC:
                        self.input.blur();
                        break;
                }
                break;
            case 'focus':
                if (!self.disabled && !self.select.isVisible() && !self.focusSelf) {
                    self.showDefaultList();
                }
                self.focusSelf = false;
                if (self.disabled || self.readOnly) {
                    self.input.blur();
                    return true;
                }
                if ((self._selectedItems.length == 0) || self.options.multiselect) {
                    if (browser.mozilla) {
                        setTimeout(function () {
                            self.input.value = '';
                        }, 0);
                    } else {
                        self.input.value = '';
                    }
                }
                addClass(self.input, 'focused');
                self.input.style.color = '#000';
                self.hasFocus++;
                break;
            case 'blur':
                if (self.options.chooseFirst && self.options.chooseFirst(self.input.value)) { // email field
                    self.select.active = 0;
                    if (isFunction(self.select.options.onItemSelect)) {
                        self.select.options.onItemSelect(self.select.selectedItem(), undefined, true);
                    }
                    return cancelEvent(e);
                }
                if (self.readOnly) return true;
                if (!self.disabled) {
                    self.updateCustom();
                    clearTimeout(self.requestTimeout);
                    if (self.changeAfterBlur && isFunction(self.options.onChange)) {
                        if (!self.options.enableCustom || !self._selectedItems.length) {
                            self.options.onChange('');
                        }
                        self.changeAfterBlur = false;
                    }
                    if (self.options.onBlur) {
                        self.options.onBlur();
                    }
                }
                if (!hasClass(self.input, 'selected')) {
                    self.input.style.color = self.options.placeholderColor;
                }
                removeClass(self.input, 'focused');
                self.hasFocus = 0;
                break;
        }
        return true;
    },
    updateCustom: function () {
        var self = this;
        if (self.options.enableCustom && self.input.value.length) {
            var custom_val = self.input.value;
            if (self._selectedItems.length == 0) {
                self.resultField.value = parseInt(!self.options.valueForCustom);
                self.customField.value = custom_val;
                self._selectItem([self.options.valueForCustom, custom_val]);
            }
        } else if (self._selectedItems.length == 0) {
            self.input.value = self.options.placeholder;
        } else if (self.options.multiselect) {
            self.input.value = '';
        }
    },
    handleKeyboardEventOutside: function (e) {
        if (this.disabled || this.input.value.length > 0 && this.hasFocus || !this.hasFocus && this.selectedTokenId == 0) {
            return true;
        }
        switch (e.keyCode) {
            case KEY.RETURN:
                return false;
                break;
            case KEY.LEFT:
                for (var i = this._selectedItems.length - 1; i >= 0; i--) {
                    if (!this.selectedTokenId || this._selectedItems[i][0] == this.selectedTokenId && i > 0) {
                        if (this.selectedTokenId) {
                            i--;
                        }
                        this.selectToken(this._selectedItems[i][0]);
                        this.input.blur();
                        break;
                    }
                }
                return false;
                break;
            case KEY.RIGHT:
                for (var i = 0; i < this._selectedItems.length; i++) {
                    if (this._selectedItems[i][0] == this.selectedTokenId) {
                        if (i < this._selectedItems.length - 1) {
                            this.selectToken(this._selectedItems[i + 1][0]);
                            this.input.blur();
                        } else if (!this.readOnly) {
                            this.deselectTokens();
                            this.input.focus();
                        }
                        break;
                    }
                }
                return false;
                break;
        }
        return true;
    },
    onInputClick: function (e) {
        var self = e.data.self;
        self.deselectTokens();
        if (!self.select.isVisible()) {
            self.showDefaultList();
        } else {
            if (self.input.readOnly) {
                self.focusSelf = true;
                self.select.toggle();
            } else {
                self.onChange();
            }
        }
        if (!self.readOnly) {
            // self.focusSelf = true;
            self.input.focus();
        } else {
            self.input.blur();
        }
    },
    highlightInput: function (focus) {
        if (focus) {
            addClass(this.container, 'selector_focused');
        } else {
            removeClass(this.container, 'selector_focused');
        }
    },
    selectToken: function (id) {
        if (!this.options.multiselect) return;
        this.select.hide();
        removeClass(ge('bit_' + this.guid + '_' + this.selectedTokenId), 'token_selected');
        addClass(ge('bit_' + this.guid + '_' + id), 'token_selected');
        this.selectedTokenId = id;
        if (this.options.onTokenSelected) this.options.onTokenSelected(id);
        this.showImage(id);
    },
    deselectTokens: function () {
        if (!this.selectedTokenId || !this.options.multiselect) return;
        removeClass(ge('bit_' + this.guid + '_' + this.selectedTokenId), 'token_selected');
        this.selectedTokenId = 0;
        if (this.options.onTokenSelected) this.options.onTokenSelected();
        this.showImage();
    },
    _blur: function () {
        this.select.hide();
    },
    showImage: function (itemValue, itemData) {
        if (!this.options.imageId) {
            return false;
        }
        var img = ge(this.options.imageId);
        if (!img) return false;
        if (itemData === undefined) {
            if (!itemValue) { // 0 or undefined
                itemValue = this.resultField.value.split(',')[0];
            }
            var data = this._selectedItems.concat(this.currenDataItems);
            if (data && data.length) {
                for (var i in data) {
                    if (data[i] && data[i][0] == itemValue) {
                        itemData = data[i];
                        break;
                    }
                }
            }
        }
        if (itemData !== undefined && typeof (itemData[3]) == 'string' && itemData[3].length) {
            if (itemData[3] == 'none') {
                img.style.display = 'none';
            } else {
                img.style.display = '';
                img.setAttribute('src', itemData[3]);
                img.parentNode.href = '/' + this.options.hrefPrefix + itemData[0]; // hack
                removeEvent(img.parentNode, 'click');
            }
        } else {
            img.style.display = '';
            img.setAttribute('src', this.options.noImageSrc);
            img.parentNode.href = '#'; // hack
            addEvent(img.parentNode, 'click', function () {
                return true;
            });
        }
        return true;
    },
    _selectItem: function (item, fireEvent, focusIfMultiselect) {
        if (item == null) {
            return;
        }
        if (fireEvent === undefined) {
            fireEvent = true;
        }
        var data;
        if (item == -2e9) {
            data = [this.curTerm, this.curTerm, cur.lang['mail_enter_email_address'], '/images/contact_info.png', 0, ''];
        } else if (typeof (item) == 'string' && item.indexOf('@') != -1) {
            data = [item, item, cur.lang['mail_enter_email_address'], '/images/contact_info.png', 0, ''];
        } else if (typeof (item) == 'object') {
            data = item;
        } else {
            var all_data = [];
            each([this.dataItems, this.options.defaultItems, this.receivedData], function (i, items) {
                if (items && items.length)
                    all_data = all_data.concat(items);
            });
            for (var i in all_data) {
                if (all_data[i][0] == item || all_data[i] == item) {
                    data = all_data[i];
                    break;
                }
            }
        }
        if (typeof data != 'object') {
            data = [item, item]; // value and text
        };
        data[0] = data[0].toString();
        data[1] = data[1].toString();
        this.changeAfterBlur = false;
        if (data[0] === this.resultField.value) {
            if (!this.options.multiselect) {
                this.input.value = winToUtf(stripHTML(data[1])); // It could have changed in setData method
                this.showImage();
                if (this.input.value.length || !this.options.placeholder) {
                    addClass(this.input, 'selected');
                    if (!this.disabled) {
                        this.input.style.color = this.resultField.value == '0' && this.options.zeroPlaceholder && this.options.placeholderColor || '#000';
                    }
                } else {
                    this.input.value = this.options.placeholder;
                    if (!this.disabled) this.input.style.color = this.options.placeholderColor;
                }
            }
            return;
        }
        if (this._selectedItems.length >= this.options.maxItems) {
            this.select.hide();
            return;
        }
        this.deselectTokens();
        this.addTagData(data);
        this.showImage();
        if (this.options.multiselect) {
            this.input.value = '';
            if (this.dataURL) {
                this.select.clear();
            } else {
                this.select.removeItem(data[0]);
            }
        } else {
            this.input.value = winToUtf(stripHTML(data[1]));
            addClass(this.input, 'selected');
            if (!this.disabled) {
                this.input.style.color = this.resultField.value == '0' && this.options.zeroPlaceholder && this.options.placeholderColor || '#000';
            }
        }
        this.select.hide();
        this.updateInput();
        if (focusIfMultiselect && this.options.multiselect && !this.readOnly) {
            setTimeout(function () {
                if (!this.options.multinostop) {
                    this.focusSelf = true;
                }
                hide(this.input);
                show(this.input);
                this.input.focus();
            }.bind(this), 100);
        } else {
            if (!this.options.noBlur) this.input.blur();
        }
        if (fireEvent) {
            if (this.options.multiselect && isFunction(this.options.onTagAdd)) {
                this.options.onTagAdd(data, this.resultField.value);
            }
            if (isFunction(this.options.onChange)) {
                this.options.onChange(this.resultField.value);
            }
        }
    },
    addTagData: function (data) {
        if (!data || data.length < 2) return;
        if (!this.options.multiselect) {
            this._selectedItems.splice(0, this._selectedItems.length, data);
            this.resultField.value = data[0];
            return;
        }
        for (var i in this._selectedItems) {
            if (this._selectedItems[i][0] == data[0]) {
                this.selectToken(this._selectedItems[i][0]);
                return;
            }
        }
        this._selectedItems.push(data);
        var resultArr = [];
        for (i in this._selectedItems) {
            resultArr.push(this._selectedItems[i][0]);
        }
        this.resultField.value = resultArr.join(',');
        this.input.style.width = '1px';
        // make box
        var token = ce('div', {
            id: 'bit_' + this.guid + '_' + data[0],
            className: 'token'
        });
        var maxTokenWidth = Math.max(this.selector.clientWidth, getSize(token)[0]);
        var self = this;
        token.innerHTML = '<span class="l">' + data[1] + '</span><span class="x" />';
        addEvent(token, 'click', function () {
            self.selectToken(data[0]);
            return false;
        });
        addEvent(token, 'dblclick', function () {
            if (data[4]) {
                self.removeTagData(data[0]);
                each(data[4], function (i, v) {
                    self._selectItem(v, false);
                });
            }
            return false;
        });
        addEvent(token, 'mouseover', function (e) {
            addClass(token, 'token_hover');
            self.showImage(data[0], data);
        });
        addEvent(token, 'mouseout', function (e) {
            removeClass(token, 'token_hover');
            self.showImage(self.activeItemValue ? self.activeItemValue : self.selectedTokenId);
        });
        var close = token.firstChild.nextSibling;
        addEvent(close, 'mousedown', function () {
            self.select.hide();
            self.removeTagData(data[0]);
            if (!self.readOnly && self.hasFocus) {
                self.input.focus();
            }
            return false;
        });
        self.selectedItemsContainer.appendChild(token);
        var label = token.firstChild;
        var labelStr = label.innerHTML;
        while (token.offsetWidth > maxTokenWidth && labelStr.length > 3) {
            labelStr = labelStr.substr(0, labelStr.length - 2);
            label.innerHTML = labelStr + '...';
        }
    },
    removeTagData: function (id) {
        this.selectedTokenId = 0;
        var token = ge('bit_' + this.guid + '_' + id);
        if (!token) {
            return false;
        }
        var close = token.firstChild.nextSibling;
        if (vk.al) cleanElems(token, close);
        token.parentNode.removeChild(token);
        var index, resultArr = [];
        for (i in this._selectedItems) {
            if (this._selectedItems[i][0] == id) {
                index = i;
                continue;
            }
            resultArr.push(this._selectedItems[i][0]);
        }
        if (index == undefined) return false;
        this.resultField.value = resultArr.join(',');
        if (this.options.onTagRemove) {
            this.options.onTagRemove(this._selectedItems[i], this.resultField.value);
        }
        if (isFunction(this.options.onChange)) {
            this.options.onChange(this.resultField.value);
        }
        this._selectedItems.splice(index, 1);
        if (this.options.multiselect) {
            this.defaultList = false;
        }
        this.showImage();
        this.updateInput();
        return false;
    },
    onChange: function () {
        var term = trim(this.input.value.toLowerCase()),
            self = this;
        if (!this.options.multiselect) {
            if (this._selectedItems.length) {
                this.changeAfterBlur = true;
            }
            this._clear();
        }
        clearTimeout(this.requestTimeout);
        if (term.length == 0) {
            this.showDefaultList();
            return;
        }
        this.curTerm = term;
        var custom = this.options.customSearch,
            res = custom && custom(term);
        if (res) {
            this.receiveData(term, res);
            return;
        }
        if (this.dataURL) {
            var data = this.cache.getData(term);
            if (data == null) {
                this.requestTimeout = setTimeout(function () {
                    self.request(self.receiveData.bind(self), self.showNoDataList.bind(self));
                }, 300);
            } else {
                // receive the cached data
                if (data && data.length) {
                    this.receiveData(term, data);
                } else {
                    this.showNoDataList();
                }
            }
        } else {
            var data = this.indexer.search(term);
            if (data && data.length) {
                this.receiveData(term, data);
            } else {
                this.showNoDataList();
            }
        }
    },
    showNoDataList: function () {
        if (this.hasFocus || this.readOnly) {
            this._showSelectList(this.options.noResult);
            this.defaultList = false;
        }
    },
    showDefaultList: function () {
        var reversed = hasClass(this.resultList, 'reverse');
        if (reversed != this.needsReverse() && this.currenDataItems) {
            this.setSelectContent(this.currenDataText || '', this.currenDataItems);
        }
        if (this.defaultList && this.select.hasItems()) {
            if (this.options.multiselect || !this._selectedItems.length)
                this.select.show();
            else
                this.select.show(this._selectedItems[0][0]);
        } else {
            this.defaultList = true;
            var text = this.options.autocomplete ? this.options.introText : null;
            this._showSelectList(text, (this.options.defaultItems.length || this.options.zeroDefault) ? this.options.defaultItems : this.dataItems);
        }
        reversed = hasClass(this.resultList, 'reverse');
        if (reversed) {
            if (!this._selectedItems.length) {
                this.resultList.scrollTop = getSize(this.resultList.firstChild)[1] - getSize(this.resultList)[1] + 10;
            }
            setStyle(this.resultList, {
                bottom: getSize(this.container)[1] - 1
            });
        } else {
            setStyle(this.resultList, {
                bottom: 'auto'
            });
        }
    },
    showDataList: function (items, query) {
        this.defaultList = false;
        this._showSelectList(null, items, query);
    },
    needsReverse: function () {
        var scrollY = window.scrollGetY ? scrollGetY() : getScroll()[1],
            contY = getXY(this.container)[1] || 0,
            contH = getSize(this.container)[1] || 22,
            maxListH = this.options.height || 250,
            minListH = this.options.minHeight || 0,
            wh = (window.pageNode && window.browser.mozilla ? Math.min(getSize(pageNode)[1], window.lastWindowHeight) : window.lastWindowHeight) || getScroll()[3],
            list_ul = this.resultList && this.resultList.firstChild,
            listH;
        if (list_ul && list_ul.firstChild) {
            var disp = getStyle(this.resultList, 'display'),
                vis = getStyle(this.resultList, 'visibility');
            setStyle(this.resultList, {
                visibility: 'hidden',
                display: 'block'
            });
            listH = getSize(this.resultList)[1];
            setStyle(this.resultList, {
                visibility: vis,
                display: disp
            });
        } else {
            listH = minListH ? minListH : (this.currenDataItems ? this.currenDataItems.length * getSize(this.container)[1] : maxListH);
        }
        if (listH > maxListH) listH = maxListH;
        return (contY + contH + listH - scrollY > wh && contY - listH - scrollY > 0);
    },
    setSelectContent: function (text, items, query) {
        items = isArray(items) && items.length ? items : [];
        var adding = [];
        this.select.clear();
        if (text) {
            adding.push(['', text, true]);
        }
        if (items.length) {
            for (var i in items) {
                if (typeof items[i] != 'object') items[i] = [items[i], items[i]];
            }
            if (this.options.multiselect) {
                items = this.filterData(items);
            }
            if (this.options.dividingLine == 'smart') {
                removeClass(this.resultList, 'dividing_line');
                for (var i in items) {
                    if (typeof (items[i][2]) == 'string' && items[i][2].length) {
                        addClass(this.resultList, 'dividing_line');
                    }
                }
            }
            var itemsToShow = (this.options.autocomplete && query) ? this.options.maxItemsShown(query.length) : items.length,
                self = this;
            for (var i = 0; i < items.length; ++i) {
                var it = items[i];
                if (!itemsToShow) break;
                var formatted = self.options.formatResult(it);
                if (query) {
                    if ((formatted = self.options.highlight(formatted, query))) {
                        --itemsToShow;
                    }
                }
                if (!formatted) continue;
                adding.push([it[0], formatted]);
            }
        }
        var rev = this.needsReverse();
        if (rev) adding = adding.reverse();
        toggleClass(this.resultList, 'reverse', rev);
        toggleClass(this.resultListShadow, 'reverse', rev);
        this.select.content(adding);
    },
    _showSelectList: function (text, items, query) {
        this.currenDataItems = items;
        this.currenDataText = text;
        // RTL fix
        if (window.is_rtl) {
            var l = getXY(this.container)[0];
            if (l) geByClass('results_container', this.container)[0].style.left = l + 'px';
        }
        this.setSelectContent(text, items, query);
        if (this.options.multiselect || !this._selectedItems.length) {
            this.select.show();
        } else {
            this.select.show(this._selectedItems[0][0]);
        }
        return true;
    },
    receiveData: function (q, data) {
        if (q != this.curTerm) return;
        if (q != '' && data && data.length && this.hasFocus) {
            this.receivedData = data;
            this.showDataList(data, q);
        } else {
            this.select.hide();
        }
    },
    filterData: function (items) {
        var result = [],
            self = this;
        each(items, function (i) {
            for (var j in self._selectedItems) {
                if (this[0] == self._selectedItems[j][0])
                    return;
            }
            result.push(this);
        });
        return result;
    },
    request: function (success, failure) {
        if (!this.dataURL) return;
        var term = trim(this.input.value.toLowerCase()),
            self = this;
        if (term.length == 0) return;
        var sep = this.dataURL.indexOf('?') == -1 ? '?' : '&';
        var url = this.dataURL + sep + 'str=' + encodeURIComponent(term);
        var done = function (data) {
            if (self.options.progressBar) {
                hide(self.options.progressBar);
            }
            try {
                data = eval('(' + data + ')');
            } catch (e) {}
            if (data.length) {
                self.cache.setData(term, data);
                if (isFunction(success)) success(term, data);
            } else {
                self.cache.setData(term, []);
                if (isFunction(failure)) failure(term);
            }
        }
        if (vk.al) {
            ajax.plainpost(url, {}, done);
        } else {
            var aj = new Ajax(function (obj, data) {
                done(data);
            });
            aj.post(url);
        }
        if (this.options.progressBar) {
            show(this.options.progressBar);
        }
    },
    doSort: function (data) {
        var i, j, tmp;
        if (!data.length || data.length < 2) return;
        for (i = 0; i < data.length - 1; i++) {
            for (j = i + 1; j < data.length; j++) {
                if (data[i][1] > data[j][1]) {
                    tmp = data[i];
                    data[i] = data[j];
                    data[j] = tmp;
                }
            }
        }
    },
    disable: function (value) {
        if (value && !this.disabled) {
            this.disabled = true;
            addClass(this.container, 'disabled');
            var s = getSize(this.container);
            if (this.options.disabledText) this.input.value = this.options.disabledText;
            this.container.appendChild(
                ce('div', {
                    className: 'hide_mask'
                }, {
                    position: 'absolute',
                    background: '#000',
                    opacity: 0,
                    width: s[0] + 'px',
                    height: s[1] + 'px',
                    marginTop: -s[1] + 'px'
                })
            );
            this.input.blur();
            this.input.style.color = '';
            this.select.hide();
            //this.updateInput(); // Is it correct?
        } else if (!value && this.disabled) {
            this.disabled = false;
            if (this.options.autocomplete) this.input.value = '';
            removeClass(this.container, 'disabled');
            this.container.removeChild(geByClass('hide_mask', this.container)[0]);
            //this.updateInput(); // Is it correct?
        }
    },
    _clear: function () {
        this.showImage();
        if (this.options.multiselect) {
            this.selectedTokenId = 0;
            this.selectedItemsContainer.innerHTML = '';
            this.defaultList = false;
        }
        if (!this.options.multiselect && !this.options.autocomplete) {
            if (this._selectedItems[0] != this.options.defaultItems[0]) {
                this._selectItem(this.options.defaultItems[0], false);
            }
        } else {
            removeClass(this.input, 'selected');
            this.resultField.value = '';
            this._selectedItems.splice(0, this._selectedItems.length);
        }
        return false;
    },
    setURL: function (url) {
        if (typeof (url) == 'string') {
            this.dataURL = url;
            if (!this.cache) {
                this.cache = new Cache(this.options);
            } else {
                this.cache.flush();
            }
            if (this.indexer) delete this.indexer;
            this.dataItems = [];
        }
    },
    setData: function (dataArr) {
        if (!isArray(dataArr)) return;
        if (!this.options.autocomplete) {
            this.select.clear();
            this.options.defaultItems = dataArr;
            if (!this.options.multiselect) {
                if (!this._selectedItems.length && this.options.defaultItems.length) {
                    this._selectItem(this.options.defaultItems[0], false);
                } else if (this._selectedItems.length) {
                    var exists = false;
                    for (var i in this.options.defaultItems) {
                        var item = this.options.defaultItems[i][0] || this.options.defaultItems[i];
                        if (item == this._selectedItems[0][0] || item == this._selectedItems[0][0]) {
                            exists = true;
                            break
                        }
                    }
                    if (!exists) {
                        this._selectItem(this.options.defaultItems[0], false);
                    } else {
                        this._selectItem(this._selectedItems[0][0], false);
                    }
                }
            }
        } else {
            this.dataItems = dataArr;
            this.dataURL = null;
        }
        if (!this.indexer) {
            this.indexer = new Indexer(dataArr);
        } else {
            this.indexer.setData(dataArr);
        }
        if (this.cache) delete this.cache;
    },
    focus: function () {
        if (!this.readOnly) {
            this.input.focus();
        }
    },
    selectItem: function (item, fireEvent) {
        this._selectItem(item, fireEvent);
    },
    setOptions: function (new_options) {
        new_options = this.prepareOptionsText(new_options);
        extend(this.options, new_options);
        if ('maxItems' in new_options && this.options.maxItems >= 0) {
            for (var i = this._selectedItems.length - 1; i >= this.options.maxItems; i--) {
                this.removeTagData(this._selectedItems[i][0]);
            }
        }
        if ('defaultItems' in new_options) {
            this.select.clear();
            if (this.select.isVisible(this.container)) {
                this.showDefaultList();
            }
        }
        if ('enableCustom' in new_options) {
            if (this.options.enableCustom && !this.options.autocomplete) {
                this.options.autocomplete = new_options.autocomplete = true;
            }
        }
        if ('width' in new_options) {
            this.container.style.width = this.options.width + 'px';
            this.resultList.style.width = this.resultListShadow.style.width = this.options.width + 'px';
            this.selectorWidth = this.options.width - this.scrollbarWidth;
        }
        if ('dropdown' in new_options) {
            var dd = geByClass('selector_dropdown', this.container)[0];
            if (!this.options.dropdown && dd) {
                this.destroyDropdown();
                dd.parentNode.removeChild(dd);
            } else if (!dd && this.options.dropdown) {
                dd = this.container.firstChild.rows[0].insertCell(1);
                dd.id = 'dropdown' + this.guid;
                dd.className = 'selector_dropdown';
                dd.innerHTML = '&nbsp;';
                this.dropdownButton = dd;
                this.initDropdown();
                this.initDropdownEvents();
            }
        }
        if (('width' in new_options) || ('autocomplete' in new_options) || ('dropdown' in new_options)) {
            this.updateInput();
        }
        if ('autocomplete' in new_options) {
            if (this.options.autocomplete) {
                removeClass(this.container, 'dropdown_container');
                this.input.readOnly = false;
                this.readOnly = '';
            } else {
                addClass(this.container, 'dropdown_container');
                this.input.readOnly = true;
                this.options.enableCustom = false;
                this.readOnly = 'readonly="true"';
            }
        }
    },
    val: function (value, fireEvent) {
        if (value !== undefined) this._selectItem(value, (fireEvent === undefined) ? false : fireEvent);
        return this.resultField.value;
    },
    val_full: function () {
        if (this.options.multiselect) {
            return this._selectedItems;
        } else {
            if (this._selectedItems.length) {
                return this._selectedItems[0];
            } else {
                return [this.resultField.value, this.input.value];
            }
        }
    },
    customVal: function (value, fireEvent) {
        if (value !== undefined) {
            this.customField.value = value;
            this.selectItem([this.options.valueForCustom, value], (fireEvent === undefined) ? false : fireEvent);
        }
        return this.customField.value;
    },
    selectedItems: function () {
        return this._selectedItems;
    },
    clear: function () {
        this._clear();
        this.updateInput();
    }
});
//
// Select class
//
createChildClass('Select', UiControl, {
    // Static class fields
    common: {
        _sel: window.Select && Select._sel || [],
        reg: function (obj) {
            this._sel.push(obj);
            return this._sel.length;
        },
        destroy: function (uid) {
            this._sel[uid - 1] = false;
        },
        itemMouseMove: function (uid, i, el) {
            this._sel[uid - 1].onMouseMove(i, el);
        },
        itemMouseDown: function (uid, i, el) {
            this._sel[uid - 1].onMouseDown(i, el);
        }
    },
    // Standart fields
    CSS: {
        FIRST: 'first',
        LAST: 'last',
        ACTIVE: 'active',
        SCROLLABLE: 'result_list_scrollable'
    },
    controlName: 'SelectList',
    // Standart methods
    initOptions: function (container, shadow, options) {
        this.options = options || {};
    },
    init: function (container, shadow, options) {
        this.container = container;
        this.shadow = shadow;
        this.active = -1;
        this.data = [];
        this.uid = this.common.reg(this);
        this.maxHeight = this.options.height ? this.options.height : 250;
    },
    initDOM: function () {
        this.list = ce('ul');
        this.container.appendChild(this.list);
    },
    show: function (selectedItem) {
        var wasVisible = isVisible(this.container);
        if (!wasVisible) {
            this.performShow();
        }
        var childNode;
        if (selectedItem) {
            for (var i = 0; i < this.list.childNodes.length; i++) {
                childNode = this.list.childNodes[i];
                if (childNode.getAttribute('val') == selectedItem) {
                    this.highlight(i, childNode);
                    break;
                }
            }
        } else if (this.options.selectFirst) {
            var reversed = this.container && hasClass(this.container, 'reverse'),
                ind;
            for (var i = 0; i < this.list.childNodes.length; i++) {
                ind = reversed ? this.list.childNodes.length - 1 - i : i;
                childNode = this.list.childNodes[ind];
                if (!childNode.getAttribute('dis')) {
                    this.highlight(ind, childNode);
                    break;
                }
            }
        }
        if (!wasVisible && isFunction(this.options.onShow)) this.options.onShow();
    },
    hide: function () {
        if (!isVisible(this.container)) return;
        hide(this.container);
        hide(this.shadow);
        if (isFunction(this.options.onHide)) this.options.onHide();
        this.highlight(-1);
        if (isFunction(this.options.onItemActive)) this.options.onItemActive();
    },
    // Extended methods
    handleKeyEvent: function (e) {
        if (!isVisible(this.container)) {
            return true;
        }
        switch (e.keyCode) {
            case KEY.UP:
                this.movePosition(-1)
                return cancelEvent(e);
                break;
            case KEY.DOWN:
                this.movePosition(1);
                return cancelEvent(e);
                break;
            case KEY.TAB:
                this.hide();
                break;
            case KEY.RETURN:
                if (isFunction(this.options.onItemSelect) && this.active > -1) {
                    this.options.onItemSelect(this.selectedItem(), undefined, true);
                }
                cancelEvent(e);
                return false;
                break;
            case KEY.ESC:
                this.hide();
                return false;
                break;
            case KEY.PAGEUP:
            case KEY.PAGEDOWN:
                // deprecated
                return false;
                break;
        }
        return true;
    },
    clear: function () {
        this.highlight(-1);
        this.list.innerHTML = '';
        this.updateContainer();
    },
    destroy: function () {
        this.clear();
        Select.destroy(this.uid);
    },
    selectedItem: function () {
        if (this.active >= 0) {
            var el = this.list.childNodes[this.active];
            var value = el.getAttribute('val') || el.innerHTML;
            return value;
        }
        return undefined;
    },
    movePosition: function (step) {
        var selected = intval(this.active) + intval(step);
        if (selected < 0)
            this.container.scrollTop = 0;
        else if (selected + 1 > this.list.childNodes.length)
            this.container.scrollTop = this.list.offsetTop + this.list.offsetHeight - this.container.offsetHeight;
        while (1) {
            if (selected + 1 > this.list.childNodes.length || selected < 0) {
                if (this.options.cycle) break;
                else return false;
            }
            var s = this.list.childNodes[selected];
            if (s && !s.getAttribute('dis')) {
                break;
            }
            selected++;
        }
        this.highlight(selected, this.list.childNodes[selected]);
        return true;
    },
    highlight: function (i, el) {
        if (this.active != -1) {
            removeClass(this.list.childNodes[this.active], this.CSS.ACTIVE);
        }
        if (!el) {
            this.active = -1;
            return;
        }
        this.active = i;
        addClass(el, this.CSS.ACTIVE);
        if (isFunction(this.options.onItemActive)) {
            this.options.onItemActive(el.getAttribute('val') || el.innerHTML);
        }
        if (el.offsetTop + el.offsetHeight + this.list.offsetTop > this.container.offsetHeight + this.container.scrollTop - 1) {
            this.container.scrollTop = el.offsetTop + this.list.offsetTop + el.offsetHeight - this.container.offsetHeight + 1;
        } else if (el.offsetTop + this.list.offsetTop < this.container.scrollTop) {
            this.container.scrollTop = el.offsetTop + this.list.offsetTop;
        }
    },
    onMouseMove: function (i, el) {
        if (hasClass(el, 'active')) return false;
        this.highlight(i, el);
        return true;
    },
    onMouseDown: function (i, el) {
        var val = el.getAttribute('val') || el.innerHTML;
        if (isFunction(this.options.onItemSelect)) {
            this.options.onItemSelect(val, undefined, true);
        }
        this.hide();
    },
    updateContainer: function () {
        if (this.maxHeight < this.list.offsetHeight) {
            this.container.style.height = this.maxHeight + 'px';
            show(this.shadow);
            this.shadow.style.marginTop = (this.maxHeight + 1) + 'px'; // +1 - because of border-bottom
            addClass(this.container, this.CSS.SCROLLABLE);
        } else {
            removeClass(this.container, this.CSS.SCROLLABLE);
            this.container.style.height = 'auto';
            var shadow_height = intval(this.list.offsetHeight) + intval(this.list.offsetTop);
            if (shadow_height) {
                show(this.shadow);
                this.shadow.style.marginTop = shadow_height + 'px';
            } else {
                hide(this.shadow);
            }
        }
    },
    content: function (items) {
        var html = [],
            i, it, v, t, d, a, ind,
            len = items.length;
        for (i = 0; i < len; ++i) {
            // value, text, disabled, attributes, index
            it = items[i];
            v = it[0];
            t = it[1];
            d = it[2];
            ind = this.uid + ', ' + i;
            v = (v === undefined) ? '' : v.toString();
            t = ((t === undefined) ? '' : t.toString()) || v;
            html.push(
                '<li ', !d ? 'onmousemove="Select.itemMouseMove(' + ind + ', this)" onmousedown="Select.itemMouseDown(' + ind + ', this)"' : 'dis="1"',
                ' val="',
                v.replace(/&/g, '&amp;').replace(/"/g, '&quot;'),
                '" class="', (d ? 'disabled ' : ''), ((i == len - 1) ? (this.CSS.LAST + ' ') : ''), (i ? '' : this.CSS.FIRST) + '">',
                t,
                '</li>'
            );
        }
        this.list.innerHTML = html.join('');
        this.updateContainer();
        return true;
    },
    removeItem: function (value) {
        var undefined, l = this.list.childNodes,
            len = l.length;
        if (value === undefined) return;
        for (var i = 0; i < len; ++i) {
            var node = l[i];
            if (node.getAttribute('val') != value && node.innerHTML != value) continue;
            node.setAttribute('dis', '1');
            hide(node);
            break;
        }
        for (var i = 0; i < len; ++i) {
            if (isVisible(l[i])) {
                addClass(l[i], this.CSS.FIRST);
                break;
            }
        }
        for (var i = len; i > 0; --i) {
            if (isVisible(l[i - 1])) {
                addClass(l[i - 1], this.CSS.LAST);
                break;
            }
        }
        this.updateContainer();
    },
    // AntanubiS - if list.offsetHeight is greater, than screen without scrollbar - bugs.
    performShow: function () {
        this.list.style.position = 'absolute';
        this.list.style.visibility = 'hidden';
        show(this.container); // We see bug in MessageBox with Selector between theese lines.
        show(this.shadow);
        this.updateContainer();
        this.list.style.position = 'relative';
        this.list.style.visibility = 'visible';
    },
    // Shortcuts
    isVisible: function () {
        return isVisible(this.container);
    },
    hasItems: function () {
        return this.list.childNodes.length > 0;
    },
    toggle: function () {
        if (this.isVisible(this.container)) {
            this.hide();
        } else {
            this.show();
        }
    }
});