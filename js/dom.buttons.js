// Add Css


function createButton(el, onClick) {
    el = ge(el);
    if (!el || el.btnevents) return;
    var p = el.parentNode;

    if (hasClass(p, 'button_blue') || hasClass(p, 'button_gray')) {
        if (isFunction(onClick)) {
            el.onclick = onClick.pbind(el);
        }
        return;
    }
    var hover = false;
    addEvent(el, 'click mousedown mouseover mouseout', function(e) {
        if (hasClass(p, 'locked')) return;
        switch (e.type) {
            case 'click':
                if (!hover) return;
                el.className = 'button_hover';
                onClick(el);
                return cancelEvent(e);
                break;
            case 'mousedown':
                el.className = 'button_down';
                break;
            case 'mouseover':
                hover = true;
                el.className = 'button_hover';
                break;
            case 'mouseout':
                el.className = 'button';
                hover = false;
                break;
        }
    });
    el.btnevents = true;
}

function lockButton(el) {
    if(!(el = ge(el))) return;
    var btn = (el.tagName.toLowerCase() == 'button'),
        d = btn ? 2 : ((browser.msie6 || browser.msie7) ? 2 : 4),
        tEl = btn ? el : geByClass1('file_button_text', el);
    if(!btn && !hasClass(el, 'file_button') || buttonLocked(el)) return;
    var lock = ce('span', {
        className: 'button_lock'
    });
    el.parentNode.insertBefore(lock, el);
    el['old_width'] = el.style.width;
    el['old_height'] = el.style.height;
    var s = getSize(el.parentNode);
    setStyle(el, {
        width: s[0] - d,
        height: s[1] - d
    });
    if(browser.msie6 || browser.msie7) {
        tEl['old_html'] = tEl.innerHTML;
        tEl.innerHTML = '';
    } else {
        tEl.style.textIndent = '-9999px';
    }
}

function unlockButton(el) {
    if(!(el = ge(el))) return;
    var lock = geByClass1('button_lock', el.parentNode, 'span'),
        btn = (el.tagName.toLowerCase() == 'button'),
        tEl = btn ? el : geByClass1('file_button_text', el);
    if(!lock) return;
    el.parentNode.removeChild(lock);
    el.style.width = el['old_width'];
    el.style.height = el['old_height'];
    if(browser.msie6 || browser.msie7) tEl.innerHTML = tEl['old_html'];
    tEl.style.textIndent = '';
}

function buttonLocked(el) {
    if(!(el = ge(el))) return;
    return geByClass1('button_lock', el.parentNode, 'span') ? true : false;
}

function disableButton(el) {
    if(!(el = ge(el))) return;
    if(el['disstatus']) return;
    var btn = (el.tagName.toLowerCase() == 'button'),
        d = btn ? 2 : ((browser.msie6 || browser.msie7) ? 2 : 4);
    if(!btn && !hasClass(el, 'file_button')) return;
    var lock = ce('span', {
        className: 'button_disable'
    });
    el.parentNode.insertBefore(lock, el);
    el['old_width'] = el.style.width;
    el['old_height'] = el.style.height;
    el['disstatus'] = true;
    var s = getSize(el.parentNode);
    setStyle(lock, {
        width: s[0] - d,
        height: s[1] - d
    });
}

function enableButton(el) {
    if(!(el = ge(el))) return;
    el['disstatus'] = false;
    var lock = geByClass1('button_disable', el.parentNode, 'span');
    if(!lock) return;
    el.parentNode.removeChild(lock);
    el.style.width = el['old_width'];
    el.style.height = el['old_height'];
}

function toggleButton(el) {
    if(!(el = ge(el))) return;
    if(el['disstatus']) {
        enableButton(el);
    } else {
        disableButton(el);

    }
}