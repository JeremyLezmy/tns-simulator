/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Enhanced Chart management module with multiple visualizations per mode
 */

// Store chart instances
const chartInstances = {};

// Professional color palette (inspired by financial dashboards)
function getChartColors() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  
  if (isDark) {
    return {
      // Primary financial colors (dark mode)
      revenue: "#10b981",      // Green for revenue/income
      expense: "#f59e0b",      // Amber for expenses
      tax: "#ef4444",          // Red for taxes
      net: "#60a5fa",          // Blue for net amounts
      social: "#8b5cf6",       // Purple for social charges
      external: "#f87171",     // Light red for external costs
      
      // Secondary colors
      accent1: "#34d399",
      accent2: "#fbbf24",
      accent3: "#a78bfa",
      accent4: "#fb923c",
      
      // UI colors
      text: "#e5e7eb",
      highContrastText: "#f9fafb", // Almost white for dark mode
      grid: "#374151",
      gridLight: "#1f2937",
      background: "rgba(17, 24, 39, 0.95)",
    };
  } else {
    return {
      // Primary financial colors (light mode)
      revenue: "#059669",
      expense: "#d97706",
      tax: "#dc2626",
      net: "#2563eb",
      social: "#7c3aed",
      external: "#dc2626",
      
      // Secondary colors
      accent1: "#10b981",
      accent2: "#f59e0b",
      accent3: "#8b5cf6",
      accent4: "#f97316",
      
      // UI colors
      text: "#374151",
      highContrastText: "#111827", // Almost black for light mode
      grid: "#d1d5db",
      gridLight: "#f3f4f6",
      background: "rgba(255, 255, 255, 0.95)",
    };
  }
}

// Common chart options
function getCommonOptions(colors, title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100, // Debounce resize events
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    // Explicitly define events to ensure mobile touch is captured
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    interaction: {
      mode: 'nearest',
      axis: 'xy',
      intersect: true // Require touching the element, but 'nearest' helps
    },
    plugins: {
      datalabels: {
        display: function(context) {
           // Safety check to prevent crash on mobile with empty datasets
           return context.dataset.data && context.dataset.data.length > 0 && context.dataset.data[context.dataIndex] !== null;
        }
      },
      legend: {
        position: "bottom",
        labels: {
          color: colors.text,
          padding: 12,
          font: { size: 11, weight: "500" },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: title,
        color: colors.text,
        font: { size: 14, weight: "600" },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: colors.background,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (context.parsed.y !== null) {
                label += ': ' + context.parsed.y.toLocaleString("fr-FR") + ' €';
            }
            return label;
          }
        }
      },
    },
  };
}

// Destroy specific charts to force recreation
function destroyCharts(mode) {
  const chartIds = {
    tns: ["chartTns1", "chartTns2", "chartTns3"],
    sasuIR: ["chartSasuIR1", "chartSasuIR2"],
    sasuIS: ["chartSasuIS1", "chartSasuIS2", "chartSasuIS3", "chartSasuIS4"],
    micro: ["chartMicro1", "chartMicro2"],
    salarie: ["chartSalarie1", "chartSalarie2"],
  };

  const ids = chartIds[mode] || [];
  ids.forEach(id => {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  });
}

// Create or update a chart
function createOrUpdateChart(canvasId, config, forceRecreate = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  // Check if Chart.js has an existing chart on this canvas (using Chart.js internal registry)
  const existingChart = Chart.getChart(canvas);
  
  // If there's an existing chart and we're forcing recreation, destroy it
  if (existingChart && forceRecreate) {
    existingChart.destroy();
    delete chartInstances[canvasId];
  }
  // If there's an existing chart but we're not forcing recreation, update it
  else if (existingChart && !forceRecreate) {
    existingChart.data = config.data;
    existingChart.options = config.options;
    existingChart.update();
    chartInstances[canvasId] = existingChart; // Ensure our tracker is in sync
    return existingChart;
  }
  // If there's an existing chart in Chart.js but not in our tracker, destroy it
  else if (existingChart) {
    existingChart.destroy();
    delete chartInstances[canvasId];
  }

  // Create new chart (first time or after destroy)
  const ctx = canvas.getContext("2d");
  const newChart = new Chart(ctx, config);
  chartInstances[canvasId] = newChart;
  
  return newChart;
}

// ========== TNS CHARTS ==========

