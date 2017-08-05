/***********************
 * 加载动画jquery插件        *
 * author:Shayne C     *
 * updateTime:2017.4.3 *
 ***********************/

(function($) {
	$.fn.mLoading = function(type) {
		switch(type)
			{
				case 1:
				$(this).append('<article class="loader"><article class="dot"></article><article class="dot"></article><article class="dot"></article><article class="dot"></article><article class="dot"></article></article>');
				break;
			}
	}
}(jQuery));
