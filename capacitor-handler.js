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
            // Check if canGoBack is available (mostly for Android)
            if (data && data.canGoBack) {
                window.history.back();
                return;
            }

            const path = window.location.pathname;

            // Define sub-app directories (folder names)
            // Note: We check if path *ends with* typical home page markers to rule out "Home"

            // Logic:
            // If we are deep inside a folder structure, we go UP (../) or to root.
            // If we are at root ('/', '/index.html', '/nithara/', '/nithara/index.html'), we EXIT.

            const isHomePage =
                path.endsWith('/nithara/') ||
                path.endsWith('/nithara/index.html') ||
                path === '/' ||
                path === '/index.html' ||
                // Handling local file system paths often used in dev/debug APKs
                path.endsWith('/www/index.html');

            if (!isHomePage) {
                // CASE 1: NOT at Home -> Navigate one level UP
                // We use history.back() if possible, or force replace to parent
                if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
                    window.history.back();
                } else {
                    // Fallback: Force go to root/home
                    window.location.replace('../index.html');
                }

            } else {
                // CASE 2: At Home -> EXIT App
                // Try Capacitor exit method first
                try {
                    App.exitApp();
                } catch (e) {
                    console.error("App.exitApp failed:", e);
                }

                // Fallback for older WebView interfaces or if Capacitor fails
                if (navigator.app && navigator.app.exitApp) {
                    navigator.app.exitApp();
                } else if (navigator.device && navigator.device.exitApp) {
                    navigator.device.exitApp();
                }
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