function getTnsChart1Config(data) {
  const colors = getChartColors();
  // SANKEY: CA -> Charges Ext -> Marge -> Net / Cotisations
  
  const includeCsg = data.includeCsg !== false; // Default to true if undefined
  
  let net = Math.round(data.net);
  const cotis = Math.round(data.cotis);
  const csg = Math.round(data.csg);
  
  // If CSG is NOT included in company charges (paid by TNS), 
  // 'net' (R) includes the CSG amount.
  // For the visual, we want to show CSG as a charge (social flow), 
  // so we extract it from the displayed Net.
  if (!includeCsg) {
    net = net - csg;
  }
  
  const social = cotis + csg;
  const marge = net + social;
  
  // Calculate CA and Charges Ext
  // To ensure the Sankey node "Marge Disponible" is perfectly balanced (Input = Output),
  // we MUST define Marge size as exactly (Net + Social).
  // Then we back-calculate Charges Ext based on CA.
  
  let ca = data.ca ? Math.round(data.ca) : Math.round(marge * 1.1);
  
  // Force Marge to be exactly what flows out of it
  let dispo = marge; 
  
  // Calculate Charges Ext as the remainder of CA
  let chargesExt = Math.round(ca - dispo);
  
  // Safety: if chargesExt < 0 (e.g. CA < Net+Charges due to input error), clamp to 0
  // and adjust CA to match Marge (so flow is valid)
  if (chargesExt < 0) {
    chargesExt = 0;
    ca = dispo;
  }
  
  // Build flows
  const flows = [];
  
  // Only add Charges Ext branch if > 0
  if (chargesExt > 0) {
    flows.push({ from: "CA", to: "Charges Externes", flow: chargesExt });
    flows.push({ from: "CA", to: "Marge", flow: dispo });
  } else {
    // If no charges, we still want a flow from CA to Marge to show the full amount
    flows.push({ from: "CA", to: "Marge", flow: dispo });
  }
  
  flows.push({ from: "Marge", to: "Rémunération Nette", flow: net });
  flows.push({ from: "Marge", to: "Cotisations Sociales", flow: social });

  return {
    type: "sankey",
    data: {
      datasets: [{
        label: "Flux Financier",
        data: flows,
        colorFrom: (c) => c.dataset.data[c.dataIndex].from === "CA" ? colors.text : colors.revenue,
        colorTo: (c) => {
          const to = c.dataset.data[c.dataIndex].to;
          if (to === "Charges Externes") return colors.external;
          if (to === "Marge") return colors.revenue;
          if (to === "Rémunération Nette") return colors.net;
          if (to === "Cotisations Sociales") return colors.social;
          return colors.grid;
        },
        colorMode: 'gradient',
        size: 'max',
        borderWidth: 0,
        nodeWidth: 20
      }]
    },
    options: {
      ...getCommonOptions(colors, "Flux Financier (Sankey)"),
      plugins: {
        ...getCommonOptions(colors, "Flux Financier (Sankey)").plugins,
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.from} → ${ctx.raw.to}: ${Math.round(ctx.raw.flow).toLocaleString("fr-FR")} €`
          },
          displayColors: false // Fix: remove white square on hover
        }
      }
    }
  };
}

function getTnsChart2Config(data) {
  const colors = getChartColors();
  // WATERFALL: Marge -> Retraite -> Santé/CSG -> Net
  
  const includeCsg = data.includeCsg !== false;
  
  let net = Math.round(data.net);
  const cotis = Math.round(data.cotis);
  const csg = Math.round(data.csg);
  
  // Same logic as Sankey: if CSG not included, extract it from Net for visual consistency
  if (!includeCsg) {
    net = net - csg;
  }
  
  const marge = net + cotis + csg;
  const details = data.details || {};
  
  // Calculate waterfall steps (floating bars)
  const step1_end = marge;
  const step2_start = step1_end - cotis;
  const step3_start = step2_start - csg;
  
  return {
    type: "bar",
    data: {
      labels: ["Marge Disponible", "Cotisations", "CSG/CRDS", "Revenu Net"],
      datasets: [{
        data: [
          [0, marge],              // Marge (base)
          [step2_start, step1_end], // Cotisations (drop)
          [step3_start, step2_start], // CSG (drop)
          [0, net]                  // Net (final)
        ],
        backgroundColor: [
          colors.revenue,
          colors.social,
          colors.expense,
          colors.net
        ],
      }]
    },
    options: {
      ...getCommonOptions(colors, "Flux de Revenu (Waterfall)"),
      plugins: {
        ...getCommonOptions(colors, "Flux de Revenu (Waterfall)").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const raw = context.raw;
              let value = 0;
              if (Array.isArray(raw)) {
                value = raw[1] - raw[0];
              } else {
                value = raw;
              }
              return `${context.label}: ${Math.round(value).toLocaleString("fr-FR")} €`;
            }
          }
        },
        datalabels: {
          display: true,
          color: 'white',
          font: { weight: 'bold' },
          formatter: (value) => {
            let val = 0;
            if (Array.isArray(value)) {
               val = value[1] - value[0];
            } else {
               val = value;
            }
            if (Math.abs(val) < 1000) return "";
            return Math.round(val/1000) + " k€";
          },
          anchor: 'center',
          align: 'center',
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function getTnsChart3Config(data) {
  const colors = getChartColors();
  // TREEMAP: Breakdown of 24k cotisations
  
  const details = data.details || {};
  const treeData = [];
  
  if (Object.keys(details).length > 0) {
    if (details.retBase || details.rci) treeData.push({ category: "Retraite", value: Math.round((details.retBase||0) + (details.rci||0)) });
    if (details.csg) treeData.push({ category: "CSG/CRDS", value: Math.round(details.csg) });
    if (details.maladie || details.ij) treeData.push({ category: "Santé", value: Math.round((details.maladie||0) + (details.ij||0)) });
    if (details.id) treeData.push({ category: "Prévoyance", value: Math.round(details.id) });
    if (details.af) treeData.push({ category: "Alloc. Fam.", value: Math.round(details.af) });
    if (details.cfp) treeData.push({ category: "Formation", value: Math.round(details.cfp) });
  } else {
    treeData.push({ category: "Cotisations", value: Math.round(data.cotis) });
    treeData.push({ category: "CSG/CRDS", value: Math.round(data.csg) });
  }
  
  return {
    type: "treemap",
    data: {
      datasets: [{
        label: "Répartition des Cotisations",
        tree: treeData,
        key: "value",
        groups: ['category'],
        backgroundColor: (ctx) => {
          if (ctx.type !== 'data') return 'transparent';
          const cat = ctx.raw._data.category;
          switch(cat) {
            case "Retraite": return colors.social; 
            case "CSG/CRDS": return colors.grid; 
            case "Santé": return colors.net; 
            case "Prévoyance": return colors.accent3;
            case "Alloc. Fam.": return colors.accent2;
            default: return colors.expense;
          }
        },
        labels: {
          display: true,
          color: "white",
          font: (ctx) => {
             const val = ctx.raw.v;
             // Dynamic font size based on value
             if (val < 500) return { size: 0 }; // Hide text for tiny blocks
             if (val < 2000) return { size: 10, weight: "normal" };
             return { size: 14, weight: "bold" };
          },
          formatter: (ctx) => {
            if (ctx.raw.v < 500) return ""; // Hide text
            return `${ctx.raw._data.category}\n${Math.round(ctx.raw.v).toLocaleString("fr-FR")} €`;
          }
        },
        borderWidth: 1,
        borderColor: colors.background
      }]
    },
    options: {
      ...getCommonOptions(colors, "Treemap de la Protection Sociale"),
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Répartition des Cotisations", color: colors.text },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw._data.category}: ${Math.round(ctx.raw.v).toLocaleString("fr-FR")} €`
          }
        }
      }
    }
  };
}

