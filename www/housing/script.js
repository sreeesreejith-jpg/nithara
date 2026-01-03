document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const landAreaInput = document.getElementById('land-area');
    const costPerCentInput = document.getElementById('cost-per-cent');
    const builtUpAreaInput = document.getElementById('built-up-area');
    const costPerSqftInput = document.getElementById('cost-per-sqft');
    const otherExpensesInput = document.getElementById('other-expenses');
    const netSalaryInput = document.getElementById('net-salary');
    const rentInput = document.getElementById('rent');

    // Display Elements
    const monthlyEmiDisplay = document.getElementById('monthly-emi');
    const totalPrincipalBottom = document.getElementById('total-principal-bottom');
    const balanceSalaryDisplay = document.getElementById('balance-salary');
    const balanceAfterRentDisplay = document.getElementById('balance-after-rent');
    const finalBalanceDisplay = document.getElementById('final-balance');

    // Constants
    const PLOT_CHARGE_PERCENT = 0.12;
    const LOAN_TENURE_YEARS = 30;
    const ANNUAL_INTEREST_RATE = 7.5;

    let currentEmi = 0;

    function formatNumber(num) {
        // Remove currency symbols, just format digits with commas
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(num);
    }

    function parseIndianNumber(str) {
        if (!str) return 0;
        // Remove commas and parse
        return parseFloat(str.replace(/,/g, '')) || 0;
    }

    function calculate() {
        const landArea = parseFloat(landAreaInput.value) || 0;
        const costPerCent = parseFloat(costPerCentInput.value) || 0;
        const builtUpArea = parseFloat(builtUpAreaInput.value) || 0;
        const costPerSqft = parseFloat(costPerSqftInput.value) || 0;
        const otherExpenses = parseFloat(otherExpensesInput.value) || 0;

        // Plot Calculations
        const plotBaseCost = landArea * costPerCent;
        const netPlotCost = plotBaseCost * 1.12;

        // Construction Calculations
        const constructionCost = builtUpArea * costPerSqft;

        // Loan Calculations
        const principal = netPlotCost + constructionCost + otherExpenses;

        const monthlyRate = ANNUAL_INTEREST_RATE / 12 / 100;
        const totalMonths = LOAN_TENURE_YEARS * 12;

        let emi = 0;
        if (principal > 0) {
            emi = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }

        currentEmi = emi;

        // Update UI (No symbols)
        monthlyEmiDisplay.textContent = formatNumber(emi);
        totalPrincipalBottom.textContent = formatNumber(principal);

        updateBalances();
    }

    function updateBalances() {
        const netSalary = parseIndianNumber(netSalaryInput.value);
        const rent = parseIndianNumber(rentInput.value);

        // Balance Salary (Net - EMI)
        const balanceEmi = netSalary - currentEmi;
        balanceSalaryDisplay.value = formatNumber(balanceEmi);

        // Balance After Rent (Net - Rent)
        const balanceRent = netSalary - rent;
        balanceAfterRentDisplay.value = formatNumber(balanceRent);

        // Final Balance (Balance After Rent - Balance After EMI)
        const finalBalance = balanceRent - balanceEmi;
        finalBalanceDisplay.value = formatNumber(finalBalance);
    }

    // Event Listeners
    [landAreaInput, costPerCentInput, builtUpAreaInput, costPerSqftInput, otherExpensesInput].forEach(input => {
        input.addEventListener('input', calculate);
    });

    [netSalaryInput, rentInput].forEach(input => {
        input.addEventListener('input', updateBalances);
    });

    // Improve selection UX: Clear on focus/click to show all options, restore on blur if empty
    const setupImprovedUX = (input) => {
        let tempValue = "";

        const clearInput = () => {
            tempValue = input.value;
            input.value = "";
        };

        input.addEventListener('focus', clearInput);
        input.addEventListener('click', clearInput);

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.value = tempValue;
            }
            updateBalances();
        });
    };

    setupImprovedUX(netSalaryInput);
    setupImprovedUX(rentInput);

    // Initial Calculation
    calculate();
});
