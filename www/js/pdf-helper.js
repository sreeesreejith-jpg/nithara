window.PDFHelper = {
    /**
     * Share a PDF blob using Capacitor or Web Share API
     */
    share: async function (blob, fileName, title) {
        console.log('PDFHelper.share called', { fileName });
        const cap = window.Capacitor;
        const isNative = !!(cap && (cap.isNative || (cap.Plugins && cap.Plugins.Share)));

        // Ensure filename has .pdf extension
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
        }

        const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

        try {
            if (isNative && cap.Plugins && cap.Plugins.Filesystem && cap.Plugins.Share) {
                console.log('Using Capacitor native share');

                // 1. Convert Blob to Base64
                const base64Data = await this._blobToBase64(blob);

                // 2. Save to Temporary Directory
                const fileResult = await cap.Plugins.Filesystem.writeFile({
                    path: safeFileName,
                    data: base64Data,
                    directory: 'CACHE' // Using string for better compatibility
                });

                console.log('File saved for sharing:', fileResult.uri);

                // 3. Share
                await cap.Plugins.Share.share({
                    title: title || 'Report',
                    text: title || 'Calculation Report',
                    url: fileResult.uri, // Some Android versions prefer 'url' for file URIs
                    files: [fileResult.uri]
                });

                return { success: true, method: 'native-share' };
            } else if (navigator.share) {
                console.log('Using Web Share API');
                const file = new File([blob], safeFileName, { type: 'application/pdf' });

                // Check if sharing files is actually supported
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: title || 'Report',
                        text: title || 'Calculation Report'
                    });
                    return { success: true, method: 'web-share' };
                } else {
                    console.log('Web Share API does not support files, falling back to download');
                    return await this.download(blob, safeFileName);
                }
            } else {
                console.log('No share API available, using download');
                return await this.download(blob, safeFileName);
            }
        } catch (err) {
            console.error("PDFHelper Share Error:", err);
            // Fallback to download if sharing fails
            if (err.name !== 'AbortError') {
                console.log('Sharing failed, attempting download fallback...');
                return await this.download(blob, safeFileName);
            }
            throw err;
        }
    },

    /**
     * Download a PDF blob - enhanced for native support
     */
    download: async function (blob, fileName) {
        console.log('PDFHelper.download called', { fileName });
        const cap = window.Capacitor;
        const isNative = !!(cap && (cap.isNative || (cap.Plugins && cap.Plugins.Filesystem)));

        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
        }
        const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

        try {
            if (isNative && cap.Plugins && cap.Plugins.Filesystem) {
                console.log('Using Capacitor native download (save)');

                const base64Data = await this._blobToBase64(blob);

                // For "Download", we try to save to Documents which is more permanent
                const fileResult = await cap.Plugins.Filesystem.writeFile({
                    path: safeFileName,
                    data: base64Data,
                    directory: 'DOCUMENTS',
                    recursive: true
                });

                console.log('File saved to Documents:', fileResult.uri);

                // Show a native-like feedback if possible, or just alert
                alert("Report saved to your Documents folder as " + safeFileName);

                return { success: true, method: 'native-save', uri: fileResult.uri };
            } else {
                console.log('Using browser download anchor');
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = safeFileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                // Small delay to ensure click works before cleanup
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 1000);

                return { success: true, method: 'browser-download' };
            }
        } catch (err) {
            console.error("PDFHelper Download Error:", err);
            // If native save fails (e.g. permission), try browser download as absolute last resort
            if (isNative) {
                console.log('Native save failed, trying browser download fallback...');
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank'); // Sometimes works better in WebViews than <a> tag
            }
            throw err;
        }
    },

    /**
     * Helper to convert Blob to Base64
     */
    _blobToBase64: function (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
        });
    }
};

