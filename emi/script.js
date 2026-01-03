const fields = {
    principal: document.getElementById('principal'),
    rate: document.getElementById('rate'),
    tenure: document.getElementById('tenure'),
    emi: document.getElementById('emi')
};

const wrappers = {
    principal: fields.principal.parentElement,
    rate: fields.rate.parentElement,
    tenure: fields.tenure.parentElement,
    emi: fields.emi.parentElement
};

const groups = {
    principal: fields.principal.closest('.input-group'),
    rate: fields.rate.closest('.input-group'),
    tenure: fields.tenure.closest('.input-group'),
    emi: fields.emi.closest('.input-group')
};

const statusMsg = document.getElementById('status-message');
const summaryCard = document.getElementById('summary-card');
const totalInterestEl = document.getElementById('total-interest');
const totalPaymentEl = document.getElementById('total-payment');
const interestPercentEl = document.getElementById('interest-percent');
const donutSegment = document.querySelector('.donut-segment');

// Track user interactions: which fields were manually edited?
// We keep a list of the last 3 edited fields.
let activeInputs = []; // Array of strings (keys of fields)

function updateActiveInputs(id) {
    // Remove if exists
    activeInputs = activeInputs.filter(item => item !== id);
    // Add to end
    activeInputs.push(id);

    // If we have 4, remove the oldest one (index 0)
    // But wait, if we have 4, the user is modifying the 4th one. 
    // The one that was NOT in the previous set of 3 should ideally be the one being calculated, 
    // but if the user decides to edit the calculated one, the "oldest" input of the other 3 becomes the new calculated one.
    if (activeInputs.length > 3) {
        activeInputs.shift();
    }
}

function handleInput(e) {
    const id = e.target.id;

    // If empty value, remove from activeInputs if it was there
    if (e.target.value === '') {
        activeInputs = activeInputs.filter(item => item !== id);
        resetStyles();
        statusMsg.textContent = 'Enter 3 values to compute the missing one.';
        return;
    }

    updateActiveInputs(id);
    calculate();
}

Object.values(fields).forEach(field => {
    field.addEventListener('input', handleInput);
});

// Clear inputs on load
window.addEventListener('load', () => {
    Object.values(fields).forEach(field => field.value = '');
    activeInputs = [];
    resetStyles();
    statusMsg.textContent = 'Enter 3 values to compute the missing one.';
});

function calculate() {
    // We need exactly 3 active inputs to calculate the 4th
    if (activeInputs.length < 3) {
        resetStyles();
        return;
    }

    // Identify the target field (the one NOT in activeInputs)
    // If we have 3 active inputs, the 4th one is the target.
    // If we had more logic, we'd pick the one missing from the keys.
    const allKeys = Object.keys(fields);
    const targetKey = allKeys.find(key => !activeInputs.includes(key));

    if (!targetKey) return; // Should not happen if logic is correct

    // Get values
    const P = parseFloat(fields.principal.value);
    const R = parseFloat(fields.rate.value);
    const T = parseFloat(fields.tenure.value);
    const E = parseFloat(fields.emi.value);

    let result = null;

    // Perform calculation based on what is missing (Target)
    // Note: We use the values from the DOM. If a value is missing but it's supposed to be an input... well, activeInputs logic handles "which ones imply the others".
    // but we need to ensure the values are valid numbers.

    try {
        switch (targetKey) {
            case 'emi':
                if (validate(P, R, T)) result = calcEMI(P, R, T);
                break;
            case 'principal':
                if (validate(E, R, T)) result = calcPrincipal(E, R, T);
                break;
            case 'tenure':
                if (validate(P, R, E)) result = calcTenure(P, R, E);
                break;
            case 'rate':
                if (validate(P, T, E)) result = calcRate(P, T, E);
                break;
        }
    } catch (err) {
        // Calculation error (e.g. impossible values)
        console.error(err);
        result = null;
    }

    // Update UI
    resetStyles();

    if (result !== null && result !== Infinity && !isNaN(result) && result > 0) {
        // Set value
        fields[targetKey].value = formatValue(targetKey, result);

        // Highlight
        wrappers[targetKey].classList.add('computed');
        groups[targetKey].classList.add('is-computed');
        statusMsg.textContent = `Calculated ${targetKey.charAt(0).toUpperCase() + targetKey.slice(1)} dynamically.`;

        // Update Summary
        updateSummary(
            parseFloat(fields.principal.value),
            parseFloat(fields.rate.value),
            parseFloat(fields.tenure.value),
            parseFloat(fields.emi.value)
        );

        // Save for amortization
        localStorage.setItem('emiData', JSON.stringify({
            principal: parseFloat(fields.principal.value),
            rate: parseFloat(fields.rate.value),
            tenure: parseFloat(fields.tenure.value),
            emi: parseFloat(fields.emi.value)
        }));
    } else {
        // Invalid calculation result
        statusMsg.textContent = 'Invalid combination of values.';
        summaryCard.classList.remove('visible');
    }
}

