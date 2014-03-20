if(!window.jt) jt = {};
jt['slider'] = '1.0.0';

createChildClass('Slider', UiControl, {
    'defaultOptions': {
        width: '100%',
        height: 20,
        scroll: true,
        data: null,
        min: 0,
        max: 100,
        val: 0,
        show_points: 5,
        points_width: 6,
        cursor_width: 86,
        cursor_top: 0,
        disabled: false,
        disabled_options: null,
        value_area: true,
        value_area_prefix: '',
        onChange: function () {},
        onMove: function () {},
        afterInit: function () {},
        onMouseStart: function () {}
    },
    'initOptions': function (input, options) {
        var opts = this.options = extend({}, this.defaultOptions, options || {});
        this.data = isArray(this.options.data) ? this.options.data : null;
        this.value = this.options.val ? this.options.val : null;
        if (!this.data) {
            this.options.cursor_top = opts.show_points ? this.options.cursor_top : 0;
            if (opts.min >= opts.max) {
                return false;
            }
        }
        this.shift = -43; //(this.options.cursor_width/2)-(this.options.points_width/2);
        this.options.cursor_top = browser.msie || browser.opera ? this.options.cursor_top - 1 : this.options.cursor_top;
        this.disabled = this.options.disabled;
    },
    'init': function (input) {
        this.obj = (typeof input !== 'object') ? ge(input) : input;
    },
    'initEvents': function () {
        var self = this;
        addEvent(this.area, 'click', function (e) {
            if (e.target.className !== 'slider-points') return false;
            self.setCursorCoord(getMouseOffset(e)[0] - ((screen.width - document.body.clientWidth) / 2));
            self.onChange();
        });
        var shift_x = 0,
            p_d = 0,
            candrag = false;
        addEvent(this.cursor, 'mousedown', function (e) {
            if (e.which != 1) return;
            p_d = parseInt(this.style.left ? this.style.left : 0);
            shift_x = e.clientX - p_d;
            candrag = true;
            self.onMouseStart();
            addEvent(document, 'mousemove', function (e) {
                if (e.which != 1) return;
                if (candrag) {
                    self.setCursorCoord(e.clientX - shift_x + Math.abs(self.shift));
                    self.onMove();
                }
            });
            addEvent(document, 'mouseup', function (e) {
                self.setCursorCoord(e.clientX - shift_x + Math.abs(self.shift));
                self.onChange();
                candrag = false;
                removeEvent(document, 'mousemove');
                removeEvent(document, 'mouseup');
                removeEvent(document, 'dragstart');
                removeEvent(document.body, 'selectstart');
                //document.ondragstart = null;
                //document.body.onselectstart = null;
            });
            addEvent(document, 'dragstart', function () {
                return false;
            });
            addEvent(document.body, 'selectstart', function () {
                return false;
            });
            //document.ondragstart = function() { return false; };
            //document.body.onselectstart = function() { return false; };
            return false;
        });
        if (this.options.scroll == true) {
            addEvent(this.area, 'mousewheel', function (e) {
                var w = e.wheel ? 1 : -1;
                var it = indexOf(self.temp_arr, self.value);
                var set_p = self.temp_arr[it + w] == self.dmin ? self.dmin : self.temp_arr[it + w] == self.dmax ? self.dmax : self.temp_arr[it + w];
                self.setCursorValue(set_p);
                self.onChange();
                return cancelEvent(e);
            });
        }
    },
    'initDOM': function () {
        var opts = this.options,
            self = this;
        this.container = ce('div', {
            //'id': "slider" + this.guid,
            'id': '' + this.obj.id,
            'className': "slider",
            'innerHTML': '<div class="slider-area">\
                    <div class="slider-line" style="height:' + opts.height + 'px"></div>\
                    <div class="slider-points" style="height:' + opts.height + 'px; margin-top:-' + opts.height + 'px;"></div>\
                    <div class="slider-cursor" style="height:' + opts.height + 'px; margin-top:-' + (opts.height - opts.cursor_top) + 'px;">\
                        <div style="display: none;" class="slider-value"></div>\
                    </div>\
                </div>'
        }, {
            'width': opts.width == '100%' ? '100%' : opts.width + 'px'
        });
        self.obj.parentNode.replaceChild(this.container, self.obj);
        each({
            'area': 'slider-area',
            'line': 'slider-line',
            'points': 'slider-points',
            'cursor': 'slider-cursor',
            'value_area': 'slider-value'
        }, function (k, v) {
            self[k] = geByClass(v, self.container)[0];
        });
        if (opts.value_area) {
            this.value_area.style.display = '';
            this.area.style.height = '40px';
        }
        var po = self.points.offsetWidth;
        self.dmin = 0;
        self.dmax = 0;
        self.temp_arr = [];
        if (self.data) {
            self.dmin = Math.min.apply(null, self.data);
            self.dmax = Math.max.apply(null, self.data);
            self.temp_arr = self.data;
        } else {
            self.dmin = parseInt(opts.min, 10);
            self.dmax = parseInt(opts.max, 10);
            self.temp_arr = self.range(parseInt(opts.min, 10), parseInt(opts.max, 10));
        }
        self.p_arr = [];
        for (var i = 0; i < self.temp_arr.length; i++) {
            var p = Math.round(((po / (self.dmax - self.dmin)) * (self.temp_arr[i] - self.dmin)));
            if (i == 0) {
                self.p_arr[i] = {
                    'value': self.temp_arr[i],
                    'point': p,
                    'lborder': p,
                    'rborder': p
                };
            } else {
                self.p_arr[i] = {
                    'value': self.temp_arr[i],
                    'point': p,
                    'lborder': Math.round((self.p_arr[i - 1]['point'] + p) / 2),
                    'rborder': p
                };
                self.p_arr[i - 1]['rborder'] = Math.round((self.p_arr[i - 1]['point'] + p) / 2);
            }
        }
        self.Install();
    },
    'range': function (start, end) {
        var foo = [];
        for (var i = start; i <= end; i++)
            foo.push(i);
        return foo;
    },
    'step': function (min, max, step) {
        step = step - 1;
        var foo = [],
            t = Math.round(max / step),
            k = 0;
        for (var i = min; i <= max; i++) {
            if (i == k) {
                foo.push(k);
                k = k + t;
            }
        }
        foo.pop();
        foo.push(max);
        return foo;
    },
    'Install': function () {
        if (this.data) {
            this.createPoints(this.temp_arr);
        } else {
            if (this.options.show_points !== false) {
                this.createPoints(this.step(this.dmin, this.dmax, this.options.show_points));
            }
        }
        this.setCursorValue(this.options.val ? this.options.val : this.dmin);
    },
    'createPoints': function (arr) {
        var opts = this.options,
            self = this;
        var po = self.points.offsetWidth;
        var dmin = Math.min.apply(null, arr);
        var dmax = Math.max.apply(null, arr);
        if (arr.length == 1) {
            arr[0] = Math.round(this.dmax - ((this.dmax - this.dmin) / 2));
        }
        for (var i = 0; i < arr.length; i++) {
            var p = Math.round(((po / (dmax - dmin)) * (arr[i] - dmin)));
            if (arr.length == 1) {
                p = Math.round(po / 2);
            }
            var ops = ce('span', {
                'title': arr[i]
            }, {
                'left': p - (opts.points_width / 2) + 'px',
                'height': opts.height + 'px'
            });
            ops.point = arr[i];
            addEvent(ops, 'click', function (e) {
                self.setCursorValue(this.point);
                self.onChange();
            });
            self.points.appendChild(ops);
        }
    },
    'setCursorCoord': function (coord) {
        var cur;
        for (var i in this.p_arr) {
            if (this.p_arr[i]['lborder'] <= coord && coord <= this.p_arr[i]['rborder']) {
                cur = this.p_arr[i]['point'];
                this.value = this.p_arr[i]['value'];
            }
        }
        this.set(cur);
    },
    'setCursorValue': function (point) {
        var cur;
        for (var i in this.p_arr) {
            if (this.p_arr[i]['value'] == point) {
                cur = this.p_arr[i]['point'];
                this.value = this.p_arr[i]['value'];
            }
        }
        this.set(cur);
    },
    'set': function (cur) {
        cur = cur < this.shift ? this.shift : cur > this.line.offsetWidth + Math.abs(this.shift) ? this.line.offsetWidth + this.shift : cur + this.shift;
        this.cursor.style.left = cur + 'px';
    },
    'onChange': function () {
        if (this.old_value == this.value) return false;
        this.old_value = this.value;
        if (this.options.value_area) {
            this.value_area.innerHTML = this.value + ' ' + this.options.value_area_prefix;
        }
        return this.options.onChange(this.value, this.cursor);
    },
    'onMove': function () {
        if (this.options.value_area) {
            this.value_area.innerHTML = this.value + ' ' + this.options.value_area_prefix;
        }
        return this.options.onMove(this.value);
    },
    'setValue': function (x) {
        this.setCursorValue(x);
        if (this.options.value_area) {
            this.value_area.innerHTML = this.value + ' ' + this.options.value_area_prefix;
        }
    },
    'afterInit': function () {
        if (this.disabled === true) {
            this.disable(true);
        }
        if (this.options.value_area) {
            this.value_area.innerHTML = this.value + ' ' + this.options.value_area_prefix;
        }
        return this.options.afterInit(this.value, this.cursor);
    },
    'disable': function (status) {
        if (status === true) {
            if (!this.dis) {
                var area = this.area.currentStyle ? this.area.currentStyle : getComputedStyle(this.area);
                this.dis = ce('div', {
                    'className': 'disabled'
                }, {
                    'width': this.container.offsetWidth + 'px',
                    'height': this.container.offsetHeight + parseInt(area.marginBottom) + 'px',
                    'display': 'none',
                    'lineHeight': this.area.offsetHeight - 1 + 'px'
                });
                this.dis_opt();
                this.area.parentNode.insertBefore(this.dis, this.area);
            }
            this.disabled = true;
            show(this.dis);
        } else if (status === false) {
            if (this.dis) {
                hide(this.dis);
                this.disabled = false;
            }
        } else {
            return this.disabled;
        }
    },
    'dis_opt': function () {
        var opts = this.options;
        if (opts.disabled_options) {
            if (opts.disabled_options.attr) extend(this.dis, opts.disabled_options.attr);
            if (opts.disabled_options.style) setStyle(this.dis, opts.disabled_options.style);
        }
    },
    'dis_html': function (text) {
        if (!this.dis) {
            this.disable(true);
        }
        this.dis.innerHTML = '<div class="disabled-area">' + text + '</div>';
    },
    'onMouseStart': function () {
        return this.options.onMouseStart(this.value, this.cursor);
    }
});