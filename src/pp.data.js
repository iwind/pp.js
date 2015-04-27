pp.data = {};
pp.data.VarElements = null;
pp.data.IfElements = null;
pp.data.update = function () {
    pp.data.VarElements = $("*[pp-var]");
    pp.data.IfElements = $("*[pp-if]");

    $("*[pp-ns]").each(function () {
        var ns = $(this).attr("pp-ns");
        $(this).find("*[pp-var]").each(function () {
            if (!$(this).attr("pp-ns")) {
                $(this).attr("pp-ns", ns);
            }
        });
        $(this).find("*[pp-if]").each(function () {
            if (!$(this).attr("pp-ns")) {
                $(this).attr("pp-ns", ns);
            }
        });
    });
};

pp.data.Object = function (data) {
    var _names = [];
    var __data = data;
    var _context;

    this.data = function (data) {
        __data = data;
        return this;
    };

	this.bind = function () {
		_names = arguments;
		this.change();
		return this;
	};

    this.context = function (context) {
        _context = context;
        return this;
    };

    this.change = function () {
        if (_context == null) {
            if (pp.data.VarElements == null || pp.data.IfElements == null) {
                return;
            }
            this._changeData(pp.data.VarElements, pp.data.IfElements);
        }
        else {
            this._changeData(_context.find("*[pp-var]"), _context.find("*[pp-if]"));
        }
        return this;
    };

    this._changeData = function (varElements, ifElements) {
        //全变量
        var self = this;

        varElements.each(function () {
            var element = $(this);
            var attr = self.parse(element.attr("pp-var"), element.attr("pp-ns"));
            var type = typeof(attr);
            if (type == "undefined") {
                element.html("");
            }
            else if (type == "string" || type == "number" || type == "boolean") {
                if (type == "number" && attr == pp.nil) {//如果返回nil，则隐藏
                    element.hide();
                    return;
                }

                //@TODO 支持内容中的变量

                if (element.is("input") || element.is("textarea")) {
                    element.val(attr.toString());

                    if ((element.is(":checkbox") || element.is(":radio")) && element.attr("pp-checked")) {
                        element.attr("checked", self.parse(element.attr("pp-checked"), element.attr("pp-ns")))
                    }
                }
                else if (element.is("img") || element.is("frame") || element.is("iframe") || element.is("embed")) {
                    element.attr("src", attr.toString());
                }
                else {
                    element.html(attr.toString());
                }
            }
            else if (typeof(attr) == "object") {
                if (attr == null) {
                    return;
                }
                if (attr instanceof Array) {//如果是数组，则循环
                    if (attr.length == 0) {
                        element.hide();
                        return;
                    }

                    var elements = [ element ];
                    element.hide();

                    element.parent().find("*[pp-var-index]").each(function () {
                        var index = parseInt($(this).attr("pp-var-index"));
                        if (index > 0) {
                            $(this).remove();
                        }
                    });

                    var lastElement = element;
                    for (var i = 1; i < attr.length; i ++) {
                        var cloneNode = element.clone();
                        cloneNode.removeAttr("pp-var");
                        cloneNode.removeAttr("pp-if");
                        cloneNode.removeAttr("pp-one");
                        cloneNode.removeAttr("pp-filter");
                        cloneNode.insertAfter(lastElement);

                        lastElement = cloneNode;

                        elements.push(cloneNode);
                    }

                    //处理变量
                    var one = element.attr("pp-one");
                    if (!one) {
                        return;
                    }
                    var index = 0;
                    var filter = element.attr("pp-filter");
                    for (var i  = 0; i < elements.length; i ++) {
                        if (attr[i] == pp.nil) {
                            continue;
                        }

                        if (typeof(attr[i]) == "object") {
                            attr[i].$index = index;
                        }
                        else {
                            attr[i] = { "$value":attr[i] };
                        }
                        elements[i].attr("pp-var-index", index);

                        var newData = new pp.data.Object(attr[i]);
                        newData.context(elements[i]);
                        newData.bind(one);
                        newData.change();

                        if (filter) {
                            eval(filter + "(elements[i], attr[i]);");
                        }

                        elements[i].show();

                        index ++;
                    }
                }
            }
        });

        ifElements.each(function () {
            var element = $(this);
            var attr = self.parse(element.attr("pp-if"), element.attr("pp-ns"));
            if (pp.fn.isUndefined(attr) || attr === null) {
                return;
            }
            if (element[0].tagName.toUpperCase() == "SCRIPT") {
                var varId = element.attr("pp-var-id");
                if (!varId) {
                    varId = "pp-var-" + Math.random();
                    element.attr("pp-var-id", varId);
                }
                else {
                    $("*[pp-var-bind='" + varId + "']").remove();
                }

                if (attr) {
                    $(element.html()).attr("pp-var-bind", varId).insertAfter(element);
                }
            }
            else if (attr) {
                element.show();
            }
            else {
                element.hide();
            }
        });

    };

    this.parse = function(__attr, __ns) {
        for (var i  = 0;  i < _names.length; i ++) {
            var __name = _names[i];
            try {
                eval("var " +  __name + "  = __data;");//@TODO 需要支持多级名称，比如 user.profile

                if (__ns) {
                    var __firstName1 = __name.split(".")[0];
                    var __firstName2 = __ns.split(".")[0];
                    if (__firstName1 == __firstName2) {
                        if (__ns.indexOf(".") == -1) {
                            if (__name.indexOf(".") == -1) {
                                for (var __p in __data) {
                                    if (__p.match(/^[a-z_]\w+$/i)) {
                                        eval("var " + __p + " = data[__p]");
                                    }
                                }
                            }
                            else {//@TODO 实现多级

                            }
                        }
                        else {//@TODO 多级参数

                        }
                    }
                }
            } catch (e) {
                pp.log(e);
            }
        }

        var ret = null;
        try {
            eval("ret = " + __attr);
        } catch (e) {

        }
        return ret;
    };
};