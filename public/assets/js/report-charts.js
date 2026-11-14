/*
 * Thingaha report charts
 * Shared Chart.js (v3) helpers for the activity_*.html report pages.
 * Each page only declares its data and calls these functions, so the
 * chart styling, accessibility labels and legends stay consistent.
 */
(function (global) {
  'use strict';

  if (!global.Chart) return;

  var PALETTE = {
    navy: '#00018A',
    gold: '#D6B10B',
    blue: '#4285f4',
    sky: '#3EB8F4',
    green: '#57c87b',
    purple: '#a682ff',
    orange: '#f3b05a',
    red: '#f07178',
    pink: '#eb7bc0',
    yellow: '#f7dc52',
    grey: '#b8bfcc',
    female: '#eb7bc0',
    male: '#4285f4'
  };

  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Chart.defaults.font.family = '"Lato", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  Chart.defaults.color = '#574804';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  if (reduceMotion) Chart.defaults.animation = false;

  function el(id) {
    return document.getElementById(id);
  }

  function sum(values) {
    return values.reduce(function (a, b) { return a + b; }, 0);
  }

  function percent(value, total, digits) {
    if (!total) return '0%';
    var d = digits === undefined ? 1 : digits;
    return (value / total * 100).toFixed(d).replace(/\.0+$/, '') + '%';
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
  }

  /* Give the canvas a text alternative that screen readers announce. */
  function describe(canvas, title, labels, data, unit) {
    var parts = labels.map(function (label, i) {
      return label + ': ' + formatNumber(data[i]) + (unit ? ' ' + unit : '');
    });
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', title + '. ' + parts.join('; ') + '.');
  }

  /* Render a legend list (<ul>) with count and percentage for each item. */
  function legend(listId, cfg) {
    var list = el(listId);
    if (!list) return;
    var total = sum(cfg.data);
    list.innerHTML = '';
    cfg.labels.forEach(function (label, i) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="swatch" aria-hidden="true"></span>' +
        '<span class="label"></span>' +
        '<span class="value"></span>';
      li.querySelector('.swatch').style.setProperty('--swatch', cfg.colors[i % cfg.colors.length]);
      li.querySelector('.label').textContent = label;
      li.querySelector('.value').textContent =
        cfg.data[i] + ' (' + (cfg.percentages ? cfg.percentages[i] : percent(cfg.data[i], total)) + ')';
      list.appendChild(li);
    });
  }

  /* Doughnut or pie chart, e.g. gender split or satisfaction. */
  function share(canvasId, cfg) {
    var canvas = el(canvasId);
    if (!canvas) return null;
    describe(canvas, cfg.title, cfg.labels, cfg.data, cfg.unit);
    var total = sum(cfg.data);
    return new Chart(canvas, {
      type: cfg.type || 'doughnut',
      data: {
        labels: cfg.labels,
        datasets: [{
          label: cfg.title,
          data: cfg.data,
          backgroundColor: cfg.colors,
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: cfg.showLegend !== false, position: 'bottom' },
          title: { display: !!cfg.showTitle, text: cfg.title },
          tooltip: {
            callbacks: {
              label: function (c) {
                return ' ' + c.label + ': ' + c.raw + ' (' + percent(c.raw, total) + ')';
              }
            }
          }
        }
      }
    });
  }

  /* Horizontal bar chart, e.g. drop-out reasons or difficulties. */
  function bars(canvasId, cfg) {
    var canvas = el(canvasId);
    if (!canvas) return null;
    describe(canvas, cfg.title, cfg.labels, cfg.data, cfg.unit || 'students');
    var colors = Array.isArray(cfg.colors) ? cfg.colors : cfg.labels.map(function () { return cfg.colors; });
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: cfg.labels,
        datasets: [{
          label: cfg.seriesLabel || 'Students',
          data: cfg.data,
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 36
        }]
      },
      options: {
        indexAxis: cfg.vertical ? 'x' : 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                var extra = cfg.percentages ? ' (' + cfg.percentages[c.dataIndex] + ')' : '';
                return ' ' + (cfg.seriesLabel || 'Students') + ': ' + c.raw + extra;
              }
            }
          }
        },
        scales: (function () {
          var value = {
            beginAtZero: true,
            suggestedMax: cfg.max,
            ticks: { stepSize: cfg.step || 1, precision: 0 },
            title: { display: !!cfg.valueAxisLabel, text: cfg.valueAxisLabel }
          };
          var category = {
            grid: { display: false },
            ticks: { autoSkip: false },
            title: { display: !!cfg.categoryAxisLabel, text: cfg.categoryAxisLabel }
          };
          return cfg.vertical ? { x: category, y: value } : { x: value, y: category };
        })()
      }
    });
  }

  /* Stacked budget chart: contributions vs expenses in MMK. */
  function budget(canvasId, cfg) {
    var canvas = el(canvasId);
    if (!canvas) return null;
    var datasets = cfg.contributions.map(function (item) {
      return { label: item.label, data: [item.amount, 0], backgroundColor: item.color, stack: 'budget' };
    }).concat(cfg.expenses.map(function (item) {
      return { label: item.label, data: [0, item.amount], backgroundColor: item.color, stack: 'budget' };
    }));
    var totals = [
      sum(cfg.contributions.map(function (i) { return i.amount; })),
      sum(cfg.expenses.map(function (i) { return i.amount; }))
    ];
    describe(canvas, 'Budget in MMK', ['Total contribution', 'Total expenses'], totals, 'MMK');
    return new Chart(canvas, {
      type: 'bar',
      data: { labels: ['Contribution', 'Expenses'], datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10 } },
          tooltip: {
            filter: function (item) { return item.parsed.y > 0; },
            callbacks: {
              label: function (c) {
                return ' ' + c.dataset.label + ': MMK ' + formatNumber(c.parsed.y);
              },
              footer: function (items) {
                if (!items.length) return '';
                return 'Column total: MMK ' + formatNumber(totals[items[0].dataIndex]);
              }
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value >= 1000000 ? (value / 1000000) + 'M' : formatNumber(value);
              }
            },
            title: { display: true, text: 'MMK' }
          }
        }
      }
    });
  }

  global.ThingahaCharts = {
    palette: PALETTE,
    percent: percent,
    share: share,
    bars: bars,
    budget: budget,
    legend: legend
  };
})(window);
