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
        //console.log("hey")
        //var $modal = new Foundation.Reveal($('#myModal'));
        //$modal.open();
        /*
         * Initialize global IU & its modules
         * Custom settings can be passsed here
         */
        IU.init && IU.init({debug: true});
    });
})(window, window.document, jQuery);
