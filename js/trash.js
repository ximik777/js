cur = {};
function showTooltip(el, opts) {
    //if (!vk.loaded && !opts.noload) return;

    if (!el) return;
    if (!el.temphide) {
        el.temphide = function() {
            el.showing = false;
        }
        addEvent(el, 'mouseout', el.temphide);
    }
    el.showing = true;
    if (el.tt == 'loadingstat') return;

    if (!el.tt) {
        el.tt = 'loadingstat';
    }

    cur.cancelTooltip = false;

    //if (opts.stat) stManager.add(opts.stat);
    // stManager.add(['tooltips.js', 'tooltips.css'], function() {
    if (el.tt == 'loadingstat') el.tt = false;

    if (!el.showing || cur.cancelTooltip) return;
    //_cleanHide(el);

    if (!el.tt || !el.tt.el || opts.force) {
        tooltips.create(el, opts);
        if (opts.onCreate) opts.onCreate();
    }
    tooltips.show(el, opts);
    // });
}