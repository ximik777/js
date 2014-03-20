if(!window.jt) jt = {};
jt['qsearch'] = '1.0.0';

if(lang) var lang = {};
lang['head-search'] = 'поиск';
lang['search-by-agrm'] = 'по номеру договора';

var qArr = [
    [0, 'по номеру договора',   'agrm',         'Здесь Вы можете ввести номер договора'],
    [1, 'по клиентам ф.и.о',    'clients_fio',  'Здесь Вы можете ввести имя клиента'],
    [2, 'по ip адресу',         'ip',           'Здесь Вы можете ввести ip адрес клиента'],
    [3, 'по ip адресу sw',      'ipsw',         'Здесь Вы можете ввести ip свича'],
    [4, 'по сотрудникам',       'employee',     'Здесь Вы можете ввести имя сотрудника']
];

var hints_url = '/hints.php';
var search_page = '/index.php?mod=search&act=gsearch';
var search_url = search_page + '&section={SECTION}&q={QUERY}&name=1';
hintsCache = {};
function initSearch(options) {
    var leftSide = (window.is_rtl) ? 'right' : 'left';
    var rightSide = (window.is_rtl) ? 'left' : 'right';
    var km = false;
    options = extend({
        elemID: 'gsearch',
        value: '',
        linkURL: 'javascript:',
        searchWidth: 715,
        menuWidth: 150,
        menuShadow: true,
        animation: true,
        searchstate: 0,
        animationDelay: 200,
        downShift: 28,
        hideMenuDelay: 500,
        showPopularHints: true,
        showSearchInput: false,
        showSearchButton: false,
        searchButton: {
            title: getLang('head-search'),
            width: 65,
            onclick: 'globalSearch()'
        }
    }, options);
    var searchFunc = function (inputStr, array, key, showCount, caseSensitive, lat, startWords) {
        var arrayLength = array.length,
            resultArray = [],
            k = 0,
            regAdd = startWords ? '^' : '';
        inputStr = inputStr.replace(/с/gi, 'Ґ');
        var searchRegExp = new RegExp(regAdd + inputStr, caseSensitive ? 'gi' : 'g'),
            replaceStr = '';
        var searchLatRegExp = new RegExp(regAdd + parseLatin(inputStr.toLowerCase()), caseSensitive ? 'gi' : 'g');
        var rusLat = parseLatin(inputStr.toLowerCase(), true);
        var searchRusLatRegExp = new RegExp(regAdd + (rusLat ? rusLat : ''), caseSensitive ? 'gi' : 'g');
        var defaultEqual = function (regExp) {
            replaceStr = keyStr.replace(/с/gi, 'Ґ').replace(regExp, rChars);
            return (keyStr != replaceStr);
        };
        var startWordsEqual = function (regExp) {
            keyStr = keyStr.replace(/с/gi, 'Ґ').split(/\s/);
            replaceStr = [];
            each(keyStr, function (i, obj) {
                replaceStr.push(keyStr[i].replace(regExp, rChars))
            });
            replaceStr = replaceStr.join(' ');
            keyStr = keyStr.join(' ');
            var result = keyStr != replaceStr;
            if (!result) result = defaultEqual(regExp);
            return result;
        };
        for (var i = 0; i < arrayLength; i++) {
            var keyStr = array[i][key],
                rChars = '<span>$&</span>';
            var equalVal = startWords ? startWordsEqual(searchRegExp) : defaultEqual(searchRegExp);
            if (!equalVal && lat) equalVal = startWords ? startWordsEqual(searchLatRegExp) : defaultEqual(searchLatRegExp);
            if (!equalVal && lat && rusLat) equalVal = startWords ? startWordsEqual(searchRusLatRegExp) : defaultEqual(searchRusLatRegExp);
            if (equalVal) {
                if (k > showCount) break;
                resultArray[k] = clone(array[i]);
                resultArray[k][key] = replaceStr;
                k++;
            }
        }
        return resultArray;
    };
    var hintsAjax = false,
        inputVal = '',
        getHintsTimer = 0;

    var gotStartHints = function (text) {
        qsCurrItem = false;
        if (text.length && !opt.showSearchButton && !(window.is_rtl)) {
            var q = {
                width: 456,
                top: opt.downShift
            };
            q[rightSide] = opt.animation ? (browser.msie6 ? -1 : -2) : (browser.msie6 ? -1 : 0);
            setStyle(subMenu, q);
            var mnu = ge('subMenuContent');
            mnu.innerHTML = text;
            show(subMenu);
            show(sMenu);
        } else {
            hide(subMenu);
        }
        opt.searchstate = 1;
    };
    var getStartHints = function () {
        if (/\/((g|ad)search|translation)\.php(\?|$)/i.test(location.toString())) {
            //return;
        }
        if (hintsAjax) {
            hintsAjax.onDone = hintsAjax.onFail = false;
        }
        var val = '';
        hintsAjax = new Ajax();
        hintsAjax.onDone = function (obj, text) {
            var result = trim(text);
            hintsCache[val] = result;
            gotStartHints(result);
        };
        hintsAjax.post(hints_url, {act: 'a_start_hints'});
    };
    var setFocus = function (elem) {
        try {
            elem.focus();
        } catch (error) {}
    };
    var unFocusIE = function () {
        if (browser.msie) {
            document.selection.empty()
        }
    };
    var startSearch = function () {
        //var url = base_domain + 'index.php?mod=search&act=gsearch&section=' + menu[currNum].elem.section + '&q=' + trim(sInput.value) + '&name=1';
        var url = search_url.replace('{SECTION}', menu[currNum].elem.section).replace('{QUERY}', trim(sInput.value));
        window.location = url;
        return url;
    };
    this.startSearch = startSearch;
    var getNum = function (currNum, pos, count) {
        var k = currNum + pos;
        k = (k < 0) ? (count - 1) : (k > (count - 1)) ? 0 : k;
        return k
    };
    var opt = options,
        elem = ge(opt.elemID),
        placeHolder = elem.getAttribute('placeholder'),
        allowKeyUp = true,
        selectedMenu = parseInt(elem.getAttribute('selected')),
        open = elem.getAttribute('open'),
        par = elem.parentNode,
        sCont = ce('div', {id:'search_ext_cont'}),
        sMenu = ce('div', {id:'search_menu'}),
        subMenu = ce('div', {id:'search_sub_menu'}),
        self = this;
    if (open) {
        opt.showSearchButton = true;
        opt.showSearchInput = true;
    }
    var sButtonNode = '',
        sButton = null,
        sButtonWidth = opt.showSearchButton ? opt.searchButton.width : 0,
        curr = null,
        lastMenu = null,
        lastNum = 0,
        currNum = 0,
        showTooltip = false,
        subItemNum = -1,
        menu = [],
        subMenuItems = null,
        currSubMenu = null,
        startEvent = false,
        last = null,
        timer = null,
        subItemClassRegExp = /sub_item[a-z_]*/i;
    this.selMenu = function (section) {
        each(menu, function (i, obj) {
            if (section == menu[i].elem.section) selectMenu(menu[i].node, i, false);
        });
    };
    var selectMenu = function (elem, num, click) {
        if (click) {
            hide(sMenu);
            ge('search_menu').style.display = 'none';
        }
        ge('search_menu_header').innerHTML = elem.innerHTML;
        hide(subMenu);
        if (curr) {
            removeClass(curr, 'selected');
            removeClass(curr, 'selected_last');
        }
        curr = elem;
        qCur = menu[num].elem.idx;
        currNum = num;
        removeClass(sMenuA, 'hover');
        if (last && (curr == last)) curr.className = 'selected_last';
        else {
            addClass(curr, 'selected');
            if (last) {
                last.className = 'last';
            }
        }

        setFocus(sInput);
    };
    var menuItemOverOut = function (elem, num, i) {
        if (elem.className.indexOf('selected') != -1) {
            num = getNum(getNum(lastNum, i, menu.length), i, menu.length);
            elem = menu[num].node;
        }
        if (lastMenu) removeClass(lastMenu, 'hover');
        if (last && (elem == last)) elem.className = 'last hover';
        else elem.className = 'hover';
        lastMenu = elem;
        lastNum = num;
    };
    par.appendChild(sCont);
    setStyle(sMenu, 'width', opt.menuWidth);
    var replaceClass = function (elem, oldClass, newClass) {
        elem.className = elem.className.replace(oldClass, newClass);
    };
    var subItemOverOut = function (elem, currClass, nextClass) {
        replaceClass(elem, subItemClassRegExp, currClass);
        if (elem.nextSibling) replaceClass(elem.nextSibling, subItemClassRegExp, nextClass);
    };
    this.addItemContent = function (content, itemClass, over, num) {
        var subItem = ce('div', {className:'sub_item'});
        addClass(subItem, itemClass ? itemClass : '');
        subItem.innerHTML = content;
        if (over) {
            addEvent(subItem, 'mouseover', function () {
                if (currSubMenu) {
                    subItemOverOut(currSubMenu, 'sub_item', 'sub_item');
                }
                currSubMenu = this;
                if (num != undefined) {
                    subItemNum = num;
                }
                subItemOverOut(this, 'sub_item_over', 'sub_item_next_over');
            });
            addEvent(subItem, 'mouseout', function () {
                subItemOverOut(this, 'sub_item', 'sub_item')
            });
        }
        if (opt.menuShadow) ge('subMenuContent').appendChild(subItem);
        else subMenu.appendChild(subItem);
        return subItem;
    };
    this.clearSubMenu = function () {
        if (opt.menuShadow) ge('subMenuContent').innerHTML = '';
        else subMenu.innerHTML = ''
    };
    this.hideSubMenu = function () {
        hide(subMenu)
    };
    if (opt.showSearchButton) {
        var but = opt.searchButton,
            onclick = (typeof (but.onclick) == 'string') ? (' onclick="' + but.onclick + '; return false;"') : ' onclick="return cancelEvent(event);"',
            bStyle = ' style="width: ' + but.width + 'px"';
        sButtonNode = '<a href="' + opt.linkURL + '" id="search_button"' + onclick + bStyle + '>' + but.title + '</a>';
    }
    var sContHtml = '<div id="search_cont" style="width: ' + (opt.searchWidth) + 'px">';
    sContHtml += '<input type="text" id="search_input" style="width: ' + (opt.searchWidth - opt.menuWidth - sButtonWidth - 10) + 'px">';
    sContHtml += '<a href="' + opt.linkURL + '" id="search_a_menu"><span id="search_menu_header" style="width: ' + (opt.menuWidth - 22) + 'px"></span>';
    sContHtml += '<span id="search_darr"></span></a>' + sButtonNode + '</div>';
    sCont.innerHTML = sContHtml;
    var sInput = ge('search_input'),
        sMenuA = ge('search_a_menu'),
        sButton = ge('search_button');
    if (trim(opt.value) != '') sInput.value = opt.value;
    if (!opt.searchButton.onclick) addEvent(sButton, 'click', function (e) {
        if (trim(sInput.value) != '') startSearch();
        return cancelEvent(e);
    });
    if ((trim(elem.value) != trim(placeHolder)) && (trim(elem.value) != '')) {
        sInput.value = elem.value;
    }
    if (sButton) {
        if (isFunction(opt.searchButton.onclick)) {
            addEvent(sButton, 'click', function (e) {
                opt.searchButton.onclick();
                return cancelEvent(e);
            })
        }
    }
    sMenuA.appendChild(sMenu);
    ge('search_cont').appendChild(subMenu);
    if (opt.menuShadow) subMenu.innerHTML = '<div class="search_shadow_left"></div><div class="search_shadow_right"></div><div id="subMenuContent"></div><div class="search_shadow1" style="margin-top: 1px;"></div><div class="search_shadow2" style="margin-top: 2px;"></div>';
    var p = {
        width: opt.searchWidth - sButtonWidth,
        top: 20
    };
    p[rightSide] = opt.animation ? (browser.msie6 ? -1 : -2) : (browser.msie6 ? -1 : 0);
    setStyle(subMenu, p);
    var showSearch = function (e, noAnim) {

        window.dropDownToggle = true;
        if (startEvent && e) {
            return cancelEvent(e)
        }
        startEvent = true;
        lastNum = currNum;
        hide('topNav');
        addClass(sMenuA, 'hover');
        show(sCont);
        if (opt.animation && !opt.showSearchInput && !noAnim) {
            hide(sMenu);
            setStyle(sCont, {
                width: elem.offsetWidth
            });
            animate(sCont, {
                width: opt.searchWidth
            }, opt.animationDelay, function () {
                var p = {
                    overflow: 'visible'
                };
                p[rightSide] = browser.msie6 ? -1 : 1;
                clearTimeout(timer);
                setStyle(sCont, p);
                if (!window.currentStep || (window.currentStep == 2)) {
                    show(sMenu);
                }

                setFocus(sInput);
            });
        } else {
            var p = {
                overflow: 'visible'
            };
            p[rightSide] = -1;
            setStyle(sCont, p);
            if (!opt.showSearchInput) {
                if (window.currentStep == 2) {
                    show(sMenu);
                }
                setFocus(sInput);
            } else
                hide(sMenu);
        }
        getStartHints();
        addEvent(document.body, 'click', hideSearch);
        if (e) return cancelEvent(e);
    };
    hideSearch = function () {
        if (p_item_clicked) {
            return;
        }

        elem.value = placeHolder;
        setStyle(elem, {
            color: ''
        });
        if (window.vkIntro) tooltip.hide(true, 200);
        if (lastMenu) {
            removeClass(lastMenu, 'hover');
        }
        hide(subMenu);
        hide(sMenu);
        if (!isVisible(sCont) || opt.showSearchInput) {
            return true;
        }
        if (showTooltip) {
            showTooltip = false;
        }
        if (trim(sInput.value) != '') {
            return true;
        }
        if (opt.animation) {
            var p = {
                overflow: 'hidden'
            };
            p[rightSide] = 0;
            setTimeout(function () {
                hide(sMenu);
            }, 0);
            setStyle(sCont, p);
            animate(sCont, {
                width: elem.offsetWidth
            }, opt.animationDelay, function () {
                hide(sCont);
                show('topNav');
                if (window.vkIntro) tooltip.hide(true, 200);
                if (window.currentStep) currentStep--;
            });
        } else {
            show('topNav');
            hide(sCont);
        }
        startEvent = false;
        removeEvent(document.body, 'click', hideSearch);
    };
    addEvent(elem, 'click focus', showSearch);
    addEvent(sInput, 'keypress', function (e) {
        if (e.keyCode == KEY.TAB) {
            hideSearch()
        }
    });
    addEvent(sInput, 'click', function (e) {
        if (menu[currNum].elem.tooltip && (trim(sInput.value) == '') && !window.vkIntro) {
            self.clearSubMenu();
            var tooltip = self.addItemContent(menu[currNum].elem.tooltip);
            addEvent(tooltip, 'click', function (e) {
                showTooltip = false;
                hide(subMenu, sMenu);
                setFocus(sInput);
                return cancelEvent(e)
            });
            hide(sMenu);
            setStyle(subMenu, p);
            show(subMenu);
            showTooltip = true;
        }
        return cancelEvent(e);
    });
    if (opt.menuShadow) {
        sMenu.appendChild(ce('div', {className:'search_shadow_left'}));
        sMenu.appendChild(ce('div', {className:'search_shadow_right1'}));
        sMenu.appendChild(ce('div', {className:'search_shadow_right2'}));
    }
    each(opt.menuItems, function (i, obj) {
        var t = ce('div', {innerHTML:'<a href="' + opt.linkURL + '"><span>' + obj.title + '</span></a>'});
        sMenu.appendChild(t.firstChild);
        addEvent(sMenu.lastChild, 'click', function (e) {
            hideTooltip = false;
            selectMenu(this, i, true);
            return cancelEvent(e)
        });
        addEvent(sMenu.lastChild, 'mouseover', function (e) {
            if (lastMenu) removeClass(lastMenu, 'hover');
            lastMenu = this;
            lastNum = i;
            addClass(this, 'hover');
            clearTimeout(timer);
            return cancelEvent(e);
        });
        addEvent(sMenu.lastChild, 'mouseout', function (e) {
            removeClass(this, 'hover');
            return cancelEvent(e);
        });
        addEvent(sMenu.lastChild, 'dragstart', function (e) {
            return cancelEvent(e)
        });
        menu.push({
            elem: obj,
            node: sMenu.lastChild,
            ajaxLoad: false
        });
        if (obj.selected) {
            selectMenu(sMenu.lastChild, i, false);
        }
    });
    last = menu[menu.length - 1].node;
    if (!curr) selectMenu(menu[0].node, 0, false);
    var searchButtonFunc = function () {
        var fn = opt.searchButton.onclick;
        if (typeof (fn) == 'string') {
            try {
                window.eval(fn);
            } catch (e) {}
        } else if (isFunction(fn)) fn();
        else startSearch();
    };
    addEvent(document, 'keydown', function (e) {
        allowKeyUp = true;
        if (!isVisible(sCont) || !inArray(e.target, [sInput, sMenuA])) {
            allowKeyUp = false;
            return true
        }
        if ((e.keyCode == KEY.TAB) && (trim(sInput.value) == '') && !isVisible(subMenu)) {
            hideSearch();
            unFocusIE();
            allowKeyUp = false;
            return cancelEvent(e)
        }
        if (!isVisible(sMenu) && (!isVisible(subMenu) || showTooltip)) {
            if (e.keyCode == KEY.DOWN) {
                if (lastMenu) {
                    removeClass(lastMenu, 'hover');
                }
                hide(subMenu);
                show(sMenu);
                return cancelEvent(e)
            }
            if (e.keyCode == KEY.ESC) {
                hideSearch();
                return cancelEvent(e)
            }
        }
        if (isVisible(sMenu)) {
            if (e.keyCode == KEY.ESC) {
                lastNum = currNum;
                hideMenu();
                setFocus(sInput);
                return cancelEvent(e)
            } else if ((e.keyCode == KEY.ENTER) && hasClass(lastMenu, 'hover')) {
                selectMenu(lastMenu, lastNum, true);
                return cancelEvent(e);
            }
        }
        if (e.keyCode == KEY.ENTER) {
            allowKeyUp = false;
            if (isVisible(subMenu)) {
                if (qsCurrItem && km) {
                    window.location = qsCurrItem.firstChild.href;
                } else {
                    hide(subMenu);
                    if (opt.showSearchButton) {
                        searchButtonFunc();
                        return cancelEvent(e);
                    } else startSearch();
                }
            } else {
                if (opt.showSearchButton) {
                    searchButtonFunc();
                    return cancelEvent(e);
                } else startSearch();
            }
            return cancelEvent(e);
        }
        if ((e.keyCode == KEY.RIGHT || e.keyCode == KEY.TAB) && doGetCaretPosition(sInput) == sInput.value.length) {
            if (browser.opera && e.keyCode == KEY.TAB) return false;
            if (qsCurrItem && qsCurrItem.lastChild.getAttribute("class") == "autocompletion") {
                sInput.value = stripHTML(qsCurrItem.lastChild.innerHTML);
            } else {
                var mnu = opt.menuShadow ? ge('subMenuContent') : subMenu;
                if (location.pathname != search_page) {
                    if (mnu.lastChild && mnu.lastChild.lastChild && mnu.lastChild.lastChild.getAttribute("class") == "autocompletion") {
                        sInput.value = stripHTML(mnu.lastChild.lastChild.innerHTML);
                    }
                } else {
                    if (mnu.firstChild && mnu.firstChild.lastChild && mnu.firstChild.lastChild.getAttribute("class") == "autocompletion") {
                        sInput.value = stripHTML(mnu.firstChild.lastChild.innerHTML);
                    }
                }
            }
            return false;
        }
        var i = (e.keyCode == KEY.UP) ? -1 : ((e.keyCode == KEY.DOWN) ? 1 : 0);
        if (i && isVisible(subMenu) && !isVisible(sMenu)) {
            km = true;
            if (e.keyCode == KEY.UP) {
                if (qsCurrItem) {
                    if (qsCurrItem.previousSibling) {
                        qsOver(qsCurrItem.previousSibling);
                    } else {
                        qsOut(qsCurrItem);
                        qsCurrItem = false;
                    }
                } else {
                    var mnu = opt.menuShadow ? ge('subMenuContent') : subMenu;
                    if (mnu.lastChild) {
                        qsOver(mnu.lastChild);
                    }
                }
            } else {
                if (!qsCurrItem) {
                    var mnu = opt.menuShadow ? ge('subMenuContent') : subMenu;
                    if (mnu.firstChild) {
                        qsOver(mnu.firstChild);
                    }
                } else {
                    if (qsCurrItem.nextSibling) {
                        qsOver(qsCurrItem.nextSibling);
                    } else {
                        qsOut(qsCurrItem);
                        qsCurrItem = false;
                    }
                }
            }
            return cancelEvent(e);
        }
        if (i && isVisible(sMenu)) {
            var k = getNum(lastNum, i, menu.length);
            menuItemOverOut(menu[k].node, k, i);
            return cancelEvent(e)
        }
        qsOut(qsCurrItem);
        qsCurrItem = false;
        km = false;
    });
    var gotHints = function (text) {
        qsCurrItem = false;
        if (opt.startsearch != 0 && text.length) {
            var p = {
                width: opt.searchWidth - sButtonWidth,
                top: 20
            };
            p[rightSide] = opt.animation ? (browser.msie6 ? -1 : -2) : (browser.msie6 ? -1 : 0);
            setStyle(subMenu, p);
            var mnu = ge('subMenuContent');
            mnu.innerHTML = text;
            hide(sMenu);
            show(subMenu);
        } else {
            setStyle(subMenu, '');
            hide(subMenu);
        }
    };
    var getHints = function () {
        if (hintsAjax) {
            hintsAjax.onDone = hintsAjax.onFail = false;
        }
        var val = sInput.value;
        if (val != '') {
            hintsAjax = new Ajax();
            hintsAjax.onDone = function (obj, text) {
                var result = trim(text);
                hintsCache[val] = result;
                gotHints(result);
            };
            if (val[val.length - 1] == ' ') val[val.length - 1] = '_';
            hintsAjax.post(hints_url, {
                act: 'a_hints',
                q: val,
                section: menu[currNum].elem.section
            });
        } else hide(subMenu);
    };
    addEvent(document, 'keyup', function (e) {
        if (!allowKeyUp) return cancelEvent(e);
        var sVal = trim(sInput.value);
        if (!isVisible(sCont)) return true;
        if ((sVal.length != 0) && (e.keyCode != KEY.DOWN) && !isVisible(sMenu) && !isVisible(subMenu)) hide(sMenu, subMenu);
        if (e.keyCode != KEY.ESC && !window.vkIntro) {
            var sVal = sInput.value;
            if (sVal == inputVal) {
                return;
            }
            inputVal = sVal;
            showTooltip = false;
            if (/\/((g|ad)search|translation)\.php(\?|$)/i.test(location.toString())) {
                //        return;
            }
            if (inputVal.length > 1 && hintsCache[inputVal.substr(0, inputVal.length - 1)] === '') {
                hintsCache[inputVal] = '';
            }
            if (hintsCache[inputVal] !== undefined) {
                if (inputVal != '') {
                    gotHints(hintsCache[inputVal]);
                } else {
                    gotStartHints(hintsCache[inputVal]);
                }
            } else {
                clearTimeout(getHintsTimer);
                if (sVal.length == 1) {
                    getHints();
                } else {
                    getHintsTimer = setTimeout(getHints, 100);
                }
            }
        } else {
            hide(subMenu);
        }
    });
    if (opt.menuShadow) {
        sMenu.appendChild(ce('div', {className:'search_shadow1'}));
        sMenu.appendChild(ce('div', {className:'search_shadow2'}));
    }
    if (hasClass(last, 'selected')) last.className = 'selected_last';
    else last.className = 'last';
    if (menu.length > 1) {
        addEvent(sMenuA, 'click', function (e) {
            if (isVisible(sMenu)) {
                hideMenu(0);
            } else {
                hideTooltip = true;
                if (lastMenu) removeClass(lastMenu, 'hover');
                lastNum = currNum;
                hide(subMenu);
                show(sMenu);
                addClass(sMenuA, 'hover');

            }
            return cancelEvent(e);
        });
    } else {
        addClass(sMenuA, 'hover');
        setStyle(sMenuA, {
            cursor: 'default'
        });
        setStyle('search_darr', {
            cursor: 'default'
        });
    }
    var hideTooltip = true;
    var hideMenu = function (delay) {
        timer = setTimeout(function () { /*hide(sMenu);*/
            if (menu.length > 1) removeClass(sMenuA, 'hover');
            if (window.vkIntro && hideTooltip) tooltip.hide(true, 200);
        }, intval(delay) ? delay : opt.hideMenuDelay);
    };
    this.hideMenu = function () {
        hideMenu(0);
    };
    addEvent(sMenu, 'mouseout', hideMenu);
    addEvent(sInput, 'mouseout', hideMenu);
    if (opt.showSearchInput) showSearch(null, true);
    if (selectedMenu) each(menu, function (i, obj) {
        if (selectedMenu == menu[i].elem.num) selectMenu(menu[i].node, i, false);
    });
    if (window.showGSearch) showSearch();
}
var global_search, search_options;
var searchFunc = function () {
    search_options = extend({}, window.s_options ? s_options : {});
    var k = 0,
        gSearch = ge('gsearch'),
        selMenuNum = parseInt(gSearch ? gSearch.getAttribute('selected') : 0);
    search_options.menuItems = [];
    each(qArr, function (i, obj) {
        if (!obj.length) return;
        search_options.menuItems.push({
            idx: obj[0],
            title: obj[1],
            section: obj[2],
            tooltip: obj[3] ? obj[3] : null,
            ajax: obj[4] ? obj[4] : null,
            num: i,
            selected: obj[0] == selMenuNum
        });
    });
    global_search = new initSearch(search_options);
};
onDomReady(searchFunc);
/* ****** */
function iphoneSearch() {
    if (window.global_search) return global_search.startSearch();
}

