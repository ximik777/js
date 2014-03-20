if(!window.jt) jt = {};
jt['datepicker'] = '1.0.0';

datepicker_date_format = "{day} {month} {year}";
datepicker_month_format = "{month} {year}";
global_day_label = "День:";
global_year_label = "Год:";
global_month_label = "Месяц:";
events_fri = "Пт";
events_mon = "Пн";
events_sat = "Сб";
events_sun = "Вс";
events_thu = "Чт";
events_tue = "Вт";
events_wed = "Ср";
Month1 = "Январь";
Month10 = "Октябрь";
Month10_of = "Октября";
Month11 = "Ноябрь";
Month11_of = "Ноября";
Month12 = "Декабрь";
Month12_of = "Декабря";
Month1_of = "Января";
Month2 = "Февраль";
Month2_of = "Февраля";
Month3 = "Март";
Month3_of = "Марта";
Month4 = "Апрель";
Month4_of = "Апреля";
Month5 = "Май";
Month5_of = "Мая";
Month6 = "Июнь";
Month6_of = "Июня";
Month7 = "Июль";
Month7_of = "Июля";
Month8 = "Август";
Month8_of = "Августа";
Month9 = "Сентябрь";
Month9_of = "Сентября";
month10sm_of = "окт";
month10_of = "октября";
month11sm_of = "ноя";
month11_of = "ноября";
month12sm_of = "дек";
month12_of = "декабря";
month1sm_of = "янв";
month1_of = "января";
month2sm_of = "фев";
month2_of = "февраля";
month3sm_of = "мар";
month3_of = "марта";
month4sm_of = "апр";
month4_of = "апреля";
month5sm_of = "мая";
month5_of = "мая";
month6sm_of = "июн";
month6_of = "июня";
month7sm_of = "июл";
month7_of = "июля";
month8sm_of = "авг";
month8_of = "августа";
month9sm_of = "сен";
month9_of = "сентября";
(function () {
    var f = {
        mn: [],
        mnOf: [],
        mnOfSm: [],
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    };
    var a = getLang("datepicker_dateFormat");
    if (a === "dateFormat") {
        a = "{day} {month} {year}"
    }
    var d = getLang("datepicker_monthFormat");
    if (d === "monthFormat") {
        d = "{month} {year}"
    }
    var e = getLang("larr");
    if (e === "larr") {
        e = "&larr;"
    }
    var j = getLang("rarr");
    if (j === "rarr") {
        j = "&rarr;"
    }
    var b = ["d", "w", "m"];
    for (var g = 1; g < 13; g++) {
        f.mn.push(getLang("Month" + g));
        f.mnOf.push(getLang("Month" + g + "_of"));
        f.mnOfSm.push(getLang("month" + g + "_of"))
    }
    for (var g = 0; g < 7; g++) {
        var c = getLang("events_" + f.days[g]);
        if (c.substr(0, 6) != "events") {
            f.days[g] = c
        }
    }
    var h = [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (!window.cals) {
        window.cals = {
            list: {},
            getMonth: function (k, i, n, l) {
                if (cals.list[k]) {
                    cals.list[k].getMonth(i, n, false, l)
                }
                return false
            },
            getDay: function (k, l, i, n) {
                if (cals.list[k]) {
                    cals.list[k].getDay(l, i, n)
                }
                return false
            }
        }
    }
    window.Calendar = function (k) {
        var l = k.container;
        var i = Math.round(Math.random() * 1000000);
        if (!l) {
            return
        }
        var n = _ui.reg(this);
        cals.list[n] = this;
        l.innerHTML = "<div></div>";
        l = l.firstChild;
        var m = (b[k.mode] || k.mode || "d").toString().replace(/(this|next|prev)/, "");
        var u = k.hideNextMonth && true;
        var r = this.parseDay = function (v) {
            v = v.toString();
            return {
                y: parseInt(v.substr(0, 4), 10),
                m: parseInt(v.substr(4, 2), 10),
                d: parseInt(v.substr(6, 2), 10)
            }
        };
        var p = k.day || {
            d: -1,
            m: -1,
            y: -1
        };
        if (!p.m) {
            p = r(p)
        }
        var q = this;
        var t = k.addRows || "";
        var s = k.addRowsM || t;
        this.setDay = function (w, v, x) {
            p = v ? {
                d: w,
                m: v,
                y: x
            } : r(w);
            q.getMonth(p.m, p.y)
        };
        this.setMode = function (v) {
            m = (b[v] || v || "d").replace(/(this|next|prev)/, "");
            q.getMonth(p.m, p.y, true)
        };
        var o = function (x, v) {
            for (var w = 0; w < v.length; w++) {
                var x = x.childNodes[v[w]];
                if (!x) {
                    return null
                }
            }
            return x
        };
        this.getDay = k.getDay || function (w, v, x) {};
        this.getMonth = function (P, G, V, w) {
            var S = f.mn;
            var F = new Date(G, P - 1, 1);
            F.od = F.getDay();
            if (F.od == 0) {
                F.od = 7
            }
            var D = (m == "-1");
            var M = false;
            var A = "";
            var U = !D ? new Date() : new Date(3000, 1, 1);
            U = new Date(U.getFullYear(), U.getMonth(), (m === "m") ? 1 : U.getDate());
            var z = F.getFullYear();
            h[1] = (((z % 100 != 0) && (z % 4 == 0)) || (z % 400 == 0)) ? 29 : 28;
            var K = [];
            var H = [];
            var E = '<table class="%cls%" cols="%cols%" cellpadding="0" border="0" cellspacing="0"><tbody>%rows%</tbody></table>';
            var B;
            var v;
            switch (m) {
                case "m":
                    var N = (G == p.y) ? p.m : 0;
                    nextYear = G + 1;
                    lastYear = G - 1;
                    B = '<tr><td class="month_arr"><a class="arr left" onclick="return cals.getMonth(' + n + ",1," + lastYear + ');"></a></td><td align="center" class="month">' + G + '</td><td class="month_arr"><a class="arr right" onclick="return cals.getMonth(' + n + ",1," + nextYear + ');"></a></td></tr>';
                    K.push('<tr><td colspan="2">');
                    K.push(rs(E, {
                        cls: "cal_table_head",
                        cols: "3",
                        rows: B
                    }));
                    K.push("</td></tr><tr>");
                    for (var R = 1; R <= 12; R++) {
                        A = "";
                        if (R % 2 == 1) {
                            if (R > 1) {
                                K.push("</tr><tr>")
                            }
                            A = " day_left"
                        }
                        clDay = (R == N) ? "day sel" : "day";
                        X = new Date(G, R - 1, 1);
                        if (!k.pastActive && X < U || k.pastActive && X > U) {
                            clDay += " past_day"
                        }
                        if (X.getTime() == U.getTime()) {
                            clDay += " today"
                        }
                        K.push('<td class="' + clDay + A + '" style="width:50%" id="day' + R + "_" + i + '" onclick="return cals.getDay(' + n + ", 1, " + R + ", " + G + ');" onmouseover="addClass(this, \'hover\')"  onmouseout="removeClass(this, \'hover\')">' + S[R - 1] + "</td>")
                    }
                    K.push("</tr>");
                    H.push(rs(E, {
                        cls: "cal_table",
                        cols: "2",
                        rows: K.join("")
                    }));
                    if (!V) {
                        l.style.height = l.offsetHeight + "px"
                    }
                    val(l, H.join(""));
                    break;
                default:
                    var N = (G == p.y && P == p.m) ? p.d : 0;
                    if (P == 12) {
                        nextMonth = 1;
                        nextYear = G + 1
                    } else {
                        nextMonth = P + 1;
                        nextYear = G
                    } if (P == 1) {
                    lastMonth = 12;
                    lastYear = G - 1
                } else {
                    lastMonth = P - 1;
                    lastYear = G
                }
                    var W = d.replace("{month}", S[P - 1]).replace("{year}", G);
                    var Q = "cal_table" + (D ? " disabled" : "") + (w ? " unshown" : "");
                    var J = (m === "w") ? "this.parentNode" : "this";
                    var B = '<tr><td class="month_arr"><a class="arr left" onclick="return cals.getMonth(' + n + "," + lastMonth + "," + lastYear + ');"></a></td><td align="center" class="month"><a class="cal_month_sel" onclick="return cals.getMonth(' + n + "," + P + "," + G + ',1);">' + W + '</a></td><td class="month_arr"><a class="arr right" onclick="return cals.getMonth(' + n + "," + nextMonth + "," + nextYear + ');"></a></td></tr>';
                    var v = '<tr><td class="month_arr"><span class="arr left"></span></td><td align="center" class="month">' + W + '</td><td class="month_arr"><span class="arr right"></span></td></tr>';
                    K.push('<tr><td colspan="7">');
                    K.push(rs(E, {
                        cls: "cal_table_head",
                        cols: "3",
                        rows: D ? v : B
                    }));
                    K.push("</td></tr><tr>");
                    for (var L = 0; L < 7; L++) {
                        K.push('<td class="daysofweek">' + f.days[L] + "</td>")
                    }
                    K.push("</tr><tr>");
                    var O = [];
                    for (var R = 1; R <= 42; R++) {
                        var A = (R % 7 == 1) ? " day_left" : "";
                        var I = ((R - F.od >= 0) && (R - F.od < h[P - 1])) ? R - F.od + 1 : 0;
                        var X = new Date(G, P - 1, R - F.od + 1);
                        var T = I;
                        var C = 1;
                        if (m === "w") {
                            var T = R - F.od - R % 7 + 2;
                            if (R % 7 == 0) {
                                T -= 7
                            }
                            if (N) {
                                var C = 8 - (N + F.od - 1) % 7;
                                if (C == 8) {
                                    C = 1
                                }
                            }
                        }
                        clDay = A;
                        if (I >= N && I < N + C) {
                            clDay += " day sel"
                        } else {
                            clDay += " day"
                        } if (!k.pastActive && X < U || k.pastActive && X > U) {
                            clDay += " past_day"
                        }
                        if (X.getTime() == U.getTime()) {
                            clDay += " today"
                        }
                        if (I > 0) {
                            O[R] = T;
                            K.push('<td id="day' + I + "_" + i + '" class="' + clDay + '" onclick="return cals.getDay(' + n + ", " + T + ", " + P + ", " + G + ');" onmouseover="addClass(' + J + ", 'hover')\"  onmouseout=\"removeClass(" + J + ", 'hover')\">" + I + "</td>")
                        } else {
                            if (R != 36) {
                                if (!M) {
                                    if (m === "w") {
                                        O[R] = T
                                    }
                                    date = (R > 7 && !u) ? X.getDate() : "&nbsp";
                                    K.push('<td class="day no_month_day' + A + '">' + date + "</td>")
                                }
                            } else {
                                M = true
                            }
                        } if ((R % 7 == 0) && (R < 36)) {
                            K.push("</tr><tr>")
                        }
                    }
                    K.push("</tr>" + t);
                    H.push(rs(E, {
                        cls: Q,
                        cols: "7",
                        rows: K.join("")
                    }));
                    K = [];
                    U = new Date(U.getFullYear(), U.getMonth(), 1);
                    var N = (G == p.y) ? p.m : 0;
                    var Q = "cal_table" + (D ? " disabled" : "") + (w ? "" : " unshown");
                    B = '<tr><td class="month_arr"><a class="arr left" onclick="return cals.getMonth(' + n + "," + P + "," + (G - 1) + ',1);"></a></td><td align="center" class="month"><a class="cal_month_sel" onclick="return cals.getMonth(' + n + "," + P + "," + G + ');">' + G + '</a></td><td class="month_arr"><a class="arr right" onclick="return cals.getMonth(' + n + "," + P + "," + (G + 1) + ',1);"></a></td></tr>';
                    v = '<tr><td class="month_arr"><span class="arr left"></span></td><td align="center" class="month">' + G + '</td><td class="month_arr"><span class="arr right"></span></td></tr>';
                    K.push('<tr><td colspan="2">');
                    K.push(rs(E, {
                        cls: "cal_table_head",
                        cols: "3",
                        rows: D ? v : B
                    }));
                    K.push("</td></tr><tr>");
                    for (var R = 1; R <= 12; R++) {
                        A = "";
                        if (R % 2 == 1) {
                            if (R > 1) {
                                K.push("</tr><tr>")
                            }
                            A = " day_left"
                        }
                        clDay = (R == N) ? "day sel" : "day";
                        X = new Date(G, R - 1, 1);
                        if (!k.pastActive && X < U || k.pastActive && X > U) {
                            clDay += " past_day"
                        }
                        if (X.getTime() == U.getTime()) {
                            clDay += " today"
                        }
                        K.push('<td class="' + clDay + A + '" style="width:50%" id="day' + R + "_" + i + '" onclick="return cals.getMonth(' + n + ", " + R + ", " + G + ');" onmouseover="addClass(this, \'hover\')"  onmouseout="removeClass(this, \'hover\')">' + S[R - 1] + "</td>")
                    }
                    K.push("</tr>" + s);
                    H.push(rs(E, {
                        cls: Q,
                        cols: "2",
                        rows: K.join("")
                    }));
                    val(l, H.join(""));
                    if (browser.opera && !browser.mobile) {
                        animate(l, {
                            opacity: 0.99
                        }, 20, animate.pbind(l, {
                            opacity: 1
                        }, 20))
                    }
                    break
            }
        };
        this.getMonth(p.m, p.y)
    };
    window.Datepicker = function (l, t) {
        l = ge(l);
        if (!l) {
            return
        }
        var v = {};
        var o = false;
        var P = this;
        var D;
        var r = false;
        var x = 0;
        var L = 0;
        var F = l.id;
        var I = F + "_date_input";
        var J = l.name || F;
        var G = l.parentNode;
        var N = F + "_cal_box";
        var Q = F + "_cal_div";
        var M = F + "_cal_frame";
        var B = {
            mode: "d",
            resfmt: "ts",
            width: 145,
            addRows: "",
            noPast: false,
            pastActive: false,
            onUpdate: function (p, n) {}
        };
        t = extend({}, B, t);
        var E = t.mode;
        var H = t.onUpdate;
        var D = t.width;
        var k = t.resfmt;
        var z = t.addRows;
        var s = t.addRowsM || z;
        var u = function (m) {
            if (E === "h") {
                return false
            }
            if (r) {
                P.hide()
            } else {
                R()
            }
            ge(I).blur();
            return false
        };
        var R = function () {
            if (r) {
                return
            }
            r = true;
            _ui.sel(P.guid);
            show(N);
            new Calendar({
                container: ge(Q),
                day: v,
                mode: E,
                addRows: z,
                addRowsM: s,
                hideNextMonth: true,
                pastActive: t.pastActive,
                getDay: function (p, n, w) {
                    q({
                        d: p,
                        m: n,
                        y: w
                    }, E)
                }
            });
            var m = getSize(ge(Q));
            setStyle(ge(M), {
                width: m[0],
                height: m[1]
            });
            ge(I).focus()
        };
        var q = function (n, w, p) {
            if (!p && t.noPast) {
                if (new Date(n.y, n.m - 1, n.d, 23, 59) < new Date()) {
                    return
                }
            }
            v = n;
            var m = geByClass1("datepicker_control", A);
            if (w === "h") {
                addClass(m, "disabled")
            } else {
                removeClass(m, "disabled");
                if (w === "m") {
                    ge(I).value = d.replace("{month}", winToUtf(f.mn[n.m - 1])).replace("{year}", n.y)
                } else {
                    ge(I).value = a.replace("{day}", n.d).replace("{month}", winToUtf(f.mnOf[n.m - 1])).replace("{year}", n.y)
                }
            }
            P.hide();
            if (k === "plain") {
                ge(F).value = n.d + "." + n.m + "." + n.y + (t.time ? (" " + x + ":" + L) : "")
            } else {
                if (k === "ts") {
                    ge(F).value = Math.floor(new Date(n.y, n.m - 1, n.d, x, L).getTime() / 1000) - ((new Date()).getTimezoneOffset() + 240) * 60 - intval(vk.dt)
                }
            } if (!p) {
                H(n, w)
            }
        };
        this.hide = function () {
            if (!r) {
                return
            }
            r = false;
            _ui.sel(false);
            hide(N)
        };
        this.setMode = function (n) {
            E = n;
            q(v, E)
        };
        this.setDate = function (n, p, m) {
            if (!n && !p && !m) {
                var w = new Date();
                if (E != "m") {
                    v.d = w.getDate()
                }
                v.m = w.getMonth() + 1;
                v.y = w.getFullYear()
            } else {
                if (E != "m") {
                    v.d = m
                }
                v.m = p;
                v.y = n
            }
            q(v, E)
        };
        var O = 0,
            K;
        if (t.day || t.month || t.year) {
            if (E != "m") {
                v.d = t.day
            }
            v.m = t.month;
            v.y = t.year;
            if (t.time) {
                x = t.hour || 0;
                L = t.min || 0
            }
        } else {
            if (K = (l.value || "").match(/(\d+)\.(\d+)(?:\.(\d+))?(?:\s+(\d+)\:(\d+))?/)) {
                if (E != "m") {
                    v.d = intval(K[3].length ? K[1] : 0)
                }
                v.m = intval(K[3].length ? K[2] : K[1]);
                v.y = intval(K[3].length ? K[3] : K[2]);
                if (t.time) {
                    x = K[4] || 0;
                    L = K[5] || 0
                }
            } else {
                if (parseInt(l.value)) {
                    var i = parseInt(l.value) + ((new Date()).getTimezoneOffset() + 240) * 60 + intval(vk.dt);
                    O = new Date(i * 1000)
                } else {
                    O = new Date()
                }
            }
        } if (O) {
            v.d = O.getDate();
            v.m = O.getMonth() + 1;
            v.y = O.getFullYear();
            x = O.getHours();
            L = O.getMinutes()
        }
        var C = '<input type="hidden" name="' + J + '" id="' + F + '"/><div class="datepicker_control"><input readonly="1" style="width:' + (D - 25) + 'px;" type="text" class="datepicker_text" id="' + I + '"/></div><div id="' + N + '" class="cal_box"><iframe id="' + M + '" class="cal_frame"></iframe><div id="' + Q + '" class="cal_div"></div></div>';
        var A = ce("div", {
            id: F + "_datepicker_container",
            className: "datepicker_container",
            innerHTML: C
        }, {
            width: D
        });
        G.replaceChild(A, l);
        addEvent(geByClass1("datepicker_control", A), "mousedown", u);
        q(v, E, true);
        P.guid = _ui.reg({
            container: A,
            onEvent: function (p) {
                if (p.type === "mousedown") {
                    var n = true,
                        m = p.target;
                    while (m && m != m.parentNode) {
                        if (m == A) {
                            n = false;
                            break
                        }
                        m = m.parentNode
                    }
                    if (n) {
                        P.hide()
                    }
                }
            },
            _blur: function () {
                P.hide()
            }
        });
        if (t.time) {
            var y = ge(t.time);
            new Timepicker(y, {
                onUpdate: function (p, n) {
                    x = p;
                    L = n;
                    q(v, E)
                },
                resfmt: k,
                hour: x,
                min: L
            })
        }
        if (browser.mozilla) {
            hide(M)
        }
    };
    window.Timepicker = function (l, q) {
        l = ge(l);
        if (!l) {
            return
        }
        var A = l.id,
            C = l.name || "",
            y = l.value || "";
        var w = {
            onUpdate: function (n, i) {},
            time: 0,
            hour: 0,
            min: 0,
            resfmt: "ts",
            format: '{hour}<div class="fl_l" style="padding:5px 3px 0;"> : </div>{min}'
        };
        var B = extend({}, w, q);
        var z = l.parentNode;
        if (y) {
            B.time = y
        }
        if (B.time) {
            B.hour = Math.floor(B.time / 3600);
            B.min = Math.floor((B.time - B.hour * 3600) / 60)
        }
        var H = B.hour || 0;
        var D = B.min || 0;
        var k = B.resfmt;
        D = D - D % 5;
        var x = '<input type="hidden" name="' + C + '" id="' + A + '" value="' + y + '"/>' + B.format.replace("{hour}", '<div class="fl_l"><input type="hidden" id="' + A + '_hour_input" value="' + H + '"/></div>').replace("{min}", '<div class="fl_l"><input type="hidden" id="' + A + '_min_input" value="' + D + '"/></div>') + '<div class="results_container"><div class="result_list" style="display:none;"></div><div class="result_list_shadow"><div class="shadow1"></div><div class="shadow2"></div></div></div>';
        var t = ce("div", {
            id: A + "_timepicker_container",
            className: "timepicker_container",
            innerHTML: x
        });
        z.replaceChild(t, l);
        var E = function () {
            var i = s.val(),
                m = u.val();
            if (k === "plain") {
                ge(A).value = i + ":" + m
            } else {
                if (k === "ts") {
                    ge(A).value = i * 3600 + m * 60
                }
            }
            B.onUpdate(i, m)
        };
        var G = [],
            r = [];
        for (var F = 0; F < 24; F++) {
            G.push([F, F])
        }
        for (var F = 0; F < 60; F += 5) {
            r.push([F, F < 10 ? "0" + F.toString() : F])
        }
        var s = new Dropdown(ge(A + "_hour_input"), G, {
            width: 47,
            multiselect: false,
            onChange: E
        });
        var u = new Dropdown(ge(A + "_min_input"), r, {
            width: 47,
            multiselect: false,
            onChange: E
        })
    };
    window.Daypicker = function (l, m) {
        l = ge(l);
        if (!l) {
            return
        }
        var C = l.id,
            E = l.name || "",
            A = l.value || "";
        var t = {
            onUpdate: function (n, i, o) {},
            date: 0,
            year: 0,
            month: 0,
            day: 0,
            format: '{day}<div class="fl_l" style="padding:0 3px;">&nbsp;</div>{month}<div class="fl_l" style="padding:0 3px;">&nbsp;</div>{year}',
            width: 0
        };
        var D = extend({}, t, m);
        var B = l.parentNode;
        if (A) {
            D.date = A
        }
        if (D.date) {
            if (D.date < 30000000) {
                D.year = Math.floor(D.date / 10000);
                D.month = Math.floor((D.date - D.year * 10000) / 100);
                D.day = D.date - D.year * 10000 - D.month * 100
            } else {
                var J = new Date(D.date * 1000);
                D.year = J.getFullYear();
                D.month = J.getMonth();
                D.day = J.getDate()
            }
        }
        var z = '<div class="fl_l"><input type="hidden" name="' + E + '" id="' + C + '" value="' + A + '"/>' + D.format.replace("{year}", '<div class="fl_l"><input type="hidden" id="' + C + '_year_input" value="' + D.year + '"/></div>').replace("{month}", '<div class="fl_l"><input type="hidden" id="' + C + '_month_input" value="' + D.month + '"/></div>').replace("{day}", '<div class="fl_l"><input type="hidden" id="' + C + '_day_input" value="' + D.day + '"/></div>') + "</div>";
        var s = ce("div", {
            id: C + "_daypicker_container",
            className: "daypicker_container clear_fix",
            innerHTML: z
        });
        B.replaceChild(s, l);
        var k = function (v, p) {
            var w = (new Date(p ? p : 2004, v, 0)).getDate(),
                o = [
                    [0, getLang("global_day_label")]
                ];
            for (var n = 1; n <= w; n++) {
                o.push([n, n])
            }
            return o
        };
        var G = function () {
            var n = parseInt(r.val()),
                o = parseInt(y.val()),
                i = parseInt(I.val());
            ge(C).value = n * 10000 + o * 100 + i;
            I.setData(k(o, n));
            D.onUpdate(n, o, i)
        };
        var J = new Date(),
            F = [
                [0, getLang("global_year_label")]
            ],
            q = [
                [0, getLang("global_month_label")]
            ];
        for (var H = J.getFullYear(); H >= (D.startYear || 1800); H--) {
            F.push([H, H])
        }
        for (var H = 0; H < 12; H++) {
            q.push([H + 1, f.mnOf[H]])
        }
        var I = new Dropdown(ge(C + "_day_input"), k(D.month, D.year), {
            width: 58,
            onChange: G
        });
        var y = new Dropdown(ge(C + "_month_input"), q, {
            width: 95,
            onChange: G
        });
        var r = new Dropdown(ge(C + "_year_input"), F, {
            width: 60,
            onChange: G
        });
        if (D.width) {
            var x = getSize(s.firstChild)[0],
                J = D.width - x,
                u = getSize(y.container)[0];
            setStyle(y.container, {
                width: u + J
            })
        }
    }
})();