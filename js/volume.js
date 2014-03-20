if(!window.jt) jt = {};
jt['Volume'] = '1.0.0';

createUiClass('Volume', {
    defaultOptions: {
        width:65,
        volume:0.5,
        className:'',
        hintFixed:true,
        hintHideAnim: true,
        onMove:function(){},
        onChange:function(){}
    },
    beforeInit: function(){
        this.guid = _ui.reg(this);
    },
    initOptions: function(el, options){
        this.options = extend({}, this.defaultOptions, options);
        this.options.className = this.options.className == '' ? '' : ' '+this.options.className;
    },
    init: function(el, options){

    },
    initDOM: function(el){
        el = ge(el);
        if(!el) return false;

        this.container = ce('div', {
            innerHTML: '\
            <div class="slider_bg_line"></div>\
            <div class="slider_preload_line" style="width:100%"></div>\
            <div class="slider_progress_line" style="width:'+(this.options.volume*100)+'%">\
                <div class="slider_point"></div>\
            </div>',
            className: 'slider' + this.options.className,
            id:el.id
        }, {
            width:this.options.width+'px'
        });

        el.parentNode.replaceChild(this.container, el);

        this.progress = geByClass1('slider_progress_line', this.container, 'div');
        this.hint = ce('div', {
            className:'slider_hint',
            innerHTML:'\
                <div class="slider_hint_value"></div>\
                <div class="slider_hint_footer"></div>'
        }, {
            position: this.options.hintFixed ? 'fixed' : 'absolute',
            display: 'none',
            zIndex:150
        });
        document.body.appendChild(this.hint);

        this.hint_value = geByClass1('slider_hint_value', this.hint, 'div');
        this.hint_footer = geByClass1('slider_hint_footer', this.hint, 'div');

    },
    initEvents: function(){
        var self = this, down = false, x = 0;

        addEvent(this.container, 'mouseover mouseout', function(e){
            e.type == 'mouseover' ? addClass(this, 'over') : removeClass(this, 'over');
        });

        addEvent(this.container, 'mousedown', function(e){
            down = true;
            x = getMouseOffset(e,self.container)[0];
            self.setVolumeX(x);
            self.setHint(x);
            show(self.hint);

            var move = function(e){
                if(!down) return;
                x = getMouseOffset(e,self.container)[0];
                if(x>self.options.width || x<0) return;
                self.setVolumeX(x);
                self.setHint(x);
                return cancelEvent(e);
            };
            var up = function(e){
                down = false;
                x = getMouseOffset(e,self.container)[0];
                x = x>self.options.width?self.options.width:x<0?0:x;
                self.setVolumeX(x);
                self.setHint(x);
                self.hideHint();
                self.options.onChange(self.volume);
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
    setVolumeX: function(x){
        var percent = x*100/this.options.width;
        percent = Math.ceil(percent>100 ? 100 : percent<0 ? 0 : percent);
        this.progress.style.width = percent + '%';
        this.volume = percent/100;
        this.options.onMove(this.volume);
    },
    setHint: function(x){
        var percent = x*100/this.options.width;
        this.hint_value.innerHTML = Math.ceil(percent>100 ? 100 : percent<0 ? 0 : percent).toString() + '%';
        var xy = getXY(this.progress);
        var hint_size = getSize(this.hint);
        this.hint.style.top = xy[1] - hint_size[1] - 10 + 'px';
        this.hint_footer.style.left = (hint_size[0]/2)-3 + 'px';
        this.hint.style.left = xy[0] - (hint_size[0]/2) + x + 'px';
    },
    setVolume: function(percent){
        this.progress.style.width = percent*100 + '%';
        this.volume = percent;
        this.options.onMove(this.volume);
        this.hintBling();
    },
    hintBling: function(){
        var x = this.progress.offsetWidth;
        this.setHint(x);
        show(this.hint);
        this.hideHint(true);
    },
    hideHint: function(anim){
        var self = this;
        anim = anim == undefined ? self.options.hintHideAnim : anim;
        if(anim){
            setTimeout(function(){
                fadeOut(self.hint, 300);
            }, 500);
        } else {
            hide(self.hint);
        }
    }
});