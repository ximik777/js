function showTooltip(el, opts) {
    if (!el) return;
    if (!el.temphide) {
        el.temphide = function() {
            el.showing = false;
        };
        addEvent(el, 'mouseout', el.temphide);
    }
    el.showing = true;
    if (el.tt == 'loadingstat') return;

    if (!el.tt) {
        el.tt = 'loadingstat';
    }
    if(!window.cur) window.cur = {};
    cur.cancelTooltip = false;
    if (el.tt == 'loadingstat') el.tt = false;

    if (!el.showing || cur.cancelTooltip) return;

    if (!el.tt || !el.tt.el || opts.force) {
        tooltips.create(el, opts);
        if (opts.onCreate) opts.onCreate();
    }
    tooltips.show(el, opts);
}