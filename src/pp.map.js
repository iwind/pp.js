/**
 * <pre>pp.Map 对象。
 *通过该对象就能很方便地像Java那样操作Map结构的数据</pre>
 *
 * @class pp.Map
 */

/**
 * 构造器
 *
 * @constructor pp.Map
 * @param Object object 预加载值的集合，为可选参数，如 <code>{1:"<font color=green>元素1</font>",&nbsp;2:"<font color=green>元素2</font>"}</code>
 * @version 0.0.3
 */
pp.Map = function (object) {
    pp.mixIn(this, pp.Iterator);

    var inner = {};
    if (typeof(object) == "object") {
        inner = object;
    }

    /**
     * 将一个键、值对加入map中
     *
     * @method put
     * @param object key 键
     * @param object value 值
     * @return void
     */
    this.put = function (key, value) {
        inner[key] = value;
    };

    /**
     * 取得一个键对应的值
     *
     * @method get
     * @param object key 键
     * @return object
     */
    this.get = function (key) {
        if (J.defined(inner[key])) {
            return inner[key];
        }
        return null;
    };

    /**
     * 清空Map中所有元素
     *
     * @method clear
     */
    this.clear = function () {
        inner = {};
    };

    /**
     * 判断该Map是否为空
     *
     * @method isEmpty
     * @return boolean
     */
    this.isEmpty = function () {
        return (this.size() == 0)?true:false;
    };

    this.empty = function () {
        return this.isEmpty();
    };

    /**
     * 删除某键对应的元素
     *
     * @method remove
     * @param Object key 键
     */
    this.remove = function (key) {
        if (pp.fn.isDefined(inner[key])) {
            var _inner = {};
            for (var p in inner) {
                if (p != key) {
                    _inner[p] = inner[p];
                }
            }
            inner = _inner;
        }
    };

    /**
     * 删除值
     *
     * @param mixed value 要删除的值
     * @param boolean isStrict 是否严格对比，为可选参数，默认为false
     */
    this.removeValue = function (value, isStrict) {
        var keys = this.keys(value, isStrict);
        for (var i  = 0; i < keys.length; i ++) {
            this.remove(keys[i]);
        }
    };

    /**
     * 取得所有键的集合
     *
     * @method keySet
     * @param mixed value 要查找的值，为可选参数
     * @param boolean isStrict 是否严格对比，为可选参数，默认为false
     * @return pp.Array
     */
    this.keySet = function (value, isStrict) {
        if (!pp.fn.isDefined(isStrict)) {
            isStrict = false;
        }
        var set = new Array();
        for (var p in inner) {
            if (!pp.fn.isDefined(value)) {
                set.push(p);
            }
            else {
                if ((isStrict && value === inner[p]) || (!isStrict && value == inner[p])) {
                    set.push(p);
                }
            }
        }
        return new pp.Array(set);
    };

    this.keys = function (value, isStrict) {
        return this.keySet(value, isStrict);
    }

    /**
     * 将源Map中所有元素加入到当前Map中
     *
     * @method putAll
     * @param pp.Map sourceMap 源Map
     */
    this.putAll = function (sourceMap) {
        var set = sourceMap.keySet();
        for (var i=0; i<set.length; i++) {
            this.put(set[i], sourceMap.get(set[i]));
        }
    };

    /**
     * 计算Map中的元素数
     *
     * @method size
     * @return int
     */
    this.size = function () {
        return this.keySet().length();
    };

    this.length = function () {
        return this.size();
    };

    /**
     * 判断Map中是否含键key
     *
     * @method containsKey
     * @param Object key
     * @return boolean
     */
    this.containsKey = function (key) {
        var array = new pp.Array(this.keySet());
        return array.contains(key);
    };

    /**
     * 取得存储pp.Map元素的容器
     *
     * @method getContainer
     * @return object
     * @version 0.0.2
     */
    this.getContainer = function () {
        return inner;
    };


    /**
     * 将该对象转换成字符串
     *
     * @method toString
     * @return String
     * @version 0.1.1
     */
    this.toString = function () {
        return JSON.encode(inner);
    };

    /**
     * 取得当前Map中所有值的集合
     *
     * @method values
     * @return pp.Array
     * @version 0.4.0
     */
    this.values = function () {
        var array = new pp.Array();
        this.each(function (k, v) {
            array.push(v);
        });
        return array;
    };

    /**
     * 取得第一个元素的键、值对组成的pp.Entry对象
     *
     * @method shift
     * @return pp.Entry
     * @version 0.4.0
     */
    this.shift = function () {
        var keys = this.keys();
        var shiftKey = keys.shift();
        return new pp.Entry(shiftKey, this.get(shiftKey));
    };

    /**
     * 依据值对当前对象进行排序
     *
     * @method sort
     * @param function sortFunction 排序用的回调函数，为可选参数
     */
    this.sort = function (sortFunction) {
        var values = this.values();
        var keys = this.keys();
        var _keys = values.asort(sortFunction);
        var map = this;
        var _map = new pp.Map();
        _keys.each(function (k, v) {
            var key = keys.get(v);
            var value = map.get(key);
            _map.put(key, value);
        });
        inner = _map.getContainer();
    };

    /**
     * 反转当前对象中元素
     *
     * @method reverse
     * @version 0.4.0
     */
    this.reverse = function () {
        var keys = this.keys().reverse();
        var map = this;
        var _map = new pp.Map();
        keys.each(function (k, key) {
            var value = map.get(key);
            _map.put(key, value);
        });
        inner = _map.getContainer();
    };

    /**
     * 依据值对当前对象进行反排序
     *
     * @method rsort
     * @param function sortFunction 排序用的回调函数，为可选参数
     */
    this.rsort = function (sortFunction) {
        this.sort(sortFunction);
        this.reverse();
    };
};