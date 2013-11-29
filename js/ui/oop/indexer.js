createChildClass('Indexer', UiUtil, {
    defaultOptions: {
        chars: 2,
        delimeter: /[\s\(\)\.,\-]+/
    },
    componentName: 'Indexer',
    initOptions: function (data, options) {
        this.options = extend({}, this.defaultOptions, {
            indexkeys: [1]
        }, options);
    },
    init: function (data) {
        this.setData(data);
    },
    setData: function (data) {
        delete this.storage;
        this.storage = {
            data: clone(data),
            index: {}
        };
        clearTimeout(this.indexTimer);
        this.indexTimer = setTimeout(this.createIndex.bind(this), 10);
    },
    createIndex: function () {
        if (!this.storage.data.length) return;
        this.storage.index = {};
        debug('createIndex start, ' + this.storage.data.length + ' items');
        each(this.storage.data, this.indexItem.bind(this));
        debug('createIndex ended');
    },
    indexItem: function (k, v) {
        var i, j, current_words = '',
            index_key, already_indexed = {};
        for (i = 0; i < this.options.indexkeys.length; i++) {
            if (!v[this.options.indexkeys[i]]) continue;
            current_words += ' ' + v[this.options.indexkeys[i]].replace(this.options.delimeter, ' ').replace(/<[^>]*>/, '');
        }
        current_words = trim(winToUtf(current_words).toLowerCase()).split(/\s+/);
        for (i = 0; i < current_words.length; i++) {
            for (j = 1; j <= this.options.chars; j++) {
                index_key = current_words[i].substr(0, j);
                if (already_indexed[index_key]) {
                    continue;
                }
                already_indexed[index_key] = 1;
                if (this.storage.index[index_key] === undefined) this.storage.index[index_key] = [];
                this.storage.index[index_key].push(k);
            }
        }
    },
    search: function (pattern) {
        debug('search start, index width: ' + this.options.chars + ', data size: ' + this.storage.data.length);
        pattern = trim(pattern.toLowerCase().replace(this.options.delimeter, ' '));
        debug('pattern: ' + pattern + ', length: ' + pattern.length);
        var self = this;
        if (!pattern) {
            debug('empty pattern, return whole list');
            return self.storage.data;
        }
        if (pattern.length <= this.options.chars && pattern.indexOf(' ') == -1) {
            debug('found whole pattern indexed');
            var retArr = [];
            each((this.storage.index[pattern] || []), function () {
                retArr.push(self.storage.data[this]);
            });
            return retArr;
        }
        pattern = pattern.split(' ');
        var min_size = 0,
            min_pattern = '',
            self = this;
        each(pattern, function () {
            var items = self.storage.index[this.substr(0, self.options.chars)];
            if (!min_pattern || !items || items.length < min_size) {
                min_size = items ? items.length : 0;
                min_pattern = this.substr(0, self.options.chars);
            }
            return !min_size;
        });
        var ret_arr = [];
        debug('index returned: ' + min_size + ' items');
        if (!min_size) return ret_arr;
        debug('starting manual filter');
        each(self.storage.index[min_pattern.substr(0, self.options.chars)], function (k, v) {
            var item = self.storage.data[v];
            var i, fail = false,
                current_words = '',
                index_key;
            for (i = 0; i < self.options.indexkeys.length; i++) {
                current_words += ' ' + item[self.options.indexkeys[i]].replace(self.options.delimeter, ' ').replace('<b>', '').replace('</b>', '');
            }
            current_words = winToUtf(current_words).toLowerCase();
            for (i = 0; i < pattern.length; i++) {
                if (current_words.indexOf(' ' + pattern[i]) == -1) {
                    fail = true;
                    break;
                }
            }
            if (fail) return;
            ret_arr.push(item);
        });
        debug('manual filter ended, found ' + ret_arr.length + ' items');
        return ret_arr;
    },
    flush: function () {
        delete this.storage;
    }
});