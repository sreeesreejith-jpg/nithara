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
        document.getElementById(id).addEventListener('input', calculate);
    });

    // Fetch and populate Pay Stages
    fetch('../data/pay_stages.json')
        .then(response => response.json())
        .then(data => {
            const dataList = document.getElementById('pay-stages');
            if (dataList && data.payStages) {
                data.payStages.forEach(stage => {
                    const option = document.createElement('option');
                    option.value = stage;
                    dataList.appendChild(option);
                });
            }
        })
        .catch(err => console.error('Error loading pay stages:', err));

    function calculate() {
        const bp = parseFloat(document.getElementById('basic-pay-in').value) || 0;

        // Before Revision Percentages
        const daOldPerc = 22; // Fixed
        const daPendPerc = parseFloat(document.getElementById('da-pend-perc').value) || 0;
        const hraOldPerc = parseFloat(document.getElementById('hra-old-perc').value) || 0;

        // After Revision Percentages
        const daMergedPerc = 31; // Fixed
        const fitmentPerc = parseFloat(document.getElementById('fitment-perc').value) || 0;
        const balDaPerc = parseFloat(document.getElementById('bal-da-perc').value) || 0;
        const hraNewPerc = parseFloat(document.getElementById('hra-perc').value) || 0;

        // Before Revision Calculations
        const daOldVal = Math.round(bp * (daOldPerc / 100));
        const daPendVal = Math.round(bp * (daPendPerc / 100));
        const hraOldVal = Math.round(bp * (hraOldPerc / 100));
        const grossOld = bp + daOldVal + daPendVal + hraOldVal;

        // Update Before UI
        document.getElementById('res-bp-old').textContent = bp.toLocaleString();
        document.getElementById('res-da-old').textContent = daOldVal.toLocaleString();
        document.getElementById('res-da-pend').textContent = daPendVal.toLocaleString();
        document.getElementById('res-hra-old').textContent = hraOldVal.toLocaleString();
        document.getElementById('res-gross-old').textContent = grossOld.toLocaleString();
        document.getElementById('gross-old-val').textContent = grossOld.toLocaleString();

        // After Revision Calculations
        const daMergedVal = Math.round(bp * (daMergedPerc / 100));
        const fitmentVal = Math.round(bp * (fitmentPerc / 100));
        const actualTotal = bp + daMergedVal + fitmentVal;

        // BP Fixed At: Rounded to next multiple of 100
        const bpFixed = Math.ceil(actualTotal / 100) * 100;

        // Updated: Bal DA and HRA are calculated on BP Fixed At
        const balDaVal = Math.round(bpFixed * (balDaPerc / 100));
        const hraNewVal = Math.round(bpFixed * (hraNewPerc / 100));
        const grossNew = bpFixed + balDaVal + hraNewVal;

        const growth = grossNew - grossOld;
        const growthPerc = grossOld > 0 ? ((growth / grossOld) * 100).toFixed(1) : 0;

        // Update After UI
        document.getElementById('res-bp-new').textContent = bp.toLocaleString();
        document.getElementById('res-da-merged').textContent = daMergedVal.toLocaleString();
        document.getElementById('res-fitment').textContent = fitmentVal.toLocaleString();
        document.getElementById('res-actual-total').textContent = actualTotal.toLocaleString();
        document.getElementById('res-bp-fixed').textContent = bpFixed.toLocaleString();
        document.getElementById('res-bal-da').textContent = balDaVal.toLocaleString();
        document.getElementById('res-hra-new').textContent = hraNewVal.toLocaleString();
        document.getElementById('res-gross-new').textContent = grossNew.toLocaleString();

        // Summary Cards
        document.getElementById('gross-new-val').textContent = grossNew.toLocaleString();
        document.getElementById('gross-old-val').textContent = grossOld.toLocaleString();
        document.getElementById('growth-val').textContent = `${growth.toLocaleString()} (${growthPerc}%)`;
    }

    // Initial calculation
    calculate();
});