function updateSummary(P, R, T, E) {
    if (!P || !T || !E) {
        summaryCard.classList.remove('visible');
        return;
    }

    const totalPayment = E * T * 12;
    const totalInterest = totalPayment - P;

    if (totalInterest < 0) {
        summaryCard.classList.remove('visible');
        return;
    }

    totalInterestEl.textContent = formatCurrency(totalInterest);
    totalPaymentEl.textContent = formatCurrency(totalPayment);

    const interestPercent = (totalInterest / totalPayment) * 100;
    interestPercentEl.textContent = `${Math.round(interestPercent)}%`;
    donutSegment.style.background = `conic-gradient(var(--accent-2) 0% ${interestPercent}%, transparent ${interestPercent}% 100%)`;

    summaryCard.classList.add('visible');
}

function formatCurrency(val) {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validate(...args) {
    return args.every(v => !isNaN(v) && v >= 0);
}

function formatValue(key, val) {
    if (key === 'tenure') return Math.round(val * 100) / 100; // 2 decimals for years
    if (key === 'rate') return Math.round(val * 1000) / 1000; // 3 decimals for rate
    return Math.round(val * 100) / 100; // 2 decimals for currency
}

function resetStyles() {
    Object.values(wrappers).forEach(w => w.classList.remove('computed'));
    Object.values(groups).forEach(g => g.classList.remove('is-computed'));
    summaryCard.classList.remove('visible');
}

// Formulas
// P = Principal
// R = Annual Rate %
// T = Years
// E = EMI

function calcEMI(P, R, T) {
    const r = R / 12 / 100;
    const n = T * 12;
    if (r === 0) return P / n;
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return emi;
}

function calcPrincipal(E, R, T) {
    const r = R / 12 / 100;
    const n = T * 12;
    if (r === 0) return E * n;
    const p = E * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    return p;
}

function calcTenure(P, R, E) {
    const r = R / 12 / 100;
    if (r === 0) return P / E / 12;

    // E = P * r * (1+r)^n / ((1+r)^n - 1)
    // E/P = r * X / (X - 1)  where X = (1+r)^n
    // E/P * (X - 1) = r * X
    // E/P * X - E/P = r * X
    // X (E/P - r) = E/P
    // X = (E/P) / (E/P - r)
    // X = E / (E - P*r)

    const numerator = E;
    const denominator = E - (P * r);

    if (denominator <= 0) return null; // Impossible, means interest > EMI

    const X = numerator / denominator;
    const n = Math.log(X) / Math.log(1 + r);
    return n / 12;
}

function calcRate(P, T, E) {
    const n = T * 12;
    // Solve for r in: E = P * r * (1+r)^n / ((1+r)^n - 1)
    // f(r) = P * r * (1+r)^n / ((1+r)^n - 1) - E

    // Binary search
    // Low = 0, High = 1 (100% monthly... huge). 
    // Usually R is annual. Let's assume max annual rate 200%. Monthly ~ 0.16.

    let low = 0.0000001;
    let high = 0.2; // 20% monthly is huge. 
    // Check if E > P/n (EMI must cover at least principal)
    if (E * n < P) return null;

    // E must be > P*r (interest component of first month) ideally? 
    // Actually if E < P*r, balance grows. We want clean payoff.

    // Simple check: E > P/n

    for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const calcE = (P * mid * Math.pow(1 + mid, n)) / (Math.pow(1 + mid, n) - 1);

        if (calcE > E) {
            high = mid;
        } else {
            low = mid;
        }
    }

    const r = (low + high) / 2;
    const annualR = r * 12 * 100;
    return annualR;
}
