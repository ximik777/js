createUiClass('Slider', {
    defaultOptions: {
        width: 150,
        preload: false,
        slider: false,
        cursorDown: false,
        hintFixed: false,
        hintAttached: false,
        onError: function(){},
        onChange: function(){},
        onMove: function(){},
        onDown: function(){},
        hintValue: function(val, x){return val.toString() + '%';}
    },
    beforeInit: function(){
        this.guid = _ui.reg(this);
    },
    initOptions: function(id, options){
        this.options = extend({}, this.defaultOptions, options);
    },
    init: function(id){
        this.el = ge(id);
        if(!this.el) this.onError({});
        this.hintValue = null;
    },
    initDOM: function(){
        this.wrap = ce('div', {id: 'slider_'+this.guid, className:'slider', innerHTML:'\
                    <div class="slider_bg_line"></div>\
                    <div class="slider_preload_line" style="width: '+(this.options.preload ? '0' : '100')+'%"></div>\
                    <div class="slider_progress_line" style="width: 0%">\
                        <div class="slider_point"></div>\
                    </div>'}, {width:this.options.width});
        this.el.parentNode.replaceChild(this.wrap, this.el);

        if(this.options.slider){
            addClass(this.wrap, 'progress');
        }

        this.preload = geByClass1('slider_preload_line', this.wrap, 'div');
        this.progress = geByClass1('slider_progress_line', this.wrap, 'div');
        this.point = geByClass1('slider_point', this.wrap, 'div');

        this.hint = ce('div', {id: 'slider_hint_'+this.guid, className:'slider_hint', innerHTML:'\
                    <div class="slider_hint_value"></div>\
                    <div class="slider_hint_footer"></div>'}, {
            position: this.options.hintFixed ? 'fixed' : 'absolute',
            display: 'none'
        });
        document.body.appendChild(this.hint);

        this.hint_value = geByClass1('slider_hint_value', this.hint, 'div');
        this.hint_footer = geByClass1('slider_hint_footer', this.hint, 'div');
    },
    initEvents: function(){
        var self = this, opt = this.options;

        if(!this.options.cursorDown){
            addEvent(this.wrap, 'mouseover mouseout', function(e){
                if(self.down) return;

                if(e.type == 'mouseover'){


                    if(!opt.hintAttached){
                        var per = getSize(self.progress)[0];
                        self.setHint(per);
                    }

                    show(self.point);
                    show(self.hint);
                } else {

                    hide(self.point);
                    hide(self.hint);
                }
                return cancelEvent(e);
            });
        }

        if(this.options.hintAttached){
            addEvent(this.wrap, 'mousemove', function(e){
                if(self.down) return;
                var per = getMouseOffset(e,self.wrap)[0];
                self.setHint(per);
            });
        }
        addEvent(this.wrap, 'mousedown', function(e){
            self.down = true;
            var per = getMouseOffset(e,self.wrap)[0];
            self.setProgress(per);
            self.onDown(per);
            self.setHint(per);

            show(self.point);
            show(self.hint);

            var move = function(e){
                if(!self.down) return;
                var per = getMouseOffset(e,self.wrap)[0];
                self.setProgress(per);
                self.onMove(per);
                self.setHint(per);
                return cancelEvent(e);
            };
            var up = function(e){
                self.down = false;
                var per = getMouseOffset(e,self.wrap)[0];
                self.onChange(per);
                self.setHint(per);

                if(self.options.cursorDown){
                    hide(self.point);
                    hide(self.hint);
                }

                removeEvent(document, 'mousemove', move);
                removeEvent(document, 'dragstart', rf);
                removeEvent(document, 'selectstart', rf);
                removeEvent(document, 'mouseup', up);
            };
            var rf = function() {
                return false;
            };
            addEvent(document, 'mousemove', move);
            addEvent(document, 'dragstart', rf);
            addEvent(document, 'selectstart', rf);
            addEvent(document, 'mouseup', up);
            return cancelEvent(e);

        });
    },
    setHint: function(x){
        x = x < 0 ? 0 : x > this.options.width ? this.options.width : x;
        if(this.hintValue == x) return;
        this.hintValue = x;
        this.hint_value.innerHTML = this.options.hintValue(this.percent(x), x); //this.percent(x).toString();
        var xy = getXY(this.progress);
        var hint_size = getSize(this.hint);
        this.hint.style.top = xy[1] - hint_size[1] - 10 + 'px';
        this.hint_footer.style.left = (hint_size[0]/2)-3 + 'px';
        this.hint.style.left = xy[0] - (hint_size[0]/2) + x + 'px';
    },
    percent: function(x){
        var percent = x*100/this.options.width;
        return Math.ceil(percent>100 ? 100 : percent<0 ? 0 : percent);
    },
    setProgress: function(x){
        this.progress.style.width = this.percent(x).toString() + '%';
    },
    onChange: function(x){
        this.options.onChange(this.percent(x));
    },
    onMove: function(x){
        this.options.onMove(this.percent(x));
    },
    onDown: function(x){
        this.options.onDown(this.percent(x));
    },
    onError: function(error){
        this.options.onError(error);
    }
});