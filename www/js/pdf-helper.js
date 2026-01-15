window.PDFHelper = {
    /**
     * Share a PDF blob using Capacitor or Web Share API
     */
    share: async function (blob, fileName, title) {
        console.log('PDFHelper.share initiation', { fileName, size: blob.size });

        const cap = window.Capacitor;
        const isNative = !!(cap && (cap.isNative || (cap.getPlatform && cap.getPlatform() !== 'web')) && cap.Plugins && cap.Plugins.Filesystem && cap.Plugins.Share);

        // Debug help:
        if (!cap && /android/i.test(navigator.userAgent)) {
            console.warn("Capacitor bridge not detected in Android environment");
            // alert("DEBUG: Capacitor Bridge Missing! PDF functions may fail.");
        }

        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
        }
        const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

        try {
            if (isNative) {
                console.log('Native sharing detected');

                // 1. Permission Check
                try {
                    if (cap.Plugins.Filesystem.checkPermissions) {
                        const status = await cap.Plugins.Filesystem.checkPermissions();
                        if (status.publicStorage !== 'granted' && status.storage !== 'granted') {
                            await cap.Plugins.Filesystem.requestPermissions();
                        }
                    }
                } catch (pErr) {
                    console.warn('Permission check failed', pErr);
                }

                // 2. Write to Cache (Required for Sharing)
                const base64Data = await this._blobToBase64(blob);
                const fileResult = await cap.Plugins.Filesystem.writeFile({
                    path: safeFileName,
                    data: base64Data,
                    directory: 'CACHE'
                });

                console.log('Native file saved for share:', fileResult.uri);

                // 3. Share the File URI
                await cap.Plugins.Share.share({
                    title: title || 'Report',
                    text: 'View my calculation report',
                    files: [fileResult.uri], // Capacitor 5+ prefers files array
                    dialogTitle: 'Share PDF'
                });

                return { success: true, method: 'native-share' };

            } else if (navigator.share) {
                console.log('Web Share API detected');
                const file = new File([blob], safeFileName, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: title || 'Report',
                        text: 'PDF Report'
                    });
                    return { success: true, method: 'web-share' };
                } else {
                    console.warn('navigator.share available but file sharing NOT supported. Falling back.');
                    return await this.download(blob, safeFileName);
                }
            } else {
                console.log('No sharing API available, falling back to download');
                return await this.download(blob, safeFileName);
            }
        } catch (err) {
            console.error("PDFHelper Share Error:", err);
            if (err.name !== 'AbortError' && !err.toString().includes('AbortError')) {
                alert("Share failed (" + (err.message || 'Error') + "). Attempting download instead...");
                return await this.download(blob, safeFileName);
            }
            throw err;
        }
    },

    /**
     * Download/Save a PDF blob
     */
    download: async function (blob, fileName) {
        console.log('PDFHelper.download initiation', { fileName });

        const cap = window.Capacitor;
        const isNative = !!(cap && (cap.isNative || (cap.getPlatform && cap.getPlatform() !== 'web')) && cap.Plugins && cap.Plugins.Filesystem);

        // Debug help:
        if (!cap && /android/i.test(navigator.userAgent)) {
            console.warn("Capacitor bridge not detected in Android environment");
        }

        if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
        }
        const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_');

        try {
            if (isNative) {
                console.log('Native save initiated');
                const base64Data = await this._blobToBase64(blob);

                // Attempt to save to DOCUMENTS
                const fileResult = await cap.Plugins.Filesystem.writeFile({
                    path: safeFileName,
                    data: base64Data,
                    directory: 'DOCUMENTS',
                    recursive: true
                });

                console.log('Native save success:', fileResult.uri);
                alert("✅ Saved to Documents!\n\nFile: " + safeFileName);

                return { success: true, method: 'native-save', uri: fileResult.uri };

            } else {
                console.log('Browser download process started');
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const url = URL.createObjectURL(blob);

                if (isMobile) {
                    console.log('Mobile detected: Showing manual download prompt');

                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:20px;backdrop-filter:blur(5px);';

                    const card = document.createElement('div');
                    card.style.cssText = 'background:#1e293b;padding:30px;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);width:100%;max-width:320px;text-align:center;border:1px solid rgba(255,255,255,0.1);';

                    card.innerHTML = `
                        <div style="font-size:3.5rem;margin-bottom:15px;">📊</div>
                        <h3 style="color:white;margin:0 0 10px 0;font-family:system-ui,-apple-system,sans-serif;font-size:1.4rem;">Report Ready</h3>
                        <p style="color:#94a3b8;margin:0 0 25px 0;font-size:0.95rem;line-height:1.5;font-family:system-ui,-apple-system,sans-serif;">Click the button below to view and save your calculation report.</p>
                        <a href="${url}" target="_blank" id="manualDownloadBtn" style="display:block;background:#3b82f6;color:white;text-decoration:none;padding:14px;border-radius:12px;font-weight:bold;font-family:system-ui,-apple-system,sans-serif;font-size:1.1rem;box-shadow:0 4px 6px -1px rgba(59,130,246,0.5);">OPEN PDF REPORT</a>
                        <button id="closeOverlay" style="margin-top:20px;background:none;border:none;color:#64748b;font-size:0.85rem;cursor:pointer;font-family:system-ui,-apple-system,sans-serif;text-decoration:underline;">Close</button>
                    `;

                    overlay.appendChild(card);
                    document.body.appendChild(overlay);

                    const link = card.querySelector('#manualDownloadBtn');
                    const closeBtn = card.querySelector('#closeOverlay');

                    link.onclick = () => {
                        // Keep overlay briefly for feedback, then remove
                        setTimeout(() => { if (overlay.parentNode) document.body.removeChild(overlay); }, 1000);
                    };
                    closeBtn.onclick = () => {
                        if (overlay.parentNode) document.body.removeChild(overlay);
                        URL.revokeObjectURL(url);
                    };

                    return { success: true, method: 'browser-manual-prompt' };
                } else {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = safeFileName;
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 5000);
                    return { success: true, method: 'browser-download' };
                }
            }
        } catch (err) {
            console.error("PDFHelper Download Error:", err);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            alert("Auto-download failed. Opening PDF in new tab if possible...");
            throw err;
        }
    },

    /**
     * Internal: Convert Blob to Base64
     */
    _blobToBase64: function (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (!result || typeof result !== 'string') {
                    return reject(new Error("FileReader result is empty"));
                }
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
        });
    }
};

