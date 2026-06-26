const caseData = {
  workingCapital: 100000000,
  fixedCapital: 900000000,
  projectLife: 6,
  salvageValue: 240000000,
  variableCostRate: 45,
  fixedCost: 35000000,
  taxRate: 30,
  discountRate: 20,
  targetPayback: 4,
  salesForecast: [700000000, 740000000, 780000000, 820000000, 860000000, 900000000],
};

const form = document.getElementById("investmentForm");
const loadCaseBtn = document.getElementById("loadCaseBtn");
const resetBtn = document.getElementById("resetBtn");
const generateSalesRowsBtn = document.getElementById("generateSalesRowsBtn");
const salesTableBody = document.getElementById("salesTableBody");
const currencyInputSelector = '[data-currency="true"], .sales-input';

const fields = {
  workingCapital: document.getElementById("workingCapital"),
  fixedCapital: document.getElementById("fixedCapital"),
  projectLife: document.getElementById("projectLife"),
  salvageValue: document.getElementById("salvageValue"),
  variableCostRate: document.getElementById("variableCostRate"),
  fixedCost: document.getElementById("fixedCost"),
  taxRate: document.getElementById("taxRate"),
  discountRate: document.getElementById("discountRate"),
  targetPayback: document.getElementById("targetPayback"),
};

const output = {
  npvValue: document.getElementById("npvValue"),
  irrValue: document.getElementById("irrValue"),
  arrValue: document.getElementById("arrValue"),
  paybackValue: document.getElementById("paybackValue"),
  piValue: document.getElementById("piValue"),
  npvNote: document.getElementById("npvNote"),
  irrNote: document.getElementById("irrNote"),
  arrNote: document.getElementById("arrNote"),
  paybackNote: document.getElementById("paybackNote"),
  piNote: document.getElementById("piNote"),
  overallBadge: document.getElementById("overallBadge"),
  cashflowSummary: document.getElementById("cashflowSummary"),
  conclusionText: document.getElementById("conclusionText"),
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function setFormValues(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (fields[key]) {
      fields[key].value = fields[key].dataset.currency === "true" ? formatCurrencyInput(value) : value;
    }
  });

  renderSalesRows(data.projectLife, data.salesForecast);
}

function sanitizeNumber(value) {
  return Number(String(value).replace(/[^\d-]/g, ""));
}

function formatCurrencyInput(value) {
  const numericValue = sanitizeNumber(value);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return value === "" ? "" : "Rp. 0";
  }

  return `Rp. ${currencyFormatter.format(Math.abs(numericValue))}`;
}

function attachCurrencyFormatter(container = document) {
  container.querySelectorAll(currencyInputSelector).forEach((input) => {
    if (input.dataset.currencyBound === "true") {
      return;
    }

    input.dataset.currencyBound = "true";
    input.addEventListener("input", () => {
      input.value = formatCurrencyInput(input.value);
    });
    input.addEventListener("focus", () => {
      if (!input.value.trim()) {
        return;
      }

      input.value = formatCurrencyInput(input.value);
    });
    input.addEventListener("blur", () => {
      if (!input.value.trim()) {
        input.value = "";
        return;
      }

      input.value = formatCurrencyInput(input.value);
    });
  });
}

function renderSalesRows(totalYears, existingValues = []) {
  const years = Math.max(1, Number(totalYears) || 1);
  const currentValues = existingValues.length ? existingValues : getSalesForecastFromTable();

  salesTableBody.innerHTML = "";

  for (let year = 1; year <= years; year += 1) {
    const row = document.createElement("tr");
    const value = currentValues[year - 1] ?? "";

    row.innerHTML = `
      <td>Tahun ${year}</td>
      <td>
        <input
          type="text"
          inputmode="numeric"
          class="sales-input"
          data-year="${year}"
          placeholder="Masukkan penjualan tahun ${year}"
          value="${value === "" ? "" : formatCurrencyInput(value)}"
          required
        >
      </td>
    `;

    salesTableBody.appendChild(row);
  }

  attachCurrencyFormatter(salesTableBody);
}

function getSalesForecastFromTable() {
  return Array.from(document.querySelectorAll(".sales-input"))
    .map((input) => sanitizeNumber(input.value))
    .filter((value) => Number.isFinite(value) && value >= 0);
}

function formatCurrency(value) {
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? "-Rp. " : "Rp. ";
  return `${prefix}${currencyFormatter.format(absoluteValue)}`;
}

function formatPercent(value) {
  return `${decimalFormatter.format(value)}%`;
}

