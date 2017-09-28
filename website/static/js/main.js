/*!
 * IU BG Video Banners
 * v3.0
 * Handles creating and playing inline video banners (not players)
 */

;(function ($, window, document, undefined ) {

    'use strict';

    function once(fn, context) {
        var result;

        return function() {
            if(fn) {
                result = fn.apply(context || this, arguments);
                fn = null;
            }

            return result;
        };
    }

    function BgVideo($el, settings, id) {

        IU.debug('Module: Initializing BG Video - ' + id, $el);

        this.id = id;
        this.video = $el;
        this.section = $el.closest('.bg-video');
        this.wrapper = $el.closest('.bg-video-viewport');
        this.state = 'playing';

        this.setup();

        return this;
    }

    BgVideo.prototype.setup = function() {
        var scope = this;

        scope.videoRatio();

        // Remove loading class from banner
        // see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
        // Use "once" so that when the video loops, it doesn't reinit bindPlayPause
        scope.video.on('canplay', once(function() {
            scope.bindPlayPause();
            scope.wrapper.addClass('loaded');
            scope.section.addClass('video-loaded');
        }) );
    };

    BgVideo.prototype.bindPlayPause = function() {
        var scope = this;
        var videoNum = scope.id + 1;

        var videoBtn = '<a class="icon-pause" href="#">Pause Video ' + videoNum + '</a>';

        var playControls = $('<div class="play-controls via-js"><div class="row pad">' + videoBtn + '</div></div>');

        $(playControls).insertAfter(scope.wrapper);

        $("a", playControls).on("click", function(event) {
            event.preventDefault();

            var $this = $(this);

            if (scope.state === 'playing') {
                scope.video.trigger('pause');
                $this.html('Play Video ' + videoNum).removeClass('icon-pause').addClass('icon-play');
                scope.state = 'paused';
                return;
            }

            if (scope.state === 'paused') {
                scope.video.trigger('play');
                $this.html('Pause Video ' + videoNum).removeClass('icon-play').addClass('icon-pause');
                scope.state = 'playing';
                return;
            }
        });
    };

    BgVideo.prototype.videoRatio = function() {
        var scope = this;

        // Set up Dimensions
        scope.vid_width = parseInt(scope.video.attr('width'));
        scope.vid_height = parseInt(scope.video.attr('height'));

        scope.ratio = ( (scope.vid_height / scope.vid_width) * 100 ).toFixed(5);

        if (scope.ratio !== '33.33333') {
            scope.section.css({ paddingBottom: scope.ratio + '%'});
        }
    };

    function CreateVideoElement($el, id) {
        // Create video
        var videoEl = document.createElement('video');
        videoEl.setAttribute('autoplay', 'autoplay');
        videoEl.setAttribute('loop', 'loop');
        videoEl.setAttribute('preload', 'preload');
        videoEl.setAttribute('width', $el.attr('data-width'));
        videoEl.setAttribute('height', $el.attr('data-height'));

        // add webm source:
        if ($el.attr('data-webm').length) {
            var sourceWebM = document.createElement('source');
            sourceWebM.setAttribute('type', 'video/webm');
            sourceWebM.setAttribute('src', $el.attr('data-webm') );
            videoEl.appendChild(sourceWebM);
        }

        // add mp4 source:
        if ($el.attr('data-mp4').length) {
            var sourceMP4 = document.createElement('source');
            sourceMP4.setAttribute('type', 'video/mp4');
            sourceMP4.setAttribute('src', $el.attr('data-mp4') );
            videoEl.appendChild(sourceMP4);
        }

        $el.append(videoEl);

        return videoEl;
    };

    /*IU.addInitalisation('bg-video-element', function() {
        IU.debug('Module: Initializing BG Video Element');

        var settings = arguments[0];

        // Create video element/markup if necessary
        $('[data-mp4], [data-webm]').each(function(id) {
            var $this = $(this);

            // this element has already been initialized
            if ($this.data('hasVideoElement')) {
                return true;
            }

            // mark element as initialized
            $this.data('hasVideoElement', true);

            var video = new CreateVideoElement($this, id);

            // Initialize bg-video for this new element
            IU.initialize('bg-video');
        });
    });*/

    // add initialisation
    IU.addInitalisation('bg-video', function() {

        var settings = arguments[0];

        $('.bg-video video').each(function(id) {
            var $this = $(this);

            // this element has already been initialized
            if ($this.data('isBgVideo')) {
                return true;
            }

            // mark element as initialized
            $this.data('isBgVideo', true);

            var video = new BgVideo($this, settings, id);
        });
    });

    // Register UI module
    /*IU.UIModule({
        module: 'bg-video-element',
        settings: {},
        init: function() {
            IU.initialize('bg-video-element', this.settings);
        }
    });*/

    // Register UI module
    IU.UIModule({
        module: 'bg-video',
        settings: {},
        init: function() {
            IU.initialize('bg-video', this.settings);
        }
    });

})( jQuery, window, window.document );




/*!
 * Initialize IU JS
 */

(function (window, document, $, undefined) {
    $(document).ready(function() {

        Foundation.OffCanvas.defaults.transitionTime = 500;
        Foundation.OffCanvas.defaults.forceTop = false;
        Foundation.OffCanvas.defaults.positiong = 'right';

        //Foundation.Accordion.defaults.multiExpand = true;
        Foundation.Accordion.defaults.allowAllClosed = true;

        $(document).foundation();

        var IUSearch = window.IUSearch || {};
        var IU = window.IU || {};

        /* Initialize global branding */
        IUSearch.init({
    		CX: {
    			site: '016278320858612601979:w_w23ggyftu', // IU Bloomington
        		all: '016278320858612601979:ddl1l9og1w8' // IU
                //all: '016278320858612601979:w_w23ggyftu' // IU Bloomington
                //all: '016278320858612601979:pwcza8pis6k' // IUPUI
    		},
    		wrapClass: 'row pad',
            searchBoxIDs: ['search', 'off-canvas-search']
    	});

        /* Delete modules if necessary (prevents them from auto-initializing) */
        // delete IU.uiModules['accordion'];

        /*
         * Initialize global IU & its modules
         * Custom settings can be passsed here
         */
        IU.init && IU.init({debug: true});
    });


    $(".shared-show-hide").each(function() {
        var $this = $(this);
        var $current_html = $this.next('div.shared-block').html();
        var $code = $this.parent().find('.shared-container');

        $code.hide();

        $this.on('click', function(e) {
            e.preventDefault();
            if ($code.html() != $current_html){
                $code.hide();
                $code.html($current_html);
            }
            $code.slideToggle();

        });
    });
    $(".panel .show-hide").each(function() {
        var $this = $(this);
        var $code = $this.next('.form-container');

        $code.hide();

        $this.on('click', function(e) {
            e.preventDefault();
            $code.slideToggle();

        });
    });

    // Script to show confirmation box before deleting
    $( ".DeleteLink" ).click(function( event ) {
		event.preventDefault();
		var section_text = $(this).attr('value');
		console.log(section_text);
		var r = confirm(`Are you sure you want to delete this ${section_text} ?`);
		if (r == true) {
			window.location.href = $(this).attr('href');
		}
	});
})(window, window.document, jQuery);