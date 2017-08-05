/*
jquery+aminateCSS动画扩展组件
author:Shayne C
2017.1.19
*/
(function($) {
	$.fn.anim = function(option) {
		var _this = $(this);
		var len = $(this).length;
		var testAnim = function(dom, type, call, call2) {
			dom.addClass(type + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				if (call) {
					call(dom, _this);
				}
				if (call2) {
					call2(dom, _this);
				}
			});
		};
		if (len > 1) {
			var currentTime = 0;
			$(this).each(function(index, el) {
				if (index != len - 1) {
					setTimeout(function() {
						testAnim($(el), option.type, option.each);
					}, currentTime);
				} else {
					setTimeout(function() {
						testAnim($(el), option.type, option.each, option.complete);
					}, currentTime);
				}
				currentTime += option.time || 100;
			});
		} else {
			testAnim($(this), option.type, option.complete);
		}
	}
}(jQuery));