function formatFactor(value) {
  return value.toFixed(3).replace(".", ",");
}

function calculateNPV(cashFlows, rate) {
  return cashFlows.reduce((accumulator, cashFlow, index) => {
    return accumulator + cashFlow / Math.pow(1 + rate, index);
  }, 0);
}

function calculateIRR(cashFlows, referenceRate) {
  const hasPositive = cashFlows.some((value) => value > 0);
  const hasNegative = cashFlows.some((value) => value < 0);

  if (!hasPositive || !hasNegative) {
    return null;
  }

  const step = 0.05;
  const tolerance = 1e-7;
  let firstRate = referenceRate;
  let firstNpv = calculateNPV(cashFlows, firstRate);

  if (Math.abs(firstNpv) < tolerance) {
    return {
      value: firstRate,
      positiveRate: firstRate,
      positiveNpv: firstNpv,
      negativeRate: firstRate,
      negativeNpv: firstNpv,
    };
  }

  let positiveRate = firstNpv > 0 ? firstRate : null;
  let positiveNpv = firstNpv > 0 ? firstNpv : null;
  let negativeRate = firstNpv < 0 ? firstRate : null;
  let negativeNpv = firstNpv < 0 ? firstNpv : null;

  if (firstNpv > 0) {
    let nextRate = firstRate + step;

    while (nextRate <= 10) {
      const nextNpv = calculateNPV(cashFlows, nextRate);

      if (Math.abs(nextNpv) < tolerance) {
        return {
          value: nextRate,
          positiveRate: firstRate,
          positiveNpv: firstNpv,
          negativeRate: nextRate,
          negativeNpv: nextNpv,
        };
      }

      if (nextNpv < 0) {
        negativeRate = nextRate;
        negativeNpv = nextNpv;
        break;
      }

      nextRate += step;
    }
  } else {
    let nextRate = firstRate - step;

    while (nextRate > -0.99) {
      const nextNpv = calculateNPV(cashFlows, nextRate);

      if (Math.abs(nextNpv) < tolerance) {
        return {
          value: nextRate,
          positiveRate: nextRate,
          positiveNpv: nextNpv,
          negativeRate: firstRate,
          negativeNpv: firstNpv,
        };
      }

      if (nextNpv > 0) {
        positiveRate = nextRate;
        positiveNpv = nextNpv;
        break;
      }

      nextRate -= step;
    }
  }

  if (
    positiveRate === null ||
    negativeRate === null ||
    !Number.isFinite(positiveNpv) ||
    !Number.isFinite(negativeNpv) ||
    positiveNpv === negativeNpv
  ) {
    return null;
  }

  const value =
    positiveRate + (positiveNpv / (positiveNpv - negativeNpv)) * (negativeRate - positiveRate);

  return {
    value,
    positiveRate,
    positiveNpv,
    negativeRate,
    negativeNpv,
  };
}

function calculatePayback(initialInvestment, annualCashFlows) {
  let cumulative = 0;

  for (let index = 0; index < annualCashFlows.length; index += 1) {
    const previousCumulative = cumulative;
    cumulative += annualCashFlows[index];

    if (cumulative >= initialInvestment) {
      const remaining = initialInvestment - previousCumulative;
      const fraction = annualCashFlows[index] === 0 ? 0 : remaining / annualCashFlows[index];
      return {
        value: index + fraction,
        completedYears: index,
        remainingInvestment: remaining,
        recoveryCashFlow: annualCashFlows[index],
      };
    }
  }

  return null;
}

function buildCashflowRows(annualRows) {
  output.cashflowSummary.innerHTML = "";

  annualRows.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "cashflow-row";
    wrapper.innerHTML = `
      <strong>Tahun ${row.year}</strong>
      <span>Penjualan: ${formatCurrency(row.sales)}</span>
      <span>Laba setelah pajak: ${formatCurrency(row.netProfit)}</span>
      <span>Arus kas: ${formatCurrency(row.cashFlow)}</span>
      <span>DF: ${formatFactor(row.discountFactor)}</span>
      <span>PV arus kas: ${formatCurrency(row.presentValue)}</span>
    `;
    output.cashflowSummary.appendChild(wrapper);
  });
}

function updateMetric(elementValue, elementNote, value, note) {
  elementValue.textContent = value;
  elementNote.textContent = note;
}

