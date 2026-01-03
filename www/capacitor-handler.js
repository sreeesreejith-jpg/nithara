(function () {
    /**
     * Capacitor Hardware Back Button Handler
     * 
     * Behavior:
     * 1. On Sub-pages (Salary, EMI, etc.): Back button goes to Home (or previous history).
     * 2. On Home page: Back button EXITS the app.
     * 
     * This prevents the app from closing unexpectedly when trying to navigate back to the menu.
     */

    // Only initialize if Capacitor is available (running as an app)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const App = window.Capacitor.Plugins.App;

        App.addListener('backButton', (data) => {
            const currentPath = window.location.pathname;

            // Check if we are currently inside a sub-app directory
            const subAppFolders = [
                '/salary/',
                '/emi/',
                '/pay-revision/',
                '/dcrg/',
                '/housing/',
                '/sip/',
                '/calculator/'
            ];

            const isSubPage = subAppFolders.some(folder => currentPath.includes(folder));

            if (isSubPage) {
                // Sub-page behavior: Go back to the previous page or Home
                if (data.canGoBack) {
                    window.history.back();
                } else {
                    // If no history within the app webview, force-return to the main portal
                    window.location.href = '../index.html';
                }
            } else {
                // Home page behavior: Exit the app
                // This matches the behavior of standard Android apps
                App.exitApp();
            }
        });

        console.log('Nithara: Capacitor back button handler initialized.');
    }
})();
