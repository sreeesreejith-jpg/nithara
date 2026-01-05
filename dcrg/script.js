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

    // Global variable to store stages
    // Global variable to store stages
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

    // --- Custom Dropdown Logic ---
    const dropdown = document.getElementById('custom-dropdown');

    // Store current value
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
        calculateAll(); // Call calculation directly
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

    // Input Listeners
    basicPayInput.addEventListener('focus', function () {
        this.select();
        showDropdown();
    });

    basicPayInput.addEventListener('click', function () {
        this.select();
        showDropdown();
    });

    basicPayInput.addEventListener('input', function () {
        // Filter live
        renderDropdown(this.value);
        dropdown.classList.add('show');
        calculateAll();
    });

    basicPayInput.addEventListener('blur', function () {
        if (this.value.trim() === "") {
            this.value = this.dataset.lastValid || "";
            calculateAll();
        }
        hideDropdown();
    });

    // Fetch external data (optional)
    fetch('../data/pay_stages.json')
        .then(response => response.json())
        .then(data => {
            if (data.payStages) {
                payStagesList = data.payStages;
            }
        })
        .catch(err => console.log('Using embedded pay stages'));

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
     * Format number without commas
     */
    const formatAmount = (num) => {
        return Math.round(num).toString();
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
        avgEmolumentsInput.value = Math.round(avgEmoluments);

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
        const displayValue = (val) => (val > 0) ? formatAmount(val) : "";

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
