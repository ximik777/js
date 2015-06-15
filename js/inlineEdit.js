var curInlineEdit = false;
if (!window.inlineOnEvent) {
    window.inlineOnEvent = function (e) {
        if (!curInlineEdit) return;
        if (e.type == 'mousedown') {
            var outside = true;
            var t = e.target;
            while (t && t != t.parentNode) {
                if (t == curInlineEdit.container) {
                    outside = false;
                    break;
                }
                t = t.parentNode;
            }
            if (!outside || !isVisible(curInlineEdit.container)) return;
            curInlineEdit.hide();
        }
        if (e.type == 'keydown') {
            if (!isVisible(curInlineEdit.container)) return;
            if (e.keyCode == KEY.ESC) curInlineEdit.hide();
            if (e.keyCode == KEY.RETURN) {
                if (!curInlineEdit.options.onConfirm || curInlineEdit.options.onConfirm.apply(curInlineEdit) !== false) curInlineEdit.hide();
            }
        }
    };
    addEvent(document, 'mousedown keydown', inlineOnEvent);
}
global_save = 'Save';
global_cancel = 'Cancel';

createChildClass('InlineEdit', UiControl, {
    common: {
        pageContainer: null
    },
    defaultOptions: {
        offsetLeft: -20 + (browser.msie7 ? 2 : (browser.opera || browser.msie ? 3 : (browser.safari || browser.chrome ? 0 : (browser.mozilla ? 2 : 0)))),
        offsetTop: -20 + (browser.msie7 ? 2 : (browser.opera || browser.msie ? 3 : (browser.safari || browser.chrome ? 1 : (browser.mozilla ? 3 : 0)))),
        top: 0,
        left: 0,
        width: 'auto',
        flex: false,
        mainTableHTML: '<tbody><tr><td class="inlFrame00"></td><td class="inlFrame01"><div></div></td><td class="inlFrame02"></td></tr>\
             <tr><td class="inlFrame10"></td><td class="inlContent">{content_table}</td><td class="inlFrame12"></td></tr>\
             <tr><td class="inlFrame20"></td><td class="inlFrame21"><div></div></td><td class="inlFrame22"></td></tr></tbody>',
        contentTableHTML: '<tbody>{content}\
             <tr>\
              <td class="inlButtonOk"><div class="button_blue button_wide"><button>{yeslabel}</button></div></td>\
              <td class="inlButtonCancel"><div class="button_gray button_wide"><button>{nolabel}</button></div></td>\
             </tr></tbody>',
        contentHTML: '<tr><td><input class="inlInput text" type="text" /></td></tr>',
        confirmLabel: getLang('global_save'),
        cancelLabel: getLang('global_cancel'),
        onBeforeShow: null,
        onShow: null,
        onHide: null,
        onConfirm: null,
        onCancel: null
    },
    controlName: 'InlineEdit',
    // Standart object methods
    beforeInit: function () {
        if (!this.common.pageContainer) {
            this.common.pageContainer = document.body;
            if (browser.msie6 && ge('pageContainer')) {
                this.pageContainer = ge('pageContainer');
            }
        }
        this.guid = _ui.reg(this);
    },
    initOptions: function (target, options) {
        if (!target) return false;
        this.options = extend({}, this.defaultOptions, options);
    },
    init: function (target) {
        this.target = target;
        addClass(this.target, 'inline_edit_target');
    },
    initDOM: function (target, options) {
        this.container = ce('div', {
            className: 'inlContainer',
            id: 'container' + this.guid,
            innerHTML: '<table class="inlMainTable">' + this.options.mainTableHTML.replace('{content_table}', '<table class="inlContentTable">' + this.options.contentTableHTML.replace('{content}', this.options.contentHTML).replace('{nolabel}', this.options.cancelLabel).replace('{yeslabel}', this.options.confirmLabel) + '</table>') + '</table>'
        });
        this.mainTable = geByClass('inlMainTable', this.container)[0];
        this.mainCell = geByClass('inlContent', this.mainTable)[0];
        this.contentTable = geByClass('inlContentTable', this.mainCell)[0];
        setStyle(this.contentTable, 'width', this.options.width);
        this.input = geByClass('inlInput', this.contentTable)[0];
        this.buttonOkCell = geByClass('inlButtonOk', this.contentTable)[0];
        this.buttonCancelCell = geByClass('inlButtonCancel', this.contentTable)[0];
        this.buttonOk = this.buttonOkCell.firstChild.firstChild;
        this.buttonCancel = this.buttonCancelCell.firstChild.firstChild;
        this.container.appendChild(this.mainTable);
        this.mainCell.appendChild(this.contentTable);
    },
    initEvents: function () {
        var self = this;
        createButton(this.buttonOk, function () {
            if (!self.options.onConfirm || self.options.onConfirm.apply(self) !== false) self.hide();
        });
        createButton(this.buttonCancel, function () {
            if (!self.options.onCancel || self.options.onCancel.apply(self) !== false) self.hide();
        });
        addEvent(this.target, 'click', function () {
            self.show();
            return false;
        });
        this.onEvent = function (e) {}
    },
    afterInit: function (target, options) {
        if (this.options.afterInit) {
            this.options.afterInit.apply(this);
        }
        var self = this;
        onDomReady(function () {
            self.common.pageContainer.appendChild(self.container);
        });
    },
    hide: function () {
        if (!isVisible(this.container)) return;
        hide(this.container);
        if (curInlineEdit == this) curInlineEdit = false;
        if (this.options.onHide) this.options.onHide.apply(this);
    },
    moveTo: function (left, top) {
        setStyle(this.container, {
            top: intval(top) + 'px',
            left: intval(left) + 'px'
        });
    },
    moveToTarget: function () {
        var tc = getXY(this.target);
        this.moveTo(tc[0] + this.options.offsetLeft + this.options.left, tc[1] + this.options.offsetTop + this.options.top);
    },
    setOptions: function (options) {
        var self = this;
        extend(this.options, options);
    },
    toggle: function () {
        this.visible ? this.hide(false) : this.show();
    },
    show: function () {
        if (isVisible(this.container)) return;
        this.moveToTarget();
        if (this.options.onBeforeShow) {
            this.options.onBeforeShow.apply(this);
        }
        show(this.container);
        if (curInlineEdit) curInlineEdit.hide();
        curInlineEdit = this;
        if (this.input) elfocus(this.input);
        if (this.options.onShow) {
            this.options.onShow.apply(this);
        }
    }
});