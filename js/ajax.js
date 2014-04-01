if(!window.jt) jt = {};
jt['ajax'] = '1.0.0';

function Ajax(onDone, onFail, eval_res) {
    var _t = this;
    this.onDone = onDone;
    var s = '';
    this.onFail = onFail;
    var tram = null;
    try {
        tram = new XMLHttpRequest();
    } catch (e) {
        tram = null;
    }
    if (!tram) {
        try {
            if (!tram) tram = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            tram = null;
        }
    }
    if (!tram) {
        try {
            if (!tram) tram = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {
            tram = null;
        }
    }
    var readystatechange = function (url, data) {
        if (tram.readyState == 4) {
            if (tram.status >= 200 && tram.status < 300) {
                if (eval_res) parseRes();
                if (_t.onDone) _t.onDone(extend(_t, {
                    url: url,
                    data: data
                }), tram.responseText);
            } else {
                _t.status = tram.status;
                _t.readyState = tram.readyState;
                if (_t.onFail) _t.onFail(extend(_t, {
                    url: url,
                    data: data
                }), tram.responseText);
            }
        }
    };
    var parseRes = function () {
        if (!tram || !tram.responseText) return;
        var res = tram.responseText.replace(/^[\s\n]+/g, '');
        if (res.substr(0, 10) == "<noscript>") {
            try {
                var arr = res.substr(10).split("</noscript>");
                eval(arr[0]);
                tram.responseText = arr[1];
            } catch (e) {
                console.log('eval ajax script:' + e.message);
            }
        } else {}
    };
    this.get = function (u, d, f) {
        tram.onreadystatechange = function () {
            readystatechange(u, d);
        };
        f = f || false;
        var q = (typeof (d) != 'string') ? ajx2q(d) : d;
        u = u + (q ? ('?' + q) : '');
        tram.open('GET', u, !f);
        tram.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        tram.send('');
    };
    this.post = function (u, d, f) {
        tram.onreadystatechange = function () {
            readystatechange(u, d);
        };
        f = f || false;
        var q = (typeof (d) != 'string') ? ajx2q(d) : d;
        try {
            tram.open('POST', u, !f);
        } catch (e) {
            console.log('ajax post error: ' + e.message);
        }
        tram.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        tram.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        tram.send(q);
    };
}

function ajx2q(qa) {
    var query = [],
        enc = function (str) {
            if (window._decodeEr && _decodeEr[str]) {
                return str;
            }
            try {
                return encodeURIComponent(str);
            } catch (e) {
                return str;
            }
        };
    for (var key in qa) {
        if (qa[key] == null || isFunction(qa[key])) continue;
        if (isArray(qa[key])) {
            for (var i = 0, c = 0, l = qa[key].length; i < l; ++i) {
                if (qa[key][i] == null || isFunction(qa[key][i])) {
                    continue;
                }
                query.push(enc(key) + '[' + c + ']=' + enc(qa[key][i]));
                ++c;
            }
        } else {
            query.push(enc(key) + '=' + enc(qa[key]));
        }
    }
    query.sort();
    return query.join('&');
}

function q2ajx(qa) {
    if (!qa) return {};
    var query = {}, dec = function (str) {
        try {
            return decodeURIComponent(str);
        } catch (e) {
            window._decodeEr = window._decodeEr || {};
            _decodeEr[str] = 1;
            return str;
        }
    };
    qa = qa.split('&');
    each(qa, function (i, a) {
        var t = a.split('=');
        if (t[0]) {
            var v = dec(t[1] + '');
            if (t[0].substr(t.length - 2) == '[]') {
                var k = dec(t[0].substr(0, t.length - 2));
                if (!query[k]) {
                    query[k] = [];
                }
                query[k].push(v);
            } else {
                query[dec(t[0])] = v;
            }
        }
    });
    return query;
}
(function () {
    var ajaxObjs = {};
    window.Ajax.Get = function (p) {
        var a = (p.key) ? ajaxObjs[p.key] : null;
        if (!a) {
            a = new Ajax(p.onDone, p.onFail, p.eval);
            if (p.key) ajaxObjs[p.key] = a;
        }
        a.get(p.url, p.query, p.sync);
    };
    window.Ajax.Post = function (p) {
        var a = (p.key) ? ajaxObjs[p.key] : null;
        if (!a) {
            a = new Ajax(p.onDone, p.onFail, p.eval);
            if (p.key) ajaxObjs[p.key] = a;
        }
        a.post(p.url, p.query, p.sync);
    };
    window.Ajax.Send = function (url, data, options) {
        var onSuccess, onFail, p;
        if (!options) options = {};
        if (isFunction(options)) {
            onSuccess = options;
        } else {
            onSuccess = options.onSuccess;
            onFail = options.onFail;
            onCaptchaShow = options.onCaptchaShow;
            onCaptchaHide = options.onCaptchaHide;
        }
        var done = function (o, t) {
            var r;
            try {
                r = eval('(' + t + ')');
                if (isFunction(onSuccess)) onSuccess(o, r);
            } catch (e) { // if captcha test passed
                if (options.json && r) t = r;
                else if (r && typeof (r.text) == 'string') t = r.text;
                if (isFunction(onSuccess)) onSuccess(o, t);
            }
        };
        var fail = function (o, t) {
            if (isFunction(onFail)) onFail(o, t);
        };
        p = {
            url: url,
            query: data,
            onFail: fail,
            onDone: done
        };
        Ajax.Post(p);
    }
})();

try{loadManager.done('ajax');}catch(e){}