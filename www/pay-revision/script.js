document.addEventListener('DOMContentLoaded', () => {
    const inputs = [
        'basic-pay-in',
        'da-pend-perc',
        'hra-old-perc',
        'fitment-perc',
        'bal-da-perc',
        'hra-perc'
    ];

    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', calculate);
        el.addEventListener('click', function () {
            this.select();
        });
    });

    let payStagesList = [
        23000, 23700, 24400, 25100, 25800, 26500, 27200, 27900, 28700, 29500,
        30300, 31100, 32000, 32900, 33800, 34700, 35600, 36500, 37400, 38300,
        39300, 40300, 41300, 42300, 43400, 44500, 45600, 46700, 47800, 49000,
        50200, 51400, 52600, 53900, 55200, 56500, 57900, 59300, 60700, 62200,
        63700, 65200, 66800, 68400, 70000, 71800, 73600, 75400, 77200, 79000,
        81000, 83000, 85000, 87000, 89000, 91200, 93400, 95600, 97800, 100300,
        102800, 105300, 107800, 110300, 112800, 115300, 118100, 120900, 123700,
        126500, 129300, 132100, 134900, 137700, 140500, 143600, 146700, 149800,
        153200, 156600, 160000, 163400, 166800
    ];

    const basicPayInput = document.getElementById('basic-pay-in');
    const dropdown = document.getElementById('custom-dropdown');

    basicPayInput.dataset.lastValid = basicPayInput.value;

    function renderDropdown(filterText = "") {
        dropdown.innerHTML = "";
        const filtered = filterText
            ? payStagesList.filter(stage => stage.toString().startsWith(filterText))
            : payStagesList;

        if (filtered.length === 0) {
            dropdown.classList.remove('show');
            return;
        }

        filtered.forEach(stage => {
            const li = document.createElement('li');
            li.textContent = stage;
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                selectValue(stage);
            });
            dropdown.appendChild(li);
        });
    }

    function selectValue(val) {
        basicPayInput.value = val;
        basicPayInput.dataset.lastValid = val;
        dropdown.classList.remove('show');
        calculate();
    }

    function showDropdown() {
        renderDropdown("");
        dropdown.classList.add('show');
        const currentVal = parseInt(basicPayInput.value);
        if (currentVal) {
            const items = Array.from(dropdown.querySelectorAll('li'));
            const match = items.find(li => li.textContent == currentVal);
            if (match) {
                match.scrollIntoView({ block: 'center' });
                match.classList.add('active');
            }
        }
    }

    function hideDropdown() {
        setTimeout(() => {
            dropdown.classList.remove('show');
        }, 150);
    }

    basicPayInput.addEventListener('focus', function () {
        this.select();
        showDropdown();
    });

    basicPayInput.addEventListener('click', function () {
        showDropdown();
    });

    basicPayInput.addEventListener('blur', hideDropdown);

    basicPayInput.addEventListener('input', function () {
        const val = this.value;
        if (/^\d*$/.test(val)) {
            this.dataset.lastValid = val;
            renderDropdown(val);
        } else {
            this.value = this.dataset.lastValid || "";
        }
    });

    function calculate() {
        const bp = parseFloat(document.getElementById('basic-pay-in').value) || 0;
        const daPendPerc = parseFloat(document.getElementById('da-pend-perc').value) || 0;
        const hraOldPerc = parseFloat(document.getElementById('hra-old-perc').value) || 0;
        const fitmentPerc = parseFloat(document.getElementById('fitment-perc').value) || 0;
        const balDaPerc = parseFloat(document.getElementById('bal-da-perc').value) || 0;
        const hraNewPerc = parseFloat(document.getElementById('hra-perc').value) || 0;

        const daMerged = bp * 0.31;
        const fitment = bp * (fitmentPerc / 100);
        const actualTotal = bp + daMerged + fitment;

        let bpFixed = 0;
        if (bp > 0) {
            bpFixed = Math.ceil(actualTotal / 100) * 100;
            const stage = payStagesList.find(s => s >= bpFixed);
            if (stage) bpFixed = stage;
        }

        const balDa = bpFixed * (balDaPerc / 100);
        const hraNew = bpFixed * (hraNewPerc / 100);
        const grossNew = bpFixed + balDa + hraNew;

        const daOld = bp * 0.22;
        const daPend = bp * (daPendPerc / 100);
        const hraOld = bp * (hraOldPerc / 100);
        const grossOld = bp + daOld + daPend + hraOld;

        const growth = grossOld > 0 ? grossNew - grossOld : 0;

        updateValue('gross-new-val', grossNew);
        updateValue('gross-old-val', grossOld);
        updateValue('growth-val', growth);
        updateValue('revised-bp-val', bpFixed);
        updateValue('res-bp-new', bp);
        updateValue('res-da-merged', daMerged);
        updateValue('res-fitment', fitment);
        updateValue('res-actual-total', actualTotal);
        updateValue('res-bp-fixed', bpFixed);
        updateValue('res-bal-da', balDa);
        updateValue('res-hra-new', hraNew);
        updateValue('res-gross-new', grossNew);
        updateValue('res-bp-old', bp);
        updateValue('res-da-old', daOld);
        updateValue('res-da-pend', daPend);
        updateValue('res-hra-old', hraOld);
        updateValue('res-gross-old', grossOld);

        const growthEl = document.getElementById('growth-val');
        if (growth > 0) {
            growthEl.classList.add('pulse');
        } else {
            growthEl.classList.remove('pulse');
        }
    }

    function updateValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = Math.round(val).toLocaleString('en-IN');
    }

    calculate();

    const prepareForPDF = () => {
        const printDate = document.getElementById('printDate');
        if (printDate) {
            printDate.textContent = "Generated on: " + new Date().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        document.body.classList.add('pdf-mode');
        return "PayRevision_Report_" + new Date().getTime();
    };

    const cleanupAfterPDF = () => {
        document.body.classList.remove('pdf-mode');
    };

    const generatePDFBlob = async () => {
        window.scrollTo(0, 0);
        const reportTitle = prepareForPDF();
        const element = document.querySelector('.container');
        const opt = {
            margin: 10,
            filename: `${reportTitle}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            const cap = window.Capacitor;
            const hasNativePlugins = !!(cap && cap.Plugins && (cap.Plugins.Filesystem || cap.Plugins.Share));

            if (hasNativePlugins) {
                const pdfDataUri = await html2pdf().set(opt).from(element).output('datauristring');
                cleanupAfterPDF();
                return { dataUri: pdfDataUri, title: reportTitle, isNative: true };
            }

            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            cleanupAfterPDF();
            return { blob: pdfBlob, title: reportTitle, isNative: false };
        } catch (err) {
            cleanupAfterPDF();
            throw err;
        }
    };

    const handleNativeSave = async (dataUri, filename) => {
        try {
            const cap = window.Capacitor;
            const Filesystem = cap?.Plugins?.Filesystem;
            const Share = cap?.Plugins?.Share;

            if (!Filesystem || !Share) {
                throw new Error("Android Bridge missing.");
            }

            const base64Data = dataUri.split(',')[1] || dataUri;
            const fileResult = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: 'CACHE'
            });

            await Share.share({
                title: 'Calculation Report',
                text: 'Sharing my calculation report.',
                url: fileResult.uri,
                dialogTitle: 'Share PDF'
            });
        } catch (e) {
            console.error('Native share failed', e);
            alert('Error: ' + e.message);
        }
    };

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const originalText = shareBtn.innerHTML;
            shareBtn.innerHTML = "<span>⏳</span> Preparing PDF...";
            shareBtn.disabled = true;

            try {
                const result = await generatePDFBlob();

                if (result.isNative) {
                    await handleNativeSave(result.dataUri, `${result.title}.pdf`);
                } else if (navigator.share) {
                    const file = new File([result.blob], `${result.title}.pdf`, { type: 'application/pdf' });
                    await navigator.share({
                        files: [file],
                        title: 'Calculation Report',
                        text: 'Sharing my calculation report.'
                    });
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(result.blob);
                    link.download = `${result.title}.pdf`;
                    link.click();
                }
            } catch (err) {
                console.error(err);
                alert("Sharing failed. Try again.");
            } finally {
                shareBtn.innerHTML = originalText;
                shareBtn.disabled = false;
            }
        });
    }
});