// ========== SASU IR CHARTS ==========

function getSasuIRChart1Config(data) {
  const colors = getChartColors();
  // DONUT: Répartition des Sources (BNC vs Salaire)
  // Focus on BNC dominance
  
  const bnc = Math.round(data.bncBrut);
  const salaire = Math.round(data.salaireBrut);
  const total = bnc + salaire;
  
  return {
    type: "doughnut",
    data: {
      labels: ["Quote-part BNC", "Salaire"],
      datasets: [{
        data: [bnc, salaire],
        backgroundColor: [
          "#06b6d4", // Cyan/Turquoise for BNC (Dominant)
          colors.grid // Grey/White for Salaire (Minor)
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Répartition des Sources"),
      cutout: "60%",
      layout: {
        padding: { bottom: 10, top :20 }
      },
      plugins: {
        ...getCommonOptions(colors, "Répartition des Sources").plugins,
        legend: {
          position: "bottom",
          labels: {
            color: colors.text,
            padding: 15,
            font: { size: 12, weight: "500" },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            }
          }
        },
        subtitle: {
          display: true,
          text: `Total Brut : ${Math.round(total/1000)} k€`,
          color: colors.text,
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 30 }, // Increased spacing
          position: 'bottom'
        }
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw: function(chart) {
        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
        
        ctx.save();
        const fontSize = (height / 114).toFixed(2);
        ctx.font = "bold " + fontSize + "em sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = colors.highContrastText; // Fix contrast
        
        const text = Math.round(total/1000) + " k€";
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        
        ctx.fillText(text, centerX, centerY);
        ctx.restore();
      }
    }]
  };
}

function getSasuIRChart2Config(data) {
  const colors = getChartColors();
  // EFFICIENCY BAR: BNC Net vs Prélèvements
  // Horizontal stacked bar
  
  const bncNet = Math.round(data.bncNet);
  const ps = Math.round(data.psAmount);
  const bncBrut = bncNet + ps;
  const pctConserv = bncBrut > 0 ? ((bncNet / bncBrut) * 100).toFixed(1) : 0;
  
  return {
    type: "bar",
    data: {
      labels: ["Efficacité BNC"],
      datasets: [
        {
          label: "Net BNC",
          data: [bncNet],
          backgroundColor: "#10b981", // Emerald
          barThickness: 50,
        },
        {
          label: "Prélèvements",
          data: [ps],
          backgroundColor: "#f43f5e", // Coral
          barThickness: 50,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, "Efficacité de la Quote-part BNC"),
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { display: false } // Clean look
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { display: false } // Hide label "Efficacité BNC" to keep it clean
        },
      },
      plugins: {
        ...getCommonOptions(colors, "Efficacité de la Quote-part BNC").plugins,
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw).toLocaleString("fr-FR")} €`
          }
        },
        legend: { display: false }, // Hide legend for cleaner look, use datalabels if possible
        datalabels: {
          display: true,
          color: 'white',
          font: { weight: 'bold' },
          formatter: (value, ctx) => {
            if (value < 1000) return "";
            const pct = ((value / bncBrut) * 100).toFixed(1);
            return `${Math.round(value/1000)} k€\n(${pct}%)`;
          },
          anchor: 'center',
          align: 'center',
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

// ========== SASU IS CHARTS ==========

function getSasuIsChart1Config(data) {
  console.log('[Chart Debug] getSasuIsChart1Config called with data:', data);
  const colors = getChartColors();
  // WATERFALL: Marge -> Charges -> IS -> Flat Tax -> Net (Split into Salary & Dividends)
  
  const marge = Math.round(data.marge || (data.superBrut + data.is + data.divBrut)); 
  const chargesSal = Math.round(data.charges || 0);
  const is = Math.round(data.is);
  const flatTax = Math.round(data.flatTax);
  const remNet = Math.round(data.remNet || 0);
  const divNet = Math.round(data.divNet || 0);
  
  // Calculate steps
  const step1_end = marge;
  const step2_start = step1_end - chargesSal;
  const step3_start = step2_start - is;
  const step4_start = step3_start - flatTax; 
  
  return {
    type: "bar",
    data: {
      labels: ["Marge Disponible", "Charges Sur Salaire", "Impôt Société", "Flat Tax / PFU", "Net Dirigeant"],
      datasets: [
        {
          label: "Flux",
          data: [
            [0, marge],               // Marge
            [step2_start, step1_end], // Charges
            [step3_start, step2_start], // IS
            [step4_start, step3_start], // Flat Tax
            null                      // Net (Handled by stacked datasets)
          ],
          backgroundColor: [
            colors.grid,
            colors.social,
            colors.tax,
            "#f43f5e",
            "transparent"
          ],
          stack: 'stack1'
        },
        {
          label: "Salaire Net",
          data: [null, null, null, null, remNet],
          backgroundColor: "#10b981", // Green
          stack: 'stack1'
        },
        {
          label: "Dividendes Nets",
          data: [null, null, null, null, divNet],
          backgroundColor: "#34d399", // Lighter Green
          stack: 'stack1'
        }
      ]
    },
    options: {
      ...getCommonOptions(colors, "Double Détente Fiscale (Cascade)"),
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: colors.text }
        },
        y: {
          stacked: true,
          grid: { color: colors.gridLight },
          ticks: { color: colors.text, callback: (v) => v + ' €' }
        }
      },
      plugins: {
        ...getCommonOptions(colors, "Double Détente Fiscale (Cascade)").plugins,
        legend: {
          display: false,
          position: 'bottom',
          labels: {
            filter: (item) => item.text !== 'Flux',
            color: colors.text
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const raw = context.raw;
              let value = 0;
              if (Array.isArray(raw)) {
                value = raw[1] - raw[0];
              } else {
                value = raw;
              }
              if (value === null || isNaN(value)) return null;
              return `${context.dataset.label || context.label}: ${Math.round(value).toLocaleString("fr-FR")} €`;
            }
          }
        },
        datalabels: {
          display: true,
          color: 'white',
          font: { weight: 'bold' },
          formatter: (value, ctx) => {
            let val = 0;
            if (Array.isArray(value)) {
               val = value[1] - value[0];
            } else {
               val = value;
            }
            if (!val || Math.abs(val) < 1000) return "";
            return Math.round(val/1000) + " k€";
          },
          anchor: 'center',
          align: 'center',
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function getSasuIsChart2Config(data) {
  console.log('[Chart Debug] getSasuIsChart2Config called with data:', data);
  const colors = getChartColors();
  // DONUT: Dividendes Nets vs Salaire Net
  
  const divNet = Math.round(data.divNet);
  const salNet = Math.round(data.remNet);
  const total = divNet + salNet;
  
  return {
    type: "doughnut",
    data: {
      labels: ["Dividendes Nets", "Salaire Net"],
      datasets: [{
        data: [divNet, salNet],
        backgroundColor: [
          "#2563eb", // Royal Blue for Dividends
          colors.grid // Grey/White for Salary
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Structure de Rémunération"),
      cutout: "60%",
      layout: {
        padding: { bottom: 10 }
      },
      plugins: {
        ...getCommonOptions(colors, "Structure de Rémunération").plugins,
        legend: {
          position: "bottom",
          labels: {
            color: colors.text,
            padding: 15,
            font: { size: 12, weight: "500" },
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            }
          }
        },
        subtitle: {
          display: true,
          text: `Total Net : ${Math.round(total).toLocaleString("fr-FR")} €`,
          color: colors.text,
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 30 },
          position: 'bottom'
        }
      }
    },
    plugins: [{
      id: 'centerText2',
      beforeDraw: function(chart) {
        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
        
        ctx.save();
        const fontSize = (height / 114).toFixed(2);
        ctx.font = "bold " + fontSize + "em sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = colors.highContrastText; // Fix contrast
        
        const text = Math.round(total/1000) + " k€";
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        
        ctx.fillText(text, centerX, centerY);
        ctx.restore();
      }
    }]
  };
}

function getSasuIsChart3Config(data) {
  console.log('[Chart Debug] getSasuIsChart3Config called with data:', data);
  const colors = getChartColors();
  // TREEMAP: Net Dirigeant vs Prélèvements Publics
  
  const net = Math.round(data.net || 0);
  const flatTax = Math.round(data.flatTax || 0);
  const is = Math.round(data.is || 0);
  const chargesSoc = Math.round(data.chargesSoc || 0);
  
  return {
    type: "treemap",
    data: {
      labels: ["Net Dirigeant", "Flat Tax (PFU)", "Impôt Société", "Charges Sociales"],
      datasets: [{
        tree: [net, flatTax, is, chargesSoc],
        backgroundColor: (ctx) => {
          const bgColors = ["#10b981", "#ef4444", "#f97316", "#fca5a5"];
          return bgColors[ctx.dataIndex];
        },
        borderWidth: 2,
        borderColor: colors.background,
        spacing: 1,
        labels: {
          display: true,
          align: 'center',
          color: 'white',
          font: {
            size: 12,
            weight: 'bold'
          },
          formatter: (ctx) => {
            const labels = ["Net Dirigeant", "Flat Tax (PFU)", "Impôt Société", "Charges Sociales"];
            const values = [net, flatTax, is, chargesSoc];
            return [labels[ctx.dataIndex], Math.round(values[ctx.dataIndex]/1000) + " k€"];
          }
        }
      }]
    },
    options: {
      ...getCommonOptions(colors, "Répartition de la Valeur Ajoutée"),
      plugins: {
        ...getCommonOptions(colors, "Répartition de la Valeur Ajoutée").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const labels = ["Net Dirigeant", "Flat Tax (PFU)", "Impôt Société", "Charges Sociales"];
              const values = [net, flatTax, is, chargesSoc];
              return `${labels[ctx.dataIndex]}: ${values[ctx.dataIndex].toLocaleString("fr-FR")} €`;
            }
          }
        }
      },
      hover: {
        animationDuration: 100
      }
    }
  };
}

function getSasuIsChart4Config(data) {
  console.log('[Chart Debug] getSasuIsChart4Config called with data:', data);
  const colors = getChartColors();
  // BAR: Détail des Cotisations (Retraite, Santé, etc.)
  
  const details = data.details || {};
  
  let retraite = 0, sante = 0, famille = 0, autres = 0;
  
  if (details.retraite) retraite += details.retraite;
  if (details.retraiteComp) retraite += details.retraiteComp;
  if (details.maladie) sante += details.maladie;
  if (details.csg) autres += details.csg; 
  if (details.famille) famille += details.famille;
  if (details.chomage) autres += details.chomage;
  
  // Fallback if details are empty but total charges exist
  if (retraite === 0 && sante === 0 && data.charges > 0) {
     retraite = data.charges * 0.6; 
     sante = data.charges * 0.3;
     autres = data.charges * 0.1;
  }
  const validates4Q = data.salBrut && data.min4QThreshold && data.salBrut >= data.min4QThreshold;
  
  return {
    type: "bar",
    data: {
      labels: ["Retraite", "Santé", "Famille / Autres"],
      datasets: [{
        data: [retraite, sante, famille + autres],
        backgroundColor: [colors.social, colors.accent1, colors.accent2],
        barThickness: 30,
      }]
    },
    options: {
      ...getCommonOptions(colors, `Répartition du Coût Social (${Math.round(data.charges).toLocaleString()} €)`),
      indexAxis: 'y',
      scales: {
        x: {
          grid: { color: colors.gridLight },
          ticks: { callback: (v) => v + " €" }
        },
        y: { grid: { display: false } }
      },
      plugins: {
        ...getCommonOptions(colors, "Répartition du Coût Social").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${Math.round(ctx.raw).toLocaleString("fr-FR")} €`
          }
        },
        datalabels: {
          display: function(context) {
             return context.dataset.data && 
                    context.dataset.data.length > 0 && 
                    context.dataset.data[context.dataIndex] !== null &&
                    context.dataset.data[context.dataIndex] !== undefined;
          },
          color: 'white',
          font: { size: 10, weight: 'bold' },
          formatter: (value, ctx) => {
            // Show "✅ 4 Trim." only on the first bar (Retraite) if validated
            if (ctx.dataIndex === 0 && validates4Q) {
              return '✅ 4 Trim.';
            }
            return '';
          },
          anchor: 'center',
          align: 'center'
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

// ========== MICRO CHARTS ==========

function getMicroChart1Config(data) {
  const colors = getChartColors();
  const ca = data.ca || (data.net + data.cotis);
  const netPct = ca > 0 ? ((data.net / ca) * 100) : 0;
  
  return {
    type: "doughnut",
    data: {
      labels: ["Rémunération Nette", "Charges URSSAF"],
      datasets: [{
        data: [data.net, data.cotis],
        backgroundColor: [
          "#10b981", // Green neon for net
          "#f97316"  // Coral for charges
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Jauge de Performance Nette"),
      cutout: "65%",
      layout: {
        padding: { bottom: 10 }
      },
      interaction: {
        mode: 'nearest',
        intersect: true
      },
      plugins: {
        ...getCommonOptions(colors, "Jauge de Performance Nette").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed || 0;
              const percentage = ((value / ca) * 100).toFixed(1);
              return `${context.label}: ${Math.round(value).toLocaleString("fr-FR")} € (${percentage}%)`;
            }
          }
        },
        subtitle: {
          display: true,
          text: `${Math.round(netPct)}% Net Poche`,
          color: '#10b981',
          font: { size: 16, weight: 'bold' },
          padding: { top: 15, bottom: 10 },
          position: 'bottom'
        }
      }
    },
    plugins: [{
      id: 'centerTextMicro',
      beforeDraw: function(chart) {
        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
        
        ctx.save();
        // Main CA text (reduced further by 25%)
        const fontSize1 = (height / 160).toFixed(2);  // Was 120, now 160 (25% reduction)
        ctx.font = "bold " + fontSize1 + "em sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = colors.highContrastText; // Fix contrast
        
        const caText = Math.round(ca).toLocaleString("fr-FR") + " €";
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2 - 5;
        
        ctx.fillText(caText, centerX, centerY);
        
        // Subtitle "CA" (reduced further by 25%)
        const fontSize2 = (height / 260).toFixed(2);  // Was 200, now 260 (25% reduction)
        ctx.font = fontSize2 + "em sans-serif";
        ctx.fillStyle = colors.text; // Fix contrast: was gridLight (too faint)
        ctx.fillText("Chiffre d'Affaires", centerX, centerY + 18);
        
        ctx.restore();
      }
    }]
  };
}

function getMicroChart2Config(data) {
  const colors = getChartColors();
  // TREEMAP: Breakdown of social charges
  
  const retraite = Math.round(data.retraite || 0);
  const csg = Math.round(data.csg || 0);
  const maladie = Math.round(data.maladie || 0);
  const autres = Math.round(data.autres || 0);
  
  // Calculate percentage for subtitle
  const totalCharges = retraite + csg + maladie + autres;
  const retraitePct = totalCharges > 0 ? Math.round((retraite / totalCharges) * 100) : 0;
  
  return {
    type: "treemap",
    data: {
      labels: ["Retraite (Différée)", "CSG/CRDS", "Maladie", "Invalidité / CFP"],
      datasets: [{
        tree: [retraite, csg, maladie, autres],
        backgroundColor: (ctx) => {
          const bgColors = ["#8b5cf6", "#9ca3af", "#60a5fa", "#d1d5db"];
          return bgColors[ctx.dataIndex];
        },
        borderWidth: 2,
        borderColor: colors.background,
        spacing: 1,
        labels: {
          display: true,
          align: 'center',
          color: 'white',
          font: {
            size: 12,
            weight: 'bold'
          },
          formatter: (ctx) => {
            const labels = ["Retraite (Différée)", "CSG/CRDS", "Maladie", "Invalidité / CFP"];
            const values = [retraite, csg, maladie, autres];
            const value = values[ctx.dataIndex];
            if (value < 500) return ''; // Hide tiny values
            return [labels[ctx.dataIndex], Math.round(value/1000) + " k€"];
          }
        }
      }]
    },
    options: {
      ...getCommonOptions(colors, "Radiographie des Charges"),
      plugins: {
        ...getCommonOptions(colors, "Radiographie des Charges").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const labels = ["Retraite (Différée)", "CSG/CRDS", "Maladie", "Invalidité / CFP"];
              const values = [retraite, csg, maladie, autres];
              return `${labels[ctx.dataIndex]}: ${values[ctx.dataIndex].toLocaleString("fr-FR")} €`;
            }
          }
        },
        subtitle: {
          display: true,
          text: `Épargne Retraite : ~${retraitePct}% de vos charges`,
          color: '#8b5cf6',
          font: { size: 13, weight: 'bold' },
          padding: { top: 5, bottom: 15 },
          position: 'bottom'
        }
      },
      hover: {
        animationDuration: 100
      }
    }
  };
}

