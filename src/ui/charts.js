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
      grid: "#374151",
      gridLight: "#1f2937",
      background: "rgba(17, 24, 39, 0.5)",
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
      grid: "#d1d5db",
      gridLight: "#f3f4f6",
      background: "rgba(255, 255, 255, 0.8)",
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
    plugins: {
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
      },
    },
  };
}

// Destroy specific charts to force recreation
function destroyCharts(mode) {
  const chartIds = {
    tns: ["chartTns1", "chartTns2"],
    sasuIR: ["chartSasuIR1", "chartSasuIR2"],
    sasuIS: ["chartSasuIS1", "chartSasuIS2"],
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

  console.log(`[Chart] ${canvasId} - forceRecreate:`, forceRecreate, 'exists:', !!chartInstances[canvasId]);

  // If force recreate or chart exists, destroy it first
  if (chartInstances[canvasId] && forceRecreate) {
    console.log(`[Chart] ${canvasId} - DESTROYING for recreation`);
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
  
  // If chart still exists (not forced to recreate), just update
  if (chartInstances[canvasId]) {
    console.log(`[Chart] ${canvasId} - UPDATING existing chart`);
    const chart = chartInstances[canvasId];
    chart.data = config.data;
    chart.options = config.options;
    chart.update();
    return chart;
  }

  // Create new chart (either first time or after destroy)
  console.log(`[Chart] ${canvasId} - CREATING new chart`);
  const ctx = canvas.getContext("2d");
  chartInstances[canvasId] = new Chart(ctx, config);
  
  return chartInstances[canvasId];
}

// ========== TNS CHARTS ==========

function getTnsChart1Config(data) {
  const colors = getChartColors();
  
  return {
    type: "doughnut",
    data: {
      labels: ["Revenus nets (R)", "Cotisations sociales", "CSG/CRDS"],
      datasets: [{
        data: [data.net, data.cotis, data.csg],
        backgroundColor: [colors.net, colors.social, colors.expense],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Répartition du revenu"),
      cutout: "65%",
      plugins: {
        ...getCommonOptions(colors, "Répartition du revenu").plugins,
        tooltip: {
          ...getCommonOptions(colors, "Répartition du revenu").plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

function getTnsChart2Config(data) {
  const colors = getChartColors();
  const total = data.net + data.cotis + data.csg;
  const tauxCotis = ((data.cotis / data.net) * 100).toFixed(1);
  const tauxCsg = ((data.csg / data.net) * 100).toFixed(1);
  const tauxTotal = ((data.cotis + data.csg) / data.net * 100).toFixed(1);
  
  return {
    type: "bar",
    data: {
      labels: ["Taux de charges"],
      datasets: [
        {
          label: `Cotisations (${tauxCotis}%)`,
          data: [data.cotis],
          backgroundColor: colors.social,
        },
        {
          label: `CSG/CRDS (${tauxCsg}%)`,
          data: [data.csg],
          backgroundColor: colors.expense,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, "Taux de prélèvements sociaux"),
      indexAxis: "y",
      scales: {
        x: {
          stacked: false,
          ticks: {
            color: colors.text,
            callback: function(value) {
              return value.toLocaleString("fr-FR") + " €";
            },
          },
          grid: { color: colors.gridLight, drawTicks: false },
        },
        y: {
          stacked: false,
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
      plugins: {
        ...getCommonOptions(colors, `Taux de prélèvements sociaux (${tauxTotal}% sur R)`).plugins,
        tooltip: {
          ...getCommonOptions(colors, "Taux de prélèvements sociaux").plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || "";
              const value = context.parsed.x || 0;
              return `${label}: ${value.toLocaleString("fr-FR")} €`;
            },
          },
        },
      },
    },
  };
}

// ========== SASU IR CHARTS ==========

function getSasuIRChart1Config(data) {
  const colors = getChartColors();
  
  return {
    type: "doughnut",
    data: {
      labels: ["Salaire net", "BNC net", "PS sur BNC"],
      datasets: [{
        data: [data.salaireNet, data.bncNet, data.charges],
        backgroundColor: [colors.net, colors.revenue, colors.tax],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Composition des revenus"),
      cutout: "65%",
      plugins: {
        ...getCommonOptions(colors, "Composition des revenus").plugins,
        tooltip: {
          ...getCommonOptions(colors, "Composition des revenus").plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

function getSasuIRChart2Config(data) {
  const colors = getChartColors();
  const totalBrut = data.salaireNet + data.bncNet + data.charges;
  const tauxPS = ((data.charges / data.bncNet) * 100).toFixed(1);
  
  return {
    type: "bar",
    data: {
      labels: ["Revenus"],
      datasets: [
        {
          label: "Salaire",
          data: [data.salaireNet],
          backgroundColor: colors.net,
        },
        {
          label: "BNC (après PS)",
          data: [data.bncNet],
          backgroundColor: colors.revenue,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, `Revenus nets (PS à ${tauxPS}% sur BNC)`),
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: colors.text,
            callback: function(value) {
              return value.toLocaleString("fr-FR") + " €";
            },
          },
          grid: { color: colors.gridLight, drawTicks: false },
        },
        y: {
          stacked: true,
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
    },
  };
}

// ========== SASU IS CHARTS ==========

function getSasuISChart1Config(data) {
  const colors = getChartColors();
  
  return {
    type: "bar",
    data: {
      labels: ["Utilisation du CA"],
      datasets: [
        {
          label: "Charges externes",
          data: [data.chargesExt],
          backgroundColor: colors.external,
        },
        {
          label: "Charges sociales",
          data: [data.chargesSoc],
          backgroundColor: colors.social,
        },
        {
          label: "IS",
          data: [data.is],
          backgroundColor: colors.tax,
        },
        {
          label: "Net dirigeant",
          data: [data.net],
          backgroundColor: colors.revenue,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, "Allocation du chiffre d'affaires"),
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: colors.text,
            callback: function(value) {
              return value.toLocaleString("fr-FR") + " €";
            },
          },
          grid: { color: colors.gridLight, drawTicks: false },
        },
        y: {
          stacked: true,
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
    },
  };
}

function getSasuISChart2Config(data) {
  const colors = getChartColors();
  const total = data.chargesExt + data.chargesSoc + data.is + data.net;
  
  return {
    type: "doughnut",
    data: {
      labels: ["Net dirigeant", "Charges sociales", "IS", "Charges externes"],
      datasets: [{
        data: [data.net, data.chargesSoc, data.is, data.chargesExt],
        backgroundColor: [colors.revenue, colors.social, colors.tax, colors.external],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Répartition des coûts"),
      cutout: "65%",
      plugins: {
        ...getCommonOptions(colors, "Répartition des coûts").plugins,
        tooltip: {
          ...getCommonOptions(colors, "Répartition des coûts").plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

// ========== MICRO CHARTS ==========

function getMicroChart1Config(data) {
  const colors = getChartColors();
  
  return {
    type: "doughnut",
    data: {
      labels: ["Rémunération nette", "Cotisations sociales"],
      datasets: [{
        data: [data.net, data.cotis],
        backgroundColor: [colors.revenue, colors.social],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, "Répartition CA"),
      cutout: "65%",
      plugins: {
        ...getCommonOptions(colors, "Répartition CA").plugins,
        tooltip: {
          ...getCommonOptions(colors, "Répartition CA").plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

function getMicroChart2Config(data) {
  const colors = getChartColors();
  const total = data.net + data.cotis;
  const tauxCotis = ((data.cotis / total) * 100).toFixed(1);
  
  return {
    type: "bar",
    data: {
      labels: ["CA"],
      datasets: [
        {
          label: `Rémunération (${(100 - parseFloat(tauxCotis)).toFixed(1)}%)`,
          data: [data.net],
          backgroundColor: colors.revenue,
        },
        {
          label: `Cotisations (${tauxCotis}%)`,
          data: [data.cotis],
          backgroundColor: colors.social,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, "Taux de cotisations"),
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: colors.text,
            callback: function(value) {
              return value.toLocaleString("fr-FR") + " €";
            },
          },
          grid: { color: colors.gridLight, drawTicks: false },
        },
        y: {
          stacked: true,
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
    },
  };
}

// ========== SALARIE CHARTS ==========

function getSalarieChart1Config(data) {
  const colors = getChartColors();
  
  return {
    type: "bar",
    data: {
      labels: ["Coût total employeur"],
      datasets: [
        {
          label: "Net salarié",
          data: [data.net],
          backgroundColor: colors.revenue,
        },
        {
          label: "Charges salariales",
          data: [data.chargesSal],
          backgroundColor: colors.social,
        },
        {
          label: "Charges patronales",
          data: [data.chargesPat],
          backgroundColor: colors.expense,
        },
      ],
    },
    options: {
      ...getCommonOptions(colors, "Décomposition du super-brut"),
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: colors.text,
            callback: function(value) {
              return value.toLocaleString("fr-FR") + " €";
            },
          },
          grid: { color: colors.gridLight, drawTicks: false },
        },
        y: {
          stacked: true,
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
    },
  };
}

function getSalarieChart2Config(data) {
  const colors = getChartColors();
  const brut = data.net + data.chargesSal;
  const tauxSal = ((data.chargesSal / brut) * 100).toFixed(1);
  const tauxPat = ((data.chargesPat / brut) * 100).toFixed(1);
  
  return {
    type: "doughnut",
    data: {
      labels: ["Net salarié", "Charges salariales", "Charges patronales"],
      datasets: [{
        data: [data.net, data.chargesSal, data.chargesPat],
        backgroundColor: [colors.revenue, colors.social, colors.expense],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getCommonOptions(colors, `Taux de charges (Sal: ${tauxSal}% | Pat: ${tauxPat}%)`),
      cutout: "65%",
      plugins: {
        ...getCommonOptions(colors, `Taux de charges (Sal: ${tauxSal}% | Pat: ${tauxPat}%)`).plugins,
        tooltip: {
          ...getCommonOptions(colors, `Taux de charges (Sal: ${tauxSal}% | Pat: ${tauxPat}%)`).plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString("fr-FR")} € (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

// Main update function with option to force recreation
export function updateCharts(mode, data, forceRecreate = false) {
  switch(mode) {
    case "tns":
      createOrUpdateChart("chartTns1", getTnsChart1Config(data), forceRecreate);
      createOrUpdateChart("chartTns2", getTnsChart2Config(data), forceRecreate);
      break;
    case "sasuIR":
      createOrUpdateChart("chartSasuIR1", getSasuIRChart1Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIR2", getSasuIRChart2Config(data), forceRecreate);
      break;
    case "sasuIS":
      createOrUpdateChart("chartSasuIS1", getSasuISChart1Config(data), forceRecreate);
      createOrUpdateChart("chartSasuIS2", getSasuISChart2Config(data), forceRecreate);
      break;
    case "micro":
      createOrUpdateChart("chartMicro1", getMicroChart1Config(data), forceRecreate);
      createOrUpdateChart("chartMicro2", getMicroChart2Config(data), forceRecreate);
      break;
    case "salarie":
      createOrUpdateChart("chartSalarie1", getSalarieChart1Config(data));
      createOrUpdateChart("chartSalarie2", getSalarieChart2Config(data));
      break;
    default:
      console.warn(`Unknown chart mode: ${mode}`);
  }
}
