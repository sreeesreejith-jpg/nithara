(function () {
    /**
     * Capacitor Hardware Back Button Handler
     * Refined for robust navigation and app exit.
     */
    function setupBackButton() {
        // Safe access to the Capacitor App plugin
        const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;

        // If the plugin isn't ready yet, retry after a short delay
        if (!App) {
            setTimeout(setupBackButton, 200);
            return;
        }

        // Remove existing listeners to avoid duplicates
        if (App.removeAllListeners) {
            App.removeAllListeners();
        }

        // Add custom listener
        App.addListener('backButton', function (data) {
            const path = window.location.pathname;

            // Define what constitutes the "Home Page"
            // Adjust this based on your actual deployment URL structure
            // e.g. /nithara/index.html or / or /index.html
            const isHomePage =
                path.endsWith('/nithara/') ||
                path.endsWith('/index.html') && (
                    path.endsWith('/nithara/index.html') ||
                    path === '/index.html' ||
                    path === '/' ||
                    // Ensure we don't accidentally match sub-app index.html files
                    (!path.includes('/salary/') &&
                        !path.includes('/emi/') &&
                        !path.includes('/dcrg/') &&
                        !path.includes('/pay-revision/') &&
                        !path.includes('/sip/') &&
                        !path.includes('/housing/') &&
                        !path.includes('/calculator/'))
                );

            if (isHomePage) {
                // If at home, EXIT the app
                App.exitApp();
            } else {
                // If anywhere else, go back in history
                window.history.back();
            }
        });
    }

    // Initialize
    if (document.readyState === 'complete') {
        setupBackButton();
    } else {
        window.addEventListener('load', setupBackButton);
    }
})();
