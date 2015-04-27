(function ($) {
    var events = {};
    var isActivated = false;
    var isLoadingFiles = false;
    var pageFunctions = [];

    window.pp = function (fn) {
        if (pp.fn.isFunction(fn)) {
            isActivated = true;

            $(function () {
                var newFn = function () {
                    fn.apply(window.pp);

                    for (var prop in window.pp) {
                        if (!window.pp.hasOwnProperty(prop)) {
                            continue;
                        }
                        if (prop.toString().match(/^init/)) {
                            window.pp[prop].call(pp);
                        }
                    }

                    pp.activate($(document));
                };
                if (!isLoadingFiles) {
                    newFn.call();
                }
                else {
                    pageFunctions.push(newFn);
                }
            });
        }
    };

    pp.action = function (action) {
        return new pp.ActionObject(action);
    };

    pp.ActionObject = function (action) {
		var _action = action;
		var _url = null;
        var _params = {};
        var _target;
        var _timeout = 10;
        var _duration = 5;//poll专用
        var _beforeFn;
        var _doneFn;
        var _errorFn;
        var _self = this;
        var _method = null;

		this.url = function (url) {
			_url = url;
			return this;
		};

        this.param = function (name, value) {
            _params[name] = value;
            return this;
        };

        this.params = function (params) {
            _params = params;
            return this;
        };

        this.timeout = function (seconds) {
            _timeout = seconds;
            return this;
        };

        this.duration = function (seconds) {
            _duration = seconds;
            return this;
        };

        this.method = function (method) {
            if (typeof(method) == "string") {
                _method = method.toUpperCase();
            }

            return this;
        };

        this.target = function (target) {
            _target = target;
            return this;
        };

        this.before = function (fn) {
            _beforeFn = fn;
            return this;
        };

        this.done = function (fn) {
            _doneFn = fn;
            return this;
        };

        this.error = function (fn) {
            _errorFn = fn;
            return this;
        };

        this.post = function () {
            if (typeof(_beforeFn) == "function") {
                var before = _beforeFn.call(pp, this);
                if (typeof(before) == "boolean" && !before) {
                    return this;
                }
            }

			var url = _url;
			if (_url == null) {
				url = pp.url(_action);
			}

            $.ajax({
                "timeout": Math.ceil(_timeout * 1000),
                "type": "POST",
                "data": _params,
                "url": url,
                "dataType": "json",
                "success": function (response) {
                    if (typeof(_doneFn) == "function") {
                        _doneFn.call(pp, _self, response);
                    }
                },
                "error": function () {
                    if (typeof(_errorFn) == "function") {
                        _errorFn.call(pp, _self);
                    }
                }
            });

			return this;
        };

        this.get = function () {
            if (typeof(_beforeFn) == "function") {
                var before = _beforeFn.call(pp, this);
                if (typeof(before) == "boolean" && !before) {
                    return this;
                }
            }
			var url = _url;
			if (_url == null) {
				url = pp.url(_action);
			}
	        $.ajax({
                "timeout": Math.ceil(_timeout * 1000),
                "type": "GET",
                "data": _params,
                "url": url,
                "dataType": "json",
                "success": function (response) {
	                if (typeof(_doneFn) == "function") {
                        _doneFn.call(pp, _self, response);
                    }
                },
                "error": function (ajax, message) {
                    if (typeof(_errorFn) == "function") {
                        _errorFn.call(pp, _self, message);
                    }
	                else {
	                    pp.log("'get' error:" + message);
                    }
                }
            });

			return this;
        };

        this.pull = function () {
            if (typeof(_beforeFn) == "function") {
                var before = _beforeFn.call(pp, this);
                if (typeof(before) == "boolean" && !before) {
                    return this;
                }
            }

            if (!_method) {
                _method = pp.action.GET;
            }

			var url = _url;
			if (_url == null) {
				url = pp.url(_action);
			}

            $.ajax({
                "timeout": Math.ceil(_timeout * 1000),
                "type": _method,
                "data": _params,
                "url": url,
                "dataType": "html",
                "success": function (response) {
                    if (_target) {
                        $(_target).html(response);

                        pp.activate($(_target));
                    }
                    if (typeof(_doneFn) == "function") {
                        _doneFn.call(pp, _self, response);
                    }
                },
                "error": function () {
                    if (typeof(_errorFn) == "function") {
                        _errorFn.call(pp, _self);
                    }
                }
            });

			return this;
        };

        this.poll = function () {
            if (typeof(_beforeFn) == "function") {
                var before = _beforeFn.call(pp, this);
                if (typeof(before) == "boolean" && !before) {
                    return this;
                }
            }

            if (!_method) {
                _method = pp.action.GET;
            }

            this.param("_", (new Date()).getTime());

            $.ajax({
                "timeout":Math.ceil(_timeout * 1000),
                "type":_method,
                "data":_params,
                "url":pp.url(_action),
                "dataType":"json",
                "success":function (response) {
                    if (_target) {
                        $(_target).html(response);
                    }
                    if (typeof(_doneFn) == "function") {
                        _doneFn.call(pp, _self, response);
                    }

                    setTimeout(function () {
                        _self.poll();
                    }, Math.ceil(_duration * 1000));
                },
                "error":function () {
                    if (typeof(_errorFn) == "function") {
                        _errorFn.call(pp, _self);
                    }

                    setTimeout(function () {
                        _self.poll();
                    }, Math.ceil(_duration * 1000));
                }
            });

			return this;
        };

        return this;
    };

    /* 一组常量 */
    pp.nil = Number.MAX_VALUE - 100;
    pp.action.POST = "post";
    pp.action.GET = "get";

    /* 事件 */
    pp.on = function (action, fn) {
        if (this == pp) {
            if (!pp.fn.isArray(action)) {
                action = [ action ];
            }
            var obj = new pp.on(action, fn);
            if (pp.fn.isFunction(fn)) {
                obj.done(fn);
            }

            action.asArray().each(function (k, _action) {
                events[_action] = obj;
            });
            return obj;
        }

        var _beforeFn;
        var _doneFn;
        var _errorFn;

        this.before = function (fn) {
            if (typeof(fn) == "undefined") {
                return _beforeFn;
            }
            _beforeFn = fn;
            return this;
        };

        this.done = function (fn) {
            if (typeof(fn) == "undefined") {
                return _doneFn;
            }
            _doneFn = fn;
            return this;
        };

        this.error = function (fn) {
            if (typeof(fn) == "undefined") {
                return _errorFn;
            }
            _errorFn = fn;
            return this;
        };
    };

    pp.url = function (action, params) {
        var url = action.replace(/\./g, "/");

        if (url.length > 0 && url.substring(0, 1) != "/") {
            url = "/" + url;
        }
        else {
            url = "/";
        }
        if (typeof(params) == "object") {
            var query = $.param(params);
            if (query.length > 0) {
                url += "?" + query;
            }
        }
        return url;
    };
    pp.go = function (action, params) {
        window.location.href = pp.url(action, params);
    };

    /* 常用函数 */
    pp.fn = {};
    pp.fn.isFunction = function (value) {
        return (typeof(value) == "function");
    };

    pp.fn.isUndefined = function (value) {
        return (typeof(value) == "undefined");
    };

    pp.fn.isDefined = function (value) {
        return !pp.fn.isUndefined(value);
    };

    pp.fn.isBoolean = function (value) {
        return (typeof(value) == "boolean");
    };

    pp.fn.isYes = function (value) {
        return (typeof(value) == "boolean" && value);
    };

    pp.fn.isNo = function (value) {
        return (typeof(value) == "boolean" && !value);
    };

    pp.fn.isObject = function (value) {
        return (typeof(value) == "object");
    };

    pp.fn.isArray = function (value) {
        return (value instanceof Array);
    };

    pp.log = function () {
        if (!pp.config.log) {
            return;
        }
        if (pp.fn.isObject(console) && pp.fn.isFunction(console.log)) {
            var arr = [];
            for (var i = 0; i < arguments.length; i ++) {
                arr.push(arguments[i]);
            }
            return console.log.apply(console, arr);
        }
    };

    /**
     * 激活
     *
     * @param box 视图容器
     */
    pp.activate = function (box) {
        box.find("*[pp-action]").each(function () {
            var element = $(this);
            var tagName = element[0].tagName.toUpperCase();

            //处理事件
            if (tagName == "FORM") {
                element.submit(function () {
                    var action = element.attr("pp-action");
                    var eventObj = null;
                    if (typeof(events[action]) != "undefined") {
                        eventObj = events[action];
                        var beforeFn = eventObj.before();
                        if (pp.fn.isFunction(beforeFn)) {
                            var ret = beforeFn.call(pp, element);
                            if (pp.fn.isBoolean(ret) && !ret) {
                                return false;
                            }
                        }
                    }

                    var request = new FormData(element[0]);

                    $.ajax({
                        "url":pp.url(action),
                        "data":request,//element.serialize(),
                        "type":"POST",
                        "dataType":"json",
                        "contentType":false,
                        "processData":false,
                        "success":function (response) {
                            if (eventObj != null) {
                                var doneFn = eventObj.done();
                                if (pp.fn.isFunction(doneFn)) {
                                    doneFn.call(pp, element, response);
                                }
                            }
                        },
                        "error":function () {
                            if (eventObj != null) {
                                var errorFn = eventObj.error();
                                if (pp.fn.isFunction(errorFn)) {
                                    errorFn.call(pp, element);
                                }
                            }
                        }
                    });

                    return false;
                });

                element.named = function (name) {
                    return this.find("*[name='" + name + "']");
                };
            }
            else {
                var action = element.attr("pp-action");
                if (typeof(events[action]) != "undefined") {
                    var obj = events[action];
                    var beforeFn = obj.before();
                    if (pp.fn.isFunction(beforeFn)) {
                        beforeFn.call(pp, element);
                    }
                }

                element.click(function () {
                    var action = element.attr("pp-action");
                    if (typeof(events[action]) != "undefined") {
                        var obj = events[action];
                        var doneFn = obj.done();
                        if (pp.fn.isFunction(doneFn)) {
                            doneFn.call(pp, element);
                        }
                    }
                    return false;
                });
            }

            //增加方法
            element.param = function (name, value) {
                if (pp.fn.isUndefined(value)) {
                    return $(this).attr("pp-data-" + name);
                }
                $(this).attr("pp-data-" + name, value);
                return value;
            };

            element.action = function () {
                return $(this).attr("pp-action");
            };
        });
    };

    pp.batch = function (fnTag) {
        for (var prop in window.pp) {
            if (!window.pp.hasOwnProperty(prop) || prop == "batch") {
                continue;
            }

            if (prop.toString().match(new RegExp("^" + fnTag))) {
                window.pp[prop].call(pp);
            }
        }
    };

    pp.Timer = function (fn) {
        var _delay = 0;
        var _duration = 1;
        var _repeats = 1;
        var _count = 1;

        var _timer;

        var self = this;

        if (!pp.fn.isFunction(fn)) {
            pp.log("Timer should input a function");
            return;
        }

        this._runFn = function () {
            if (_count == -1 && _timer) {
                clearInterval(_timer);
                _timer = null;
                return;
            }
            _count --;
            fn.call(this);
        };

        this.run = function () {
            _count = _repeats;

            if (_count == 1) {
                _timer = setTimeout(function () {
                    self._runFn();
                }, _delay * 1000);
            }
            else if (_count == 0) {
                return this;
            }
            else {
                _count --;

                if (_count < 0 || _count > 0) {
                    _timer = setTimeout(function () {
                        self._runFn();

                        _timer = setInterval(function () {
                            self._runFn();
                        }, _duration * 1000);

                    }, _delay * 1000);
                }
            }

            return this;
        };

        this.delay = function(seconds) {
            _delay = seconds;
            return this;
        };

        this.duration = function (seconds) {
            _duration = seconds;
            return this;
        };

        this.repeat = function (times) {
            _repeats = times;
            return this;
        };

        this.infinite = function () {
            _repeats = -1;
            return this;
        };

        this.cancel = function () {
            if (_timer) {
                clearTimeout(_timer);
                clearInterval(_timer);
                _timer = null;
            }
            _count = _repeats;
            return this;
        };

        this.pause = function () {
            if (_timer) {
                clearTimeout(_timer);
                clearInterval(_timer);
                _timer = null;
            }
            return this;
        };

        this.resume = function () {
            if (_timer) {
                return this;
            }
            if (_count != 0) {
                _timer = setInterval(function () {
                    self._runFn();
                }, _duration * 1000);
            }
            return this;
        };

        return this;
    };

    /**
     * pp.Array对象。<br/><br/><b>注意本对象中各种排序方法应该只应用于同种类型数据的集合，否则可能会产生预料不到的结果。</b>
     *
     * @class pp.Array
     */

    /**
     * pp.Array 构造器。例如：<br/>
     * var arr = new pp.Array(1, 2, 3, 4); <br/>
     * var arr = new pp.Array();<br/>
     * var arr = new pp.Array([1, 2, 3, 4]);
     *
     * @constructor pp.Array
     */
    pp.Array = function () {
	    if (this instanceof Function) {
		    var arr = new pp.Array();
		    arr._init(arguments);
		    return arr;
	    }

        pp.mixIn(this, pp.Iterator);

	    var array = [];

		this._init = function (args) {
			if (pp.fn.isUndefined(args)) {
				return;
			}
			if (args.length == 0) {
				array = [];
			}
			else if (args.length == 1 && typeof(args[0]) == "object" && pp.fn.isDefined(args[0].length)) {
				for (var i = 0; i< args[0].length; i ++) {
					array.push(args[0][i]);
				}
			}
			else {
				for (var i = 0; i < arguments.length; i ++) {
					array.push(args[i]);
				}
			}
		};

        /**
         * 数组中是否包含某个值
         *
         * @method contains
         * @param object value
         * @param boolean strict 是否类型严格，为可选参数，默认为false
         * @return boolean
         * @version 0.0.1
         */
        this.contains = function (value, strict) {
            var keys = this.keys(value, strict);
            return (keys.length > 0);
        };

        /**
         * 取得某一个值在数组中出现的所有的键的集合
         *
         * @method keys
         * @param Object value
         * @param boolean strict 是否类型严格，为可选参数，默认为false
         * @return Array
         * @version 0.0.1
         */
        this.keys = function (value, strict) {
            var keys = [];
            if (!pp.fn.isDefined(strict)) {
                strict = false;
            }
            for (var i=0; i<array.length; i++) {
                if ((strict && value === array[i]) || (!strict && value == array[i])) {
                    keys.push(i);
                }
            }
            return keys;
        };

        /**
         * 在数组的末尾加入一个元素，值为value
         *
         * @method push
         * @param Object value 元素值
         * @version 0.0.1
         */
        this.push = function (value) {
            array.push(value);
            if (arguments.length > 1) {
                for (var i=1; i<arguments.length; i++) {
                    array.push(arguments[i]);
                }
            }
        };

        /**
         * 从数组的末尾弹出一个元素，并返回该元素
         *
         * @method pop
         * @return Object
         */
        this.pop = function () {
            return array.pop();
        };

        /**
         * 删除某一个索引对应的元素
         *
         * @method remove
         * @param int index 要删除的元素索引
         */
        this.remove = function (index) {
            index = parseInt(index, 10);
            var _array = new pp.Array();
            if (array.length >= index + 1 && index > -1) {
                for (var i=0; i<array.length; i++) {
                    if (i != index) {
                        _array.push(array[i]);
                    }
                }
            }
            else {
                _array = this;
            }
            array = _array.values();
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
         * 取得该数组的值域
         *
         * @method values
         * @return Array
         */
        this.values = function () {
            return array;
        };

        /**
         * 取得该数组的长度
         *
         * @method length
         * @return int
         */
        this.length = function () {
            return array.length;
        };

        /**
         * 取得该数组的长度
         *
         * @method count
         * @return int
         */
        this.count = function () {
            return this.length();
        };

        /**
         * 取得某索引对应的元素值
         *
         * @method get
         * @param int index
         * @return Object
         */
        this.get = function (index) {
            if (index > this.length()) {
                return null;
            }
            return array[index];
        };

        /**
         * 设置某索引对应的元素值
         *
         * @method set
         * @param int index 索引
         * @param Object value 值
         */
        this.set = function (index, value) {
            array[index] = value;
        };

        /**
         * 对该数组进行正排序
         *
         * @method sort
         * @param function sortFunction 排序函数，可选
         */
        this.sort = function (sortFunction) {
            if (!pp.fn.isDefined(sortFunction)) {
                sortFunction = function (v1, v2) {
                    if (v1 > v2) {
                        return 1;
                    }
                    else if (v1 == v2) {
                        return 0;
                    }
                    else {
                        return -1;
                    }
                };
            }
            array.sort(sortFunction);
        };

        /**
         * 对该数组进行反排序
         *
         * @method rsort
         * @param function sortFunction 排序函数，可选
         */
        this.rsort = function (sortFunction) {
            this.sort(sortFunction);
            this.reverse();
        };

        /**
         * 对该数组进行正排序，并返回排序后对应的索引
         *
         * @method asort
         * @param function sortFunction 排序函数，可选
         * @return pp.Array 当前对象
         */
        this.asort = function (sortFunction) {
            var indexes = new pp.Array();
            for (var i = 0; i < array.length; i ++) {
                indexes.push(i);
            }
            if (!pp.fn.isDefined(sortFunction)) {
                sortFunction = function (e1, e2) {
                    if (e1 < e2) return - 1;
                    if (e1 > e2) return 1;
                    return 0;
                };
            }
            for (var i = 0; i <array.length; i ++) {
                for (var j=0; j < array.length; j ++) {
                    if (j > 0 && sortFunction(array[j-1], array[j]) > 0) {
                        this.swap(j, j-1);
                        indexes.swap(j, j-1);
                    }
                }
            }
            return indexes;
        };

        /**
         * 对该数组进行反排序，并返回排序后对应的索引
         *
         * @method arsort
         * @param function sortFunction 排序函数，可选
         */
        this.arsort = function (sortFunction) {
            var indexes = this.asort(sortFunction);
            this.reverse();
            indexes.reverse();
            return indexes;
        };

        /**
         * 反转数组的元素
         *
         * @method reverse
         */
        this.reverse = function () {
            array = array.reverse();
            return this;
        };

        /**
         * 交换数组的两个索引对应的值
         *
         * @method swap
         * @param integer index1
         * @param integer index2
         */
        this.swap = function (index1, index2) {
            var value1 = this.get(index1);
            var value2 = this.get(index2);
            this.set(index1, value2);
            this.set(index2, value1);
        };

        /**
         * 清除数组所有元素值
         *
         * @method clear
         */
        this.clear = function () {
            array = [];
        };

        /**
         * 将对象转换成字符串格式
         *
         * @method toString
         */
        this.toString = function () {
            return array.toString();
        };

        /**
         * 获得一去除数组中的所有重复的值的新数组
         *
         * @method unique
         * @param boolean strict 是否类型严格，为可选参数，默认为false
         * @return pp.Array
         */
        this.unique = function (strict) {
            var _array = new pp.Array();
            for (var i=0; i<array.length; i++) {
                if (!_array.contains(array[i], strict)) {
                    _array.push(array[i]);
                }
            }
            return _array;
        };

        /**
         * 拷贝当前对象
         *
         * @method copy
         * @return pp.Array
         * @version 0.1.0
         */
        this.copy = function () {
            return new pp.Array(array);
        };

        /**
         * 取得当前集合中最大的一个值
         *
         * @method max
         * @param function sortFunction 排序函数，为可选参数
         * @return mixed
         * @version 0.1.1
         */
        this.max = function (sortFunction) {
            if (this.length() > 0) {
                var _array = this.copy();
                _array.rsort(sortFunction);
                return _array.get(0);
            }
            return null;
        };

        /**
         * 取得当前集合中最小的一个值
         *
         * @method min
         * @param function sortFunction 排序函数，为可选参数
         * @return mixed
         * @version 0.1.1
         */
        this.min = function (sortFunction) {
            if (this.length() > 0) {
                var _array = this.copy();
                _array.sort(sortFunction);
                return _array.get(0);
            }
            return null;
        };

        /**
         * 判断当空对象是否为空
         *
         * @method empty
         * @return boolean
         * @version 0.4.0
         */
        this.empty = function () {
            return (array.length == 0);
        };

        /**
         * 加入新的数组元素
         *
         * @method concat
         * @param mixed array1,array2,...arrayN
         * @version 0.4.0
         */
        this.concat = function () {
            for (var i=0; i<arguments.length; i++) {
                if (arguments[i] instanceof Array) {
                    array =  array.concat(arguments[i]);
                }
                else if (arguments[i] instanceof pp.Array) {
                    array = array.concat(arguments[i].values());
                }
                else {
                    array = array.concat(arguments[i]);
                }
            }
        };

        /**
         * 将该对象中各元素以分隔符连接成一字符串
         *
         * @method join
         * @param String separator 分隔符
         * @return String
         * @version 0.4.0
         */
        this.join = function (separator) {
            return array.join(separator);
        };

        /**
         * 弹出当前对象的第一个元素，并返回该元素
         *
         * @method shift
         * @return mixed
         * @version 0.4.0
         */
        this.shift = function () {
            return array.shift();
        };

        /**
         * 从当前对象的开始位置加入新的元素
         *
         * @method unshift
         * @param mixed el,e2,...eN
         * @version 0.4.0
         */
        this.unshift = function () {
            for (var i=0; i<arguments.length; i++) {
                array.unshift(arguments[i]);
            }
        };

        /**
         * 从当前对象中截取一部分元素并组成新的pp.Array对象
         *
         * @method slice
         * @param int start 起始位置
         * @param int length 长度
         * @return pp.Array
         * @version 0.4.0
         */
        this.slice = function (start, length) {
            if (!pp.fn.isDefined(length)) {
                length = array.length;
            }
            if (length < 0) {
                length = 0;
            }
            var end = (start>0)?start + length:array.length;
            return (new pp.Array(array.slice(start, end)));
        };

        /**
         * 从一个数组中移除一个或多个元素，如果必要，在所移除元素的位置上插入新元素，返回所移除的元素
         *
         * @method splice
         * @param int start 指定从数组中移除元素的开始位置
         * @param int deleteCount 要移除的元素的个数
         * @param mixed item1,item2,...itemN 要在所移除元素的位置上插入的新元素
         * @return Array
         * @version 0.4.0
         */
        this.splice = function (start, deleteCount) {
            return new pp.Array(array.splice.apply(array, arguments));
        };

        /**
         * 从一个数组中移除一个或多个元素，如果必要，在所移除元素的位置上插入新元素，返回所移除的元素。该方法与splice的区别是操作并不影响原有对象
         *
         * @method splice$
         * @param int start 指定从数组中移除元素的开始位置
         * @param int deleteCount 要移除的元素的个数
         * @param mixed item1,item2...itemN 要在所移除元素的位置上插入的新元素
         * @return pp.Array
         * @version 0.4.0
         */
        this.splice$ = function (start, deleteCount) {
            var array2 = this.copy();
            array2.splice.apply(array2.values(), arguments);
            return array2;
        };

        /**
         * 取当前对象与另一pp.Array对象的差集
         *
         * @method diff
         * @param pp.Array array2 pp.Array对象
         * @return pp.Array
         * @version 0.4.0
         */
        this.diff = function (array2) {
            var _array = new pp.Array();
            this.each(function (k, v) {
                if (!array2.include(v)) {
                    _array.push(v);
                }
            });
            return _array;
        };

        /**
         * 取当前对象与另一pp.Array对象的交集
         *
         * @method intersect
         * @param pp.Array array2 pp.Array对象
         * @return pp.Array
         * @version 0.4.0
         */
        this.intersect = function (array2) {
            var _array = new pp.Array();
            this.each(function (k, v) {
                if (array2.include(v)) {
                    _array.push(v);
                }
            });
            return _array;
        };

	    this._init(arguments);
	    return this;
    };

    Array.prototype.asArray = function () {
        return new pp.Array(this);
    };

    /**
     * 从一个限定的范围数字或字符生成一个pp.Array类型的数组
     *
     * @method range
     * @static 本方法为静态方法
     * @param mixed start 数组的起始元素，可以为一个数字或一个字符
     * @param mixed end 数组的结束元素，可以为一个数字或一个字符
     * @param int step 步进制，应该为大于1的整数，默认为1
     * @return pp.Array
     */
    pp.range = function (start, end, step) {
        var array = [];

        if (!pp.fn.isDefined(step)) {
            step = 1;
        }

        if (start < end) {
            for (var i = start; i <= end; i += step) {
                array.push(i);
            }
        }
        else {
            for (var i = start; i >= end; i -= step) {
                array.push(i);
            }
        }
        return new pp.Array(array);
    };



    pp.Iterator = {
        /**
         * 遍历当前容器的元素,并对每一元素调用迭代器,该容器必须实现了asEntries方法
         *
         * @method each
         * @param function iterator 接收两个参数(键、值)
         */
        "each": function (iterator) {
            if (typeof(iterator) != "function") {
                throw new Error(this.toString() + " each: iterator is not a function.");
            }
			var arr;
            if (this instanceof pp.Array) {
				arr = this;
			}
			else if (pp.fn.isFunction(this.asEntries)) {
				arr = this.asEntries();
	            if (!(arr instanceof pp.Array)) {
		            pp.log("'asEntries' should return an 'pp.Array' object");
		            return;
	            }
			}
	        if (!arr) {
		        pp.log("'asEntries' should be implemented");
		        return;
	        }
	        var index = 0;
			for (var k = 0; k < arr.length(); k ++) {
				var value = arr.get(k);

				try {
					if (value instanceof pp.Entry) {
						if (value.key === null) {
							value.key = index;

							index ++;
						}
 						iterator.call(this, value.key, value.value);
					}
					else {
						iterator.call(this, k, value);
					}
				}
				catch (e) {
					if (e instanceof pp.Iterator.Break) {
						break;
					}
					else if (e instanceof pp.Iterator.Continue) {
						continue;
					}
					else {
						throw e;
					}
				}
			}
        },

        /**
         * 对容器中元素应用迭代器,并判断是否全部返回真
         *
         * @method all
         * @param function iterator 接收两个参数(键、值)
         * @return boolean
         */
        "all": function (iterator) {
            var flg = true;
            this.each (function (k, v) {
                if (!iterator(k, v)) {
                    flg = false;
                    pp_break();
                }
            });
            return flg;
        },

        /**
         * 对容器中元素应用迭代器,并判断是否有一次返回真
         *
         * @method any
         * @param function iterator 接收两个参数(键、值)
         * @return boolean
         */
        "any": function (iterator) {
            var flg = false;
            this.each (function (k, v) {
                if (iterator(k, v)) {
                    flg = true;
                    pp_break();
                }
            });
            return flg;
        },

        /**
         * 对容器中元素应用迭代器,并将每次执行的结果放入一pp.Array中
         *
         * @method collect
         * @param function iterator 接收两个参数(键、值)
         * @return pp.Array
         */
        "collect": function (iterator) {
            var array = new pp.Array();
            this.each(function (k, v) {
                array.push(iterator(k, v));
            });
            return array;
        },

        /**
         * 对容器中元素应用迭代器,只要有一次返回值即立即返回由当前元素组成的pp.Entry对象
         *
         * @method find
         * @param function iterator 接收两个参数(键、值)
         * @return pp.Entry
         */
        "find": function (iterator) {
            var temp= null;
            this.each (function (k, v) {
                if (iterator(k, v)) {
                    temp = new pp.Entry(k, v);
                    pp_break();
                }
            });
            return temp;
        },

        /**
         * 对容器中元素应用迭代器,将每个元素的键值组成的pp.Entry对象放入一pp.Array中
         *
         * @method entries
         * @param function iterator 接收两个参数(键、值)
         * @return pp.Array
         */
        "entries": function () {
            var entries = new pp.Array();
            this.each(function (k, v) {
                entries.push(new pp.Entry(k, v));
            });
            return entries;
        },

        /**
         * 对容器中元素应用迭代器,将所有返回真的键、值对组成的pp.Entry放入一数组中
         *
         * @method findAll
         * @param function iterator 接收两个参数(键、值)
         * @return pp.Array
         */
        "findAll": function (iterator) {
            var entries = new pp.Array();
            this.each (function (k, v) {
                if (iterator(k, v)) {
                    entries.push(new pp.Entry(k, v));
                }
            });
            return entries;
        },

        /**
         * 对容器中元素应用迭代器,将所有返回假的键、值对组成的pp.Entry放入一数组中
         *
         * @method reject
         * @param function iterator 接收两个参数(键、值)
         * @return pp.Array
         */
        "reject": function (iterator) {
            var entries = new pp.Array();
            this.each (function (k, v) {
                if (!iterator(k, v)) {
                    entries.push(new pp.Entry(k, v));
                }
            });
            return entries;
        },

        /**
         * 判断当前容器是否包含某个值
         *
         * @method include
         * @param mixed value
         * @return boolean
         */
        "include": function (value) {
            var entry = this.find(function (k, v) {
                if (v == value) {
                    return true;
                }
            });
            return (entry != null);
        },

        /**
         * 找出匹配某正则表达式的元素
         *
         * @method grep
         * @param RegExp pattern 正则表达式，如/a{1,3}/
         * @return pp.Array
         * @version 0.4.0
         */
        "grep": function (pattern) {
            if (!(pattern instanceof RegExp)) {
                pattern = new RegExp(pattern);
            }
            return this.findAll(function (k, v) {
                return pattern.test(v.toString());
            });
        },

        /**
         * 基于某值进行运算，并将每次运算结果赋给该值。<br/><code><font color='blue'>var</font>&nbsp;array&nbsp;=&nbsp;<font color='blue'>new</font>&nbsp;<b><font color='black'>pp.Array</font></b>(1,&nbsp;2,&nbsp;3,&nbsp;4);<br />
         <font color='blue'>var</font>&nbsp;x&nbsp;=&nbsp;array.inject(1,&nbsp;<font color='blue'>function</font>&nbsp;(memo,&nbsp;k,&nbsp;v)&nbsp;{<br />
&nbsp;&nbsp;&nbsp;&nbsp;<font color='blue'>return</font>&nbsp;memo&nbsp;+&nbsp;v;<br />
});<br />
         alert(x);</code>
         *
         * @method inject
         * @param mixed memo 初始值
         * @function iterator 迭代器，将接收三个参数：memo, k, v
         * @return mixed
         * @version 0.4.0
         */
        "inject": function (memo, iterator) {
            this.each(function(k, v) {
                memo = iterator(memo, k, v);
            });
            return memo;
        }
    };

    pp.Iterator.Break = function () {};
    pp.Iterator.Continue = function () {};

    /**
     * 中止当前循环,并直接跳到下一次循环
     *
     * @function pp_continue
     */
    window.pp_continue = function () {
        throw new pp.Iterator.Continue();
    }

    /**
     * 中止当前循环
     *
     * @function pp_break
     */
    window.pp_break = function () {
        throw new pp.Iterator.Break();
    }

    pp.mixIn = function (dest, source) {
        for (var property in source) {
            try {
				if (source.hasOwnProperty(property)) {
					dest[property] = source[property];
				}
            } catch (e) {
                throw new Error("pp.mixIn: get a error when set property: " + property);
            }
        }
    };

    /* 模块管理 */
    var requiredFiles = [].asArray();
    pp.require = function () {
        var files = new pp.Array();
        var callbacks = [];
        new pp.Array(arguments).each(function (index, module) {
            if (pp.fn.isFunction(module)) {
                callbacks.push(module);
                return;
            }
            var filename = module + ".js";
            if (pp.fn.isDefined(pp.config.versions[module])) {
                filename += "?v=" + pp.config.versions[module];
            }
            var scriptFile = pp.config.js + "/" + filename;
            if (requiredFiles.contains(scriptFile) || files.contains(scriptFile)) {
                return;
            }

            files.push(scriptFile);
        });
        if (files.length() == 0) {
            if (files.length() == 0 && callbacks.length > 0) {
                callbacks.asArray().each(function (k, v) {
                    v.call();
                });
            }
            return;
        }
        isLoadingFiles = true;
        files.each(function (index, file) {
            $.ajax({
                "url":file,
                "type":"get",
                "dataType":"script",
                "async":true,
                "cache":true,
                "success":function () {
                    requiredFiles.push(file);
                    files.removeValue(file);

                    if (files.length() == 0) {
                        if (callbacks.length > 0) {
                            callbacks.asArray().each(function (k, v) {
                                v.call();
                            });
                        }

                        //执行页面加载函数
                        if (pageFunctions.length > 0) {
                            pageFunctions.asArray().each(function (k, v) {
                                v.call();
                            });
                            pageFunctions = [];
                        }

                    }
                }
            });
        });
    };

    /**
     * 构造器
     *
     * 支持
     * - new pp.Entry("Value")
     * - new pp.Entry("Key", "Value")
     *
     * @constructor pp.Entry
     * @param mixed key 键
     * @param mixed value 值
     */
    pp.Entry = function (key, value) {
	    if (pp.fn.isUndefined(value)) {
		    value = key;
		    key = null;
	    }
        this.key = key;
        this.value = value;
    };

    /* 配置 */
    pp.config = {
        "js":"/js",
        "log":true,
        "versions":{}
    };

    if (!isActivated) {
        pp.activate($(document));
    }

    window.pp = pp;
})(jQuery);
