/**
 * Centralized PDF Save and Share Helper for Nithara Apps
 * Handles Capacitor (Android/iOS) and Web environments
 */

window.PDFHelper = {
    /**
     * Share a PDF blob using Capacitor or Web Share API
     * @param {Blob} blob - The PDF blob
     * @param {string} fileName - Suggested filename (e.g. 'salary_report.pdf')
     * @param {string} title - Title for the share dialog
     */
    share: async function (blob, fileName, title) {
        const cap = window.Capacitor;
        const isNative = !!(cap && cap.isNative);

        // Ensure filename has .pdf extension
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
        }

        // Sanitize filename for Filesystem
        const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

        try {
            if (isNative && cap.Plugins && cap.Plugins.Filesystem && cap.Plugins.Share) {
                console.log('Using Capacitor native share');
                // 1. Convert Blob to Base64
                const reader = new FileReader();
                const base64Data = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = () => reject("FileReader error");
                    reader.readAsDataURL(blob);
                });

                // 2. Save to Temporary Directory
                const fileResult = await cap.Plugins.Filesystem.writeFile({
                    path: safeFileName,
                    data: base64Data,
                    directory: cap.Plugins.Filesystem.Directory.Cache
                });

                console.log('File saved to:', fileResult.uri);

                // 3. Share using the Files API (more robust than 'url')
                await cap.Plugins.Share.share({
                    title: title || 'Report',
                    files: [fileResult.uri]
                });

                return { success: true, method: 'native' };
            } else if (navigator.share && navigator.canShare) {
                // Check if browser supports sharing files
                const file = new File([blob], safeFileName, { type: 'application/pdf' });

                if (navigator.canShare({ files: [file] })) {
                    console.log('Using Web Share API with files');
                    await navigator.share({
                        files: [file],
                        title: title || 'Report'
                    });
                    return { success: true, method: 'web-share' };
                } else {
                    console.log('Web Share API does not support files, falling back to download');
                    this.download(blob, safeFileName);
                    return { success: true, method: 'download-fallback' };
                }
            } else {
                // Fallback to Download
                console.log('No share API available, using download');
                this.download(blob, safeFileName);
                return { success: true, method: 'download' };
            }
        } catch (err) {
            console.error("PDFHelper Error:", err);
            // Don't alert here, let the caller handle it if they want
            throw err;
        }
    },

    /**
     * Download a PDF blob
     */
    download: function (blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
};
