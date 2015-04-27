/**
 * select选项
 *
 * - options(optionsData)
 * - options(dataFunction)
 * - options(optionsDataURL)
 * - options(parentElement, callback)
 *
 * @param source
 * @param callback
 * @return object
 */
$.fn.options = function (source, callback) {
	var _self = this;

	if (arguments.length == 2) {
		if (callback instanceof Function) {
			$(source).change(function () {
				callback.call(_self, $(this));
			});
		}
	}
	else if (source instanceof Function) {
		var values = source.call(this);
		$.fn.options.call(_self, values);
	}
	else if (typeof(source) == "string") {
		pp.action(source).done(function (sender, response) {
			pp.log(response)
			$.fn.options.call(_self, response.data);
		}).get();
	}
	else if (source instanceof Array) {
		$.fn.options.call(_self, source.asArray());
	}
	else if (source instanceof pp.Array) {
		if (_self.length == 0) {
			return this;
		}
		var options = _self[0].options;
		for (var i = options.length - 1; i >= 0; i --) {
			var option = options[i];
			if ($(option).attr("pp-tmp")) {
				_self[0].remove(i);
			}
		}
		source.each(function (k, v) {
			if (v instanceof Array) {
				if (v.length >= 2) {
					k = v[0];
					v = v[1];
				}
			}
			var option = new Option(v, k);
			option.setAttribute("pp-tmp", "1");
			_self[0].add(option);
		});
		setTimeout(function () {
			_self.change();
		}, 10);
	}

	return this;
};