/**
 * Kerala Pension & DCRG Calculator Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Input elements
    const basicPayInput = document.getElementById('basicPay');
    const daPercentageInput = document.getElementById('daPercentage');
    const serviceYearsInput = document.getElementById('serviceYears');
    const avgEmolumentsInput = document.getElementById('avgEmoluments');

    // Display elements
    const pensionAmountDisplay = document.getElementById('pensionAmount');
    const drAmountDisplay = document.getElementById('drAmount');
    const totalMonthlyPensionDisplay = document.getElementById('totalMonthlyPension');
    const commutationAmountDisplay = document.getElementById('commutationAmount');
    const balancePensionDisplay = document.getElementById('balancePension');
    const dcrgAmountDisplay = document.getElementById('dcrgAmount');
    const totalBenefitsDisplay = document.getElementById('totalBenefits');
    const netMonthlyPensionDisplay = document.getElementById('netMonthlyPension');
    const pensionFactorVal = document.getElementById('pensionFactorVal');
    const dcrgFactorVal = document.getElementById('dcrgFactorVal');

    // Dashboard elements
    const totalBenefitsHeader = document.getElementById('totalBenefitsHeader');
    const commuteHeader = document.getElementById('commuteHeader');
    const dcrgHeader = document.getElementById('dcrgHeader');
    const balanceHeader = document.getElementById('balanceHeader');

    const inputs = [basicPayInput, daPercentageInput, serviceYearsInput];

    /**
     * Format number as Indian Currency (₹)
     */
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(num);
    };

    /**
     * Main calculation function
     */
    const calculateAll = () => {
        const bp = parseFloat(basicPayInput.value) || 0;
        const da = parseFloat(daPercentageInput.value) || 0;
        let years = parseFloat(serviceYearsInput.value) || 0;

        // Validation & Constraints
        if (years > 35) years = 35;
        // Note: Rules say min 10, but we process whatever is there for instant feedback

        // 1. Average Emoluments
        const avgEmoluments = bp + (bp * da / 100);
        avgEmolumentsInput.value = Math.round(avgEmoluments).toLocaleString('en-IN');

        // 2. Pension Calculation
        // Formula: (Average Emoluments / 2) * (Completed Service / 30)
        let pensionFactor = years / 30;
        if (pensionFactor > 1.0) pensionFactor = 1.0;

        const pension = (avgEmoluments / 2) * pensionFactor;

        // 3. Pension Commutation
        // Formula: 40% of Pension * 11.42 * 12
        const commutationAmount = pension * 0.40 * 11.42 * 12;
        const balancePension = pension * 0.60;
        const netTotalPension = balancePension;

        // 4. DCRG Calculation
        // Formula: (Average Emoluments) * (Completed Service / 2)
        // Rule: Factor (Years / 2) must not exceed 16.5
        let dcrgFactor = years / 2;
        if (dcrgFactor > 16.5) dcrgFactor = 16.5;

        let dcrg = avgEmoluments * dcrgFactor;
        // Limit DCRG to 16 Lakhs
        if (dcrg > 1600000) dcrg = 1600000;

        // 5. Total Benefits
        const totalLumpSum = commutationAmount + dcrg;

        // Update Dashboard
        const displayValue = (val) => (val > 0) ? formatCurrency(val) : "";

        if (totalBenefitsHeader) totalBenefitsHeader.textContent = displayValue(totalLumpSum);
        if (commuteHeader) commuteHeader.textContent = displayValue(commutationAmount);
        if (dcrgHeader) dcrgHeader.textContent = displayValue(dcrg);
        if (balanceHeader) balanceHeader.textContent = displayValue(balancePension);
    };

    // Attach listeners
    inputs.forEach(input => {
        input.addEventListener('input', calculateAll);
    });

    // Initial calculation
    calculateAll();
});