function evaluateFeasibility(metrics, targetPayback) {
  const decisions = [];

  decisions.push(metrics.npv > 0);
  decisions.push(metrics.pi > 1);
  decisions.push(metrics.irr !== null && metrics.irr > metrics.discountRate);
  decisions.push(metrics.arr > metrics.discountRate);

  if (targetPayback > 0) {
    decisions.push(metrics.payback !== null && metrics.payback <= targetPayback);
  }

  const passed = decisions.filter(Boolean).length;

  if (passed === decisions.length) {
    return {
      label: "Layak dijalankan",
      className: "good",
    };
  }

  if (passed >= Math.ceil(decisions.length / 2)) {
    return {
      label: "Perlu pertimbangan",
      className: "warn",
    };
  }

  return {
    label: "Kurang layak",
    className: "bad",
  };
}

function getInputs() {
  const data = {
    workingCapital: sanitizeNumber(fields.workingCapital.value),
    fixedCapital: sanitizeNumber(fields.fixedCapital.value),
    projectLife: Number(fields.projectLife.value),
    salvageValue: sanitizeNumber(fields.salvageValue.value),
    variableCostRate: Number(fields.variableCostRate.value) / 100,
    fixedCost: sanitizeNumber(fields.fixedCost.value),
    taxRate: Number(fields.taxRate.value) / 100,
    discountRate: Number(fields.discountRate.value) / 100,
    targetPayback: Number(fields.targetPayback.value) || 0,
    sales: getSalesForecastFromTable(),
  };

  if (data.sales.length !== data.projectLife) {
    throw new Error("Jumlah proyeksi penjualan harus sama dengan usia ekonomis proyek.");
  }

  if (data.salvageValue > data.fixedCapital) {
    throw new Error("Nilai residu tidak boleh lebih besar dari modal tetap.");
  }

  return data;
}

function renderResults(metrics, inputs, annualRows) {
  updateMetric(
    output.npvValue,
    output.npvNote,
    formatCurrency(metrics.npv),
    `PV cash inflow ${formatCurrency(metrics.presentValueInflows)} - investasi awal ${formatCurrency(metrics.initialInvestment)}.`
  );

  updateMetric(
    output.irrValue,
    output.irrNote,
    metrics.irr === null ? "Tidak ditemukan" : formatPercent(metrics.irr * 100),
    metrics.irr === null
      ? "IRR tidak dapat dihitung dari pola arus kas ini."
      : `Interpolasi: r1 ${formatPercent(metrics.irrPositiveRate * 100)} dengan NPV ${formatCurrency(metrics.irrPositiveNpv)}, ` +
        `r2 ${formatPercent(metrics.irrNegativeRate * 100)} dengan NPV ${formatCurrency(metrics.irrNegativeNpv)}.`
  );

  updateMetric(
    output.arrValue,
    output.arrNote,
    formatPercent(metrics.arr * 100),
    `Rata-rata EAT ${formatCurrency(metrics.averageProfit)} dibagi rata-rata investasi ${formatCurrency(metrics.averageInvestment)}. ` +
      `${metrics.arr > metrics.discountRate ? "ARR > required rate, proyek layak." : "ARR <= required rate, proyek kurang layak."}`
  );

  updateMetric(
    output.paybackValue,
    output.paybackNote,
    metrics.payback === null ? "Tidak kembali" : `${decimalFormatter.format(metrics.payback)} tahun`,
    metrics.payback === null
      ? "Investasi belum kembali selama umur proyek."
      : `${metrics.paybackCompletedYears} tahun + ` +
        `${formatCurrency(metrics.paybackRemainingInvestment)} / ${formatCurrency(metrics.paybackRecoveryCashFlow)}.`
  );

  updateMetric(
    output.piValue,
    output.piNote,
    decimalFormatter.format(metrics.pi),
    `PV penerimaan ${formatCurrency(metrics.presentValueInflows)} dibanding PV investasi ${formatCurrency(metrics.initialInvestment)}. ` +
      `${metrics.pi > 1 ? "PI > 1, proyek layak." : "PI <= 1, proyek kurang layak."}`
  );

  buildCashflowRows(annualRows);

  const feasibility = evaluateFeasibility(metrics, inputs.targetPayback);
  output.overallBadge.textContent = feasibility.label;
  output.overallBadge.className = `badge ${feasibility.className}`;

  output.conclusionText.textContent =
    `${feasibility.label}. NPV ${metrics.npv > 0 ? "positif" : "negatif"}, ` +
    `PI ${metrics.pi > 1 ? "lebih besar" : "tidak lebih besar"} dari 1, ` +
    `${metrics.irr !== null ? `dan IRR sebesar ${decimalFormatter.format(metrics.irr * 100)}%.` : "dan IRR tidak ditemukan."}`;
}

