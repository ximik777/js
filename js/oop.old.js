/* CLASS CONSTRUCTOR */
if (!window.vk) vk = {};
var UI_CONTROLS_DEBUG = false;
function debug(e) {
    if (!UI_CONTROLS_DEBUG) return;
    debugLog(e);
}

function inherit(child, parent) {
    var F = function () {};
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superclass = parent.prototype;
}


function createChildClass(className, parent, proto) {
    var code = 'function ' + className + ' (a, b, c, d) {\
    if (this == window || this.setInterval) return new ' + className + '(a, b, c, d);\
    this.__className = "' + className + '";\
    return this.__construct__(arguments);\
  };';
    if(window.execScript) {
        window.execScript(code);
    } else {
        window.eval(code);
    }
    var childClass = eval('(' + className + ')');
    inherit(childClass, parent);
    if(('common' in proto)) {
        extend(childClass, proto['common']);
        proto['common'] = childClass;
    }
    extend(childClass.prototype, proto);
}


function UiControl(args) {
    return this.__construct__(args);
}

extend(UiControl.prototype, {
    'CSS': {},
    'defaultOptions': null,
    'dom': {},
    '__controls': {},
    '__construct__': function (args) {
        this.guid = UiControl.WindowDispatcher.getUID();
        if(this.beforeInit) if(this.beforeInit.apply(this, args) === false) return false;
        if(this.initOptions) if(this.initOptions.apply(this, args) === false) return false;
        if(this.init) if(this.init.apply(this, args) === false) return false;
        if(this.initDOM) if(this.initDOM.apply(this, args) === false) return false;
        if(this.initEvents) this.initEvents.apply(this, args);
        if(this.afterInit) this.afterInit.apply(this, args);
        this.__controls[(this.controlName ? this.controlName : this.__className) + this.guid] = this;
        return this;
    },
    'beforeInit': null,
    'initOptions': null,
    'init': null,
    'initDOM': null,
    'initEvents': null,
    'afterInit': null
});


UiControl.WindowDispatcher = {
    _ui_current_uid: 1,
    _event_listeners: [],
    _initialized: false,
    _initialize: function () {
        if(this._initialized) return;
        this._initialized = true;
        var self = this;
        var handler = function (e) {
            var handlers = self._event_listeners[e.type];
            if(!handlers) return;
            for(var i in handlers) {
                var el = handlers[i][0],
                    callback = handlers[i][1];
                if(!el || !el.parentNode || el.id && !ge(el.id)) {
                    handlers.splice(i, 1);
                }
                if(!isVisible(el)) {
                    continue;
                }
                if((e.type == 'click' || e.type == 'mousedown')) {
                    e.outside = true;
                    var t = e.target;
                    while(t != null) {
                        if(t == el) {
                            e.outside = false;
                            break;
                        }
                        t = t.parentNode;
                    }
                }
                if(callback(e) === false) // run handler
                    return;
            }
        };
        addEvent(document, 'keypress keydown mousedown', handler);
    },
    getUID: function () {
        return this._ui_current_uid++;
    },
    attachListener: function (el, event, handler) {
        el = ge(el);
        if(!el || !isFunction(handler)) return false;

        this._initialize();
        if(!isArray(this._event_listeners[event])) this._event_listeners[event] = [];
        this._event_listeners[event].push([el, handler]);
        return true;
    }
};

function createUiClass(className, functions) {
    return createChildClass(className, UiControl, functions);
}
/* CLASS CONSTRUCTOR END */