// ========== SALARIE CHARTS ==========

function getSalarieChart1Config(data) {
  const colors = getChartColors();
  // WATERFALL: Super Brut → Charges Pat → Brut → Charges Sal → Net
  
  const superBrut = Math.round(data.superBrut || 0);
  const chargesPat = Math.round(data.chargesPat || 0);
  const brut = Math.round(data.brutTotal || 0);
  const chargesSal = Math.round(data.chargesSal || 0);
  const net = Math.round(data.net || 0);
  
  // Calculate waterfall steps
  const step1_end = superBrut - chargesPat; // should equal brut
  const step2_end = brut - chargesSal; // should equal net
  
  return {
    type: "bar",
    data: {
      labels: ["Coût Total", "Charges Patronales", "Salaire Brut", "Charges Salariales", "Net avant IR"],
      datasets: [{
        data: [
          [0, superBrut],           // Coût Total (base)
          [step1_end, superBrut],   // Charges Pat (drop)
          [0, brut],                // Brut (intermediate step)
          [step2_end, brut],        // Charges Sal (drop)
          [0, net]                  // Net (final)
        ],
        backgroundColor: [
          colors.grid,    // Coût total (grey)
          colors.social,  // Charges Pat (purple)
          "#6b7280",      // Brut (grey lighter)
          colors.tax,     // Charges Sal (red)
          "#10b981"       // Net (green)
        ],
      }]
    },
    options: {
      ...getCommonOptions(colors, "Waterfall du Super Brut au Net"),
      plugins: {
        ...getCommonOptions(colors, "Waterfall du Super Brut au Net").plugins,
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const raw = context.raw;
              let value = 0;
              if (Array.isArray(raw)) {
                value = raw[1] - raw[0];
              } else {
                value = raw;
              }
              return `${context.label}: ${Math.round(value).toLocaleString("fr-FR")} €`;
            }
          }
        },
        datalabels: {
          display: function(context) {
             return context.dataset.data && 
                    context.dataset.data.length > 0 && 
                    context.dataset.data[context.dataIndex] !== null &&
                    context.dataset.data[context.dataIndex] !== undefined;
          },
          color: 'white',
          font: { weight: 'bold' },
          formatter: (value) => {
            let val = 0;
            if (Array.isArray(value)) {
               val = value[1] - value[0];
            } else {
               val = value;
            }
            if (Math.abs(val) < 1000) return "";
            return Math.round(val/1000) + " k€";
          },
          anchor: 'center',
          align: 'center',
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function getSalarieChart2Config(data) {
  const colors = getChartColors();
  // STACKED BAR: Part visible (salariale) vs cachée (patronale)
  
  const chargesSal = Math.round(data.chargesSal || 0);
  const chargesPat = Math.round(data.chargesPat || 0);
  const totalCharges = chargesSal + chargesPat;
  const pctSal = totalCharges > 0 ? ((chargesSal / totalCharges) * 100).toFixed(1) : 0;
  const pctPat = totalCharges > 0 ? ((chargesPat / totalCharges) * 100).toFixed(1) : 0;
  
  return {
    type: "bar",
    data: {
      labels: ["Fardeau Social"],
      datasets: [
        {
          label: `Part Salariale (${pctSal}%)`,
          data: [chargesSal],
          backgroundColor: "#60a5fa", // Blue medium
        },
        {
          label: `Part Patronale (${pctPat}%)`,
          data: [chargesPat],
          backgroundColor: "#8b5cf6", // Purple (coût caché)
        }
      ]
    },
    options: {
      ...getCommonOptions(colors, `L'Iceberg des Cotisations (Total: ${Math.round(totalCharges).toLocaleString()} €)`),
      scales: {
        x: {
          stacked: true,
          display: false
        },
        y: {
          stacked: true,
          ticks: {
            color: colors.text,
            callback: (value) => value.toLocaleString("fr-FR") + " €"
          },
          grid: { color: colors.gridLight }
        }
      },
      plugins: {
        ...getCommonOptions(colors, "L'Iceberg des Cotisations").plugins,
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y || 0;
              const pct = totalCharges > 0 ? ((value / totalCharges) * 100).toFixed(1) : 0;
              return `${ctx.dataset.label}: ${Math.round(value).toLocaleString("fr-FR")} € (${pct}%)`;
            }
          }
        },
        datalabels: {
          display: function(context) {
             return context.dataset.data && 
                    context.dataset.data.length > 0 && 
                    context.dataset.data[context.dataIndex] !== null &&
                    context.dataset.data[context.dataIndex] !== undefined;
          },
          color: 'white',
          font: { weight: 'bold', size: 12 },
          formatter: (value) => {
            if (value < 1000) return "";
            return Math.round(value/1000) + " k€";
          },
          anchor: 'center',
          align: 'center'
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

function getSalarieChart3Config(data) {
  const colors = getChartColors();
  // GROUPED HORIZONTAL BAR: Financing by risk type
  
  return {
    type: 'bar',
    data: {
      labels: ['Retraite', 'Santé & Famille', 'Chômage'],
      datasets: [
        {
          label: 'Part Salariale',
          data: [data.retraiteSal || 0, data.santeSal || 0, data.chomageSal || 0],
          backgroundColor: '#60a5fa' // Blue light
        },
        {
          label: 'Part Patronale', 
          data: [data.retraitePat || 0, data.santePat || 0, data.chomagePat || 0],
          backgroundColor: '#8b5cf6' // Purple
        }
      ]
    },
    options: {
      ...getCommonOptions(colors, "Financement de la Protection Sociale"),
      indexAxis: 'y', // Horizontal
      scales: {
        x: {
          ticks: {
            color: colors.text,
            callback: (value) => Math.round(value/1000) + " k€"
          },
          grid: { color: colors.gridLight }
        },
        y: {
          ticks: { color: colors.text },
          grid: { display: false }
        }
      },
      plugins: {
        ...getCommonOptions(colors, "Financement de la Protection Sociale").plugins,
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw).toLocaleString("fr-FR")} €`
          }
        },
        datalabels: {
          display: function(context) {
             return context.dataset.data && 
                    context.dataset.data.length > 0 && 
                    context.dataset.data[context.dataIndex] !== null &&
                    context.dataset.data[context.dataIndex] !== undefined;
          },
          color: 'white',
          font: { weight: 'bold', size: 10 },
          formatter: (value) => {
            if (value < 1000) return "";
            return Math.round(value/1000) + " k€";
          },
          anchor: 'end',
          align: 'end'
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

// ========== IR CHART ==========

function getIrChartConfig(data) {
  const colors = getChartColors();
  // WATERFALL: Revenus (Stacked D1+D2) → Impôt → Net Dispo
  
  const d1 = Math.max(0, data.d1Revenue || 0);
  const d2 = Math.max(0, data.d2Revenue || 0);
  const totalRevenue = d1 + d2;
  const ir = Math.max(0, data.totalIR || 0);
  const net = Math.max(0, data.netFoyer || 0);
  const tmi = data.tmi || 0;

  // Calculate average tax rate
  const avgTaxRate = totalRevenue > 0 ? (ir / totalRevenue) * 100 : 0;
  
  // Calculate waterfall steps (floating bars)
  const step1_end = totalRevenue;
  const step2_start = step1_end - ir;
  const step3_end = net;
  
  return {
    type: 'bar',
    data: {
      labels: ['Revenus', 'Impôt', 'Net Dispo'],
      datasets: [
        // Stack 1: Declarant 1 Revenue (only on first bar)
        {
          label: 'Déclarant 1',
          data: [d1, null, null],
          backgroundColor: colors.revenue,
          stack: 'stack1',
          order: 2
        },
        // Stack 1: Declarant 2 Revenue (only on first bar)
        {
          label: 'Déclarant 2',
          data: [d2, null, null],
          backgroundColor: colors.accent1, // Distinct green
          stack: 'stack1',
          order: 1
        },
        // Stack 1: Impôt (floating bar on second position)
        {
          label: 'Impôt',
          data: [null, [step2_start, step1_end], null],
          backgroundColor: colors.expense,
          stack: 'stack1',
          order: 3
        },
        // Stack 1: Net Dispo (floating bar on third position)
        {
          label: 'Net Dispo',
          data: [null, null, net],
          backgroundColor: colors.net,
          stack: 'stack1',
          order: 4
        }
      ]
    },
    options: {
      ...getCommonOptions(colors, 'Recomposition du Revenu Foyer'),
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: colors.text }
        },
        y: {
          stacked: true,
          grid: { color: colors.gridLight },
          ticks: {
            color: colors.text,
            callback: (value) => Math.round(value/1000) + " k€"
          }
        }
      },
      plugins: {
        ...getCommonOptions(colors, 'Recomposition du Revenu Foyer').plugins,
        legend: {
          display: true, // Show legend to distinguish D1/D2
          position: 'bottom',
          labels: {
            filter: (item) => item.text === 'Déclarant 1' || item.text === 'Déclarant 2', // Only show D1/D2 in legend
            color: colors.text
          }
        },
        datalabels: {
          display: function(context) {
             // Safety check: ensure data exists and is not null
             return context.dataset.data && 
                    context.dataset.data.length > 0 && 
                    context.dataset.data[context.dataIndex] !== null &&
                    context.dataset.data[context.dataIndex] !== undefined;
          },
          color: 'white',
          font: { weight: 'bold', size: 12 },
          formatter: (value, ctx) => {
            let val = 0;
            if (Array.isArray(value)) {
               val = value[1] - value[0];
            } else {
               val = value;
            }
            if (!val || Math.abs(val) < 1000) return "";
            return Math.round(val/1000) + " k€";
          },
          anchor: 'center',
          align: 'center'
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const raw = ctx.raw;
              let value = 0;
              if (Array.isArray(raw)) {
                value = raw[1] - raw[0];
              } else {
                value = raw;
              }
              if (value === null || isNaN(value)) return null;
              
              const lines = [];
              lines.push(`${ctx.dataset.label}: ${Math.round(value).toLocaleString('fr-FR')} €`);
              
              // Add pedagogical explanation for tax bar
              if (ctx.dataset.label === 'Impôt' && totalRevenue > 0) {
                lines.push('');
                lines.push(`💡 Votre dernière tranche est taxée à ${(tmi * 100).toFixed(0)}% (TMI),`);
                lines.push(`mais grâce aux tranches inférieures (0% et 11%),`);
                lines.push(`votre pression fiscale réelle n'est que de ${avgTaxRate.toFixed(1)}%.`);
              }
              
              return lines;
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  };
}

// Track theme to force recreation on change
let lastTheme = null;

// Main update function with option to force recreation
export function updateCharts(mode, data, forceRecreate = false) {
  // Check if theme changed since last update
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (lastTheme !== null && lastTheme !== currentTheme) {
    forceRecreate = true;
  }
  lastTheme = currentTheme;

  switch(mode) {
    case "tns":
      createOrUpdateChart("chartTns1", getTnsChart1Config(data), forceRecreate);
      createOrUpdateChart("chartTns2", getTnsChart2Config(data), forceRecreate);
      createOrUpdateChart("chartTns3", getTnsChart3Config(data), forceRecreate);
      break;
    case "sasuIR":
      createOrUpdateChart("chartSasuIR1", getSasuIRChart1Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIR2", getSasuIRChart2Config(data), forceRecreate);
      break;
    case "sasuIS":
      createOrUpdateChart("chartSasuIS1", getSasuIsChart1Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIS2", getSasuIsChart2Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIS3", getSasuIsChart3Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIS4", getSasuIsChart4Config(data), forceRecreate);
      break;
    case "micro":
      // Force recreation for Micro to update custom plugin + treemap
      createOrUpdateChart("chartMicro1", getMicroChart1Config(data), true);
      createOrUpdateChart("chartMicro2", getMicroChart2Config(data), true);
      break;
    case "salarie":
      createOrUpdateChart("chartSalarie1", getSalarieChart1Config(data), forceRecreate);
      createOrUpdateChart("chartSalarie2", getSalarieChart2Config(data), forceRecreate);
      createOrUpdateChart("chartSalarie3", getSalarieChart3Config(data), forceRecreate);
      break;
    case "ir":
      createOrUpdateChart("chartIrBridge", getIrChartConfig(data), forceRecreate);
      break;
    default:
      console.warn(`Unknown chart mode: ${mode}`);
  }
  
  // Initialize pagination for mobile slider
  setTimeout(setupChartPagination, 100);
}

function setupChartPagination() {
  // Handle both chart containers and IR columns slider
  const containers = document.querySelectorAll('.charts-container, .ir-columns');
  
  containers.forEach(container => {
    // Only process visible containers to avoid layout issues
    if (container.offsetParent === null) return;
    
    // Determine item selector based on container type
    const isIrSlider = container.classList.contains('ir-columns');
    const itemSelector = isIrSlider ? '.ir-column' : '.chart-wrapper';
    
    // Check if pagination already exists
    let pagination = container.nextElementSibling;
    if (!pagination || !pagination.classList.contains('chart-pagination')) {
      pagination = document.createElement('div');
      pagination.className = 'chart-pagination';
      container.parentNode.insertBefore(pagination, container.nextSibling);
    }
    
    // Clear existing dots
    pagination.innerHTML = '';
    
    const items = container.querySelectorAll(itemSelector);
    // Filter out hidden items (e.g. Declarant 2 if hidden)
    const visibleItems = Array.from(items).filter(item => {
      return window.getComputedStyle(item).display !== 'none';
    });
    
    if (visibleItems.length <= 1) {
      pagination.style.display = 'none';
      return; 
    } else {
      // Restore display if it was hidden by this script
      // Note: CSS media query handles desktop/mobile hiding
      pagination.style.display = ''; 
    }
    
    // Create dots
    const updateActiveDot = () => {
      const scrollLeft = container.scrollLeft;
      const containerCenter = scrollLeft + (container.offsetWidth / 2);
      
      // Find item closest to center
      let activeIndex = 0;
      let minDistance = Infinity;
      
      visibleItems.forEach((item, index) => {
        const itemCenter = item.offsetLeft + (item.offsetWidth / 2);
        const distance = Math.abs(containerCenter - itemCenter);
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }
      });
      
      const dots = pagination.querySelectorAll('.chart-dot');
      dots.forEach((dot, i) => {
        if (i === activeIndex) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    };

    visibleItems.forEach((item, index) => {
      const dot = document.createElement('div');
      dot.className = 'chart-dot';
      dot.onclick = () => {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      };
      pagination.appendChild(dot);
    });
    
    // Initial update
    updateActiveDot();
    
    // Update active dot on scroll with debounce
    let timeout;
    container.onscroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateActiveDot, 50);
    };
  });
}