function calculateMetrics(inputs) {
  const initialInvestment = inputs.workingCapital + inputs.fixedCapital;
  const depreciation = (inputs.fixedCapital - inputs.salvageValue) / inputs.projectLife;
  const annualRows = [];
  const annualCashFlows = [];
  const accountingProfits = [];

  for (let index = 0; index < inputs.projectLife; index += 1) {
    const sales = inputs.sales[index];
    const variableCost = sales * inputs.variableCostRate;
    const ebit = sales - variableCost - inputs.fixedCost - depreciation;
    const tax = ebit > 0 ? ebit * inputs.taxRate : 0;
    const netProfit = ebit - tax;

    let cashFlow = netProfit + depreciation;
    if (index === inputs.projectLife - 1) {
      cashFlow += inputs.salvageValue + inputs.workingCapital;
    }

    const discountFactor = 1 / Math.pow(1 + inputs.discountRate, index + 1);
    const presentValue = cashFlow * discountFactor;

    accountingProfits.push(netProfit);
    annualCashFlows.push(cashFlow);
    annualRows.push({
      year: index + 1,
      sales,
      netProfit,
      cashFlow,
      discountFactor,
      presentValue,
    });
  }

  const cashFlows = [-initialInvestment, ...annualCashFlows];
  const irrResult = calculateIRR(cashFlows, inputs.discountRate);
  const paybackResult = calculatePayback(initialInvestment, annualCashFlows);
  const presentValueInflows = annualRows.reduce((accumulator, row) => accumulator + row.presentValue, 0);
  const npv = presentValueInflows - initialInvestment;
  const pi = presentValueInflows / initialInvestment;
  const averageProfit =
    accountingProfits.reduce((accumulator, value) => accumulator + value, 0) / accountingProfits.length;
  const averageInvestment = (initialInvestment + inputs.salvageValue) / 2;
  const arr = averageProfit / averageInvestment;

  return {
    annualRows,
    metrics: {
      npv,
      irr: irrResult?.value ?? null,
      irrPositiveRate: irrResult?.positiveRate ?? null,
      irrPositiveNpv: irrResult?.positiveNpv ?? null,
      irrNegativeRate: irrResult?.negativeRate ?? null,
      irrNegativeNpv: irrResult?.negativeNpv ?? null,
      arr,
      averageProfit,
      averageInvestment,
      payback: paybackResult?.value ?? null,
      paybackCompletedYears: paybackResult?.completedYears ?? null,
      paybackRemainingInvestment: paybackResult?.remainingInvestment ?? null,
      paybackRecoveryCashFlow: paybackResult?.recoveryCashFlow ?? null,
      pi,
      initialInvestment,
      presentValueInflows,
      discountRate: inputs.discountRate,
    },
  };
}

function handleCalculation(event) {
  event.preventDefault();

  try {
    const inputs = getInputs();
    const { metrics, annualRows } = calculateMetrics(inputs);
    renderResults(metrics, inputs, annualRows);
  } catch (error) {
    output.overallBadge.textContent = "Periksa input";
    output.overallBadge.className = "badge bad";
    output.conclusionText.textContent = error.message;
    output.cashflowSummary.textContent = "Data belum bisa diproses karena ada input yang tidak valid.";
  }
}

form.addEventListener("submit", handleCalculation);
generateSalesRowsBtn.addEventListener("click", () => {
  renderSalesRows(fields.projectLife.value);
});
fields.projectLife.addEventListener("change", () => {
  renderSalesRows(fields.projectLife.value);
});
loadCaseBtn.addEventListener("click", () => {
  setFormValues(caseData);
  form.requestSubmit();
});
resetBtn.addEventListener("click", () => {
  form.reset();
  renderSalesRows(1, []);
  output.overallBadge.textContent = "Menunggu perhitungan";
  output.overallBadge.className = "badge neutral";
  output.conclusionText.textContent = "Belum ada kesimpulan.";
  output.cashflowSummary.textContent = "Masukkan data lalu klik tombol hitung.";

  [
    ["npvValue", "npvNote"],
    ["irrValue", "irrNote"],
    ["arrValue", "arrNote"],
    ["paybackValue", "paybackNote"],
    ["piValue", "piNote"],
  ].forEach(([valueKey, noteKey]) => {
    output[valueKey].textContent = "-";
    output[noteKey].textContent = "Belum dihitung";
  });
});

attachCurrencyFormatter(document);
setFormValues(caseData);
form.requestSubmit();