function goToURL(url) {
    if (window.event && (window.event.which == 2 || window.event.button == 1)) {
        return true;
    }
    ge('search_form').action = url;
    window.location = url;
    return false;
}
var qsCurrItem = false;
var updateHintsTimer = 0;

function qsOver(el) {
    if (qsCurrItem) {
        qsOut(qsCurrItem);
    }
    replaceClass(el, 'sub_item', 'sub_item_over');
    if (el.nextSibling && el.nextSibling.className) {
        replaceClass(el.nextSibling, 'sub_item', 'sub_item_next_over');
    }
    qsCurrItem = el;
}

function qsOut(el) {
    if (!el || el != qsCurrItem) {
        return;
    }
    replaceClass(el, 'sub_item_over', 'sub_item');
    if (el.nextSibling && el.nextSibling.className) {
        replaceClass(el.nextSibling, 'sub_item_next_over', 'sub_item');
    }
    qsCurrItem = false;
}

var p_item_shown = 0;
var p_item_clicked = 0;
var p_item_out = 0;
var p_over_out = 0;

function showPOver(pi) {
    if (p_item_shown == pi) {
        return true;
    }
    var pio = ge('p_item_over');
    if (p_item_shown) {
        var p_item = ge('pi' + p_item_shown);
        p_item.className = p_item_shown < 10 ? 'p_item' : 'p_item_right';
        p_item_shown = 0;
    }
    var p_item = ge('pi' + pi);
    var pi_1 = ge('pi1');
    if (!pio.lastChild)
        pio.appendChild(p_item.cloneNode(true));
    else
        pio.replaceChild(p_item.cloneNode(true), pio.lastChild);
    pio.lastChild.style.border = 'none';
    if (pi < 10) {
        pio.style.width = '227px';
        pio.lastChild.className = 'p_item_over';
    } else {
        pio.lastChild.className = 'p_item_right_over';
        pio.style.width = '228px';
    }
    var tc = getXY(p_item);
    var tc1 = getXY(pi_1);
    var tx = tc[0] - tc1[0] - 1;
    var ty = tc[1] - tc1[1] + ge('recent_fr').offsetHeight;
    pio.style.display = "block";
    pio.style.left = tx + "px";
    pio.style.top = ty + "px";
    p_item_shown = pi;
}

function clickPOver() {
    ge('pi' + p_item_shown).onclick();
    p_item_clicked = 1;
}

function hidePOver() {
    var pio = ge('p_item_over');
    if (pio.lastChild) {
        pio.removeChild(pio.lastChild);
    }
    pio.style.display = "none";
    if (p_item_shown) {
        var p_item = ge('pi' + p_item_shown);
        p_item.className = p_item_shown < 10 ? 'p_item' : 'p_item_right';
        p_item_shown = 0;
    }
}