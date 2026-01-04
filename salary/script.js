document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');

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

    // Earnings Inputs
    const basicPay = document.getElementById('basic-pay');
    const daPerc = document.getElementById('da-perc');
    const daPendingPerc = document.getElementById('da-pending-perc');
    const hraPerc = document.getElementById('hra-perc');
    const otherEarnings = document.getElementById('other-earnings');

    // Earnings Calculated Displays
    const daVal = document.getElementById('da-val');
    const daPendingVal = document.getElementById('da-pending-val');
    const hraVal = document.getElementById('hra-val');

    // Deductions Inputs
    const gpfSub = document.getElementById('gpf-sub');
    const gis = document.getElementById('gis');
    const sli = document.getElementById('sli');
    const medisep = document.getElementById('medisep');
    const sliLoan = document.getElementById('sli-loan');
    const otherDeductions = document.getElementById('other-deductions');


    // Final Summary Displays
    const grossValDisplay = document.getElementById('gross-salary-val');
    const totalDeductDisplay = document.getElementById('total-deduction-val');
    const netValDisplay = document.getElementById('net-salary-val');

    const grossBottom = document.getElementById('gross-salary-bottom');
    const deductBottom = document.getElementById('total-deduction-bottom');
    const netBottom = document.getElementById('net-salary-bottom');

    function formatCurrency(num) {
        return Math.round(num).toLocaleString('en-IN');
    }

    function calculate() {
        const bp = parseFloat(basicPay.value) || 0;
        const daP = parseFloat(daPerc.value) || 0;
        const dapP = parseFloat(daPendingPerc.value) || 0;
        const hrP = parseFloat(hraPerc.value) || 0;
        const otherEarn = parseFloat(otherEarnings.value) || 0;

        // Calculate individual earnings
        const da = bp * (daP / 100);
        const dap = bp * (dapP / 100);
        const hra = bp * (hrP / 100);

        // Update earnings labels
        daVal.innerText = formatCurrency(da);
        daPendingVal.innerText = formatCurrency(dap);
        hraVal.innerText = formatCurrency(hra);

        // Gross Salary
        const gross = bp + da + dap + hra + otherEarn;
        grossValDisplay.innerText = formatCurrency(gross);

        // Deductions
        const d1 = parseFloat(gpfSub.value) || 0;
        const d2 = parseFloat(gis.value) || 0;
        const d3 = parseFloat(sli.value) || 0;
        const d4 = parseFloat(medisep.value) || 0;
        const d5 = parseFloat(sliLoan.value) || 0;
        const d6 = parseFloat(otherDeductions.value) || 0;


        const totalDeductions = d1 + d2 + d3 + d4 + d5 + d6;
        totalDeductDisplay.innerText = formatCurrency(totalDeductions);

        // Net Salary
        const net = gross - totalDeductions;
        netValDisplay.innerText = formatCurrency(net);

        // Update bottom summaries
        if (grossBottom) grossBottom.innerText = formatCurrency(gross);
        if (deductBottom) deductBottom.innerText = formatCurrency(totalDeductions);
        if (netBottom) netBottom.innerText = formatCurrency(net);
    }

    // Add listeners to all inputs
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Initial calculation
    calculate();
});
