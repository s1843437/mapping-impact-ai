document.addEventListener("DOMContentLoaded", () => {
    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    document.body.appendChild(tooltip);

    const showTip = (evt, text) => {
        tooltip.textContent = text;
        tooltip.style.opacity = "1";
        tooltip.style.left = `${evt.clientX + 12}px`;
        tooltip.style.top = `${evt.clientY - 28}px`;
    };

    const moveTip = (evt) => {
        tooltip.style.left = `${evt.clientX + 12}px`;
        tooltip.style.top = `${evt.clientY - 28}px`;
    };

    const hideTip = () => {
        tooltip.style.opacity = "0";
    };

    const svgEl = (tag, attrs = {}) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    };

    fetch("data.json")
        .then((res) => {
            if (!res.ok) throw new Error("Unable to load data.json");
            return res.json();
        })
        .then((data) => {
            renderBarChart(data.barchart);
            renderGroupedBarChart(data.grouped_barchart);
            renderHeatmap(data.heatmap);
            renderStacked100(data.stacked_100);
            renderWaffle(data.waffle);
        })
        .catch((err) => {
            console.error(err);
            document.querySelectorAll(".chart-container").forEach((box) => {
                box.innerHTML = "<p>Chart data could not be loaded. Serve the folder via a local web server or GitHub Pages.</p>";
            });
        });

    // 1. Bar Chart
    function renderBarChart(items) {
        const container = document.getElementById("chart-barchart");
        const width = 760;
        const rowH = 42;
        const margin = { top: 10, right: 50, bottom: 25, left: 210 };
        const height = margin.top + margin.bottom + items.length * rowH;
        const maxVal = Math.max(...items.map((d) => d.value), 10);
        const plotW = width - margin.left - margin.right;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        items.forEach((d, i) => {
            const y = margin.top + i * rowH;
            const barW = (d.value / maxVal) * plotW;

            const lbl = svgEl("text", {
                x: margin.left - 10,
                y: y + 22,
                "text-anchor": "end",
                "font-size": "13",
                fill: "#2b2b2b"
            });
            lbl.textContent = d.label;
            svg.appendChild(lbl);

            const rect = svgEl("rect", {
                x: margin.left,
                y: y + 6,
                width: Math.max(barW, 2),
                height: 26,
                rx: 4,
                fill: "#007C58"
            });
            rect.addEventListener("mouseenter", (e) => showTip(e, `${d.label}: ${d.value}%`));
            rect.addEventListener("mousemove", moveTip);
            rect.addEventListener("mouseleave", hideTip);
            svg.appendChild(rect);

            const valTxt = svgEl("text", {
                x: margin.left + barW + 8,
                y: y + 24,
                "font-size": "13",
                "font-weight": "600",
                fill: "#002677"
            });
            valTxt.textContent = `${d.value}%`;
            svg.appendChild(valTxt);
        });

        container.appendChild(svg);
    }

    // 2. Grouped Bar Chart
    function renderGroupedBarChart(cfg) {
        const container = document.getElementById("chart-grouped");
        const colors = ["#002677", "#007C58"];

        const legend = document.createElement("div");
        legend.className = "chart-legend";
        cfg.series.forEach((s, idx) => {
            legend.innerHTML += `<span class="legend-item"><span class="legend-swatch" style="background:${colors[idx % colors.length]}"></span>${s.name}</span>`;
        });
        container.appendChild(legend);

        const width = 760;
        const height = 310;
        const margin = { top: 20, right: 20, bottom: 55, left: 45 };
        const plotW = width - margin.left - margin.right;
        const plotH = height - margin.top - margin.bottom;
        const maxVal = 100;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        [0, 25, 50, 75, 100].forEach((tick) => {
            const y = margin.top + plotH - (tick / maxVal) * plotH;
            svg.appendChild(svgEl("line", {
                x1: margin.left, y1: y, x2: width - margin.right, y2: y,
                stroke: "#e2e8f0", "stroke-width": "1"
            }));
            const t = svgEl("text", {
                x: margin.left - 8, y: y + 4,
                "text-anchor": "end", "font-size": "11", fill: "#555"
            });
            t.textContent = `${tick}%`;
            svg.appendChild(t);
        });

        const groupW = plotW / cfg.categories.length;
        const barW = Math.min(34, (groupW * 0.65) / cfg.series.length);

        cfg.categories.forEach((cat, cIdx) => {
            const groupX = margin.left + cIdx * groupW + (groupW - barW * cfg.series.length) / 2;

            cfg.series.forEach((s, sIdx) => {
                const val = s.values[cIdx];
                const h = (val / maxVal) * plotH;
                const x = groupX + sIdx * barW;
                const y = margin.top + plotH - h;

                const rect = svgEl("rect", {
                    x, y, width: barW - 3, height: h, rx: 3,
                    fill: colors[sIdx % colors.length]
                });
                rect.addEventListener("mouseenter", (e) => showTip(e, `${s.name} — ${cat}: ${val}%`));
                rect.addEventListener("mousemove", moveTip);
                rect.addEventListener("mouseleave", hideTip);
                svg.appendChild(rect);
            });

            const catLbl = svgEl("text", {
                x: margin.left + cIdx * groupW + groupW / 2,
                y: height - 18,
                "text-anchor": "middle",
                "font-size": "12",
                fill: "#2b2b2b"
            });
            catLbl.textContent = cat;
            svg.appendChild(catLbl);
        });

        container.appendChild(svg);
    }

    // 3. Heatmap
    function renderHeatmap(cfg) {
        const container = document.getElementById("chart-heatmap");
        const cols = cfg.metrics.length;
        const rows = cfg.countries.length;
        const margin = { top: 55, right: 20, bottom: 20, left: 130 };
        const cellW = 105;
        const cellH = 38;
        const width = margin.left + cols * cellW + margin.right;
        const height = margin.top + rows * cellH + margin.bottom;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        cfg.metrics.forEach((m, c) => {
            const txt = svgEl("text", {
                x: margin.left + c * cellW + cellW / 2,
                y: margin.top - 14,
                "text-anchor": "middle",
                "font-size": "12",
                "font-weight": "600",
                fill: "#002677"
            });
            txt.textContent = m;
            svg.appendChild(txt);
        });

        cfg.countries.forEach((country, r) => {
            const y = margin.top + r * cellH;
            const rowLbl = svgEl("text", {
                x: margin.left - 10,
                y: y + cellH / 2 + 4,
                "text-anchor": "end",
                "font-size": "12",
                "font-weight": country === "Italy" || country === "EU Average" ? "700" : "400",
                fill: "#2b2b2b"
            });
            rowLbl.textContent = country;
            svg.appendChild(rowLbl);

            cfg.matrix[r].forEach((val, c) => {
                const x = margin.left + c * cellW;
                const intensity = Math.max(0.12, Math.min(1, val / 100));
                const rect = svgEl("rect", {
                    x: x + 2, y: y + 2,
                    width: cellW - 4, height: cellH - 4,
                    rx: 4,
                    fill: `rgba(0, 124, 88, ${intensity})`
                });
                rect.addEventListener("mouseenter", (e) => showTip(e, `${country} — ${cfg.metrics[c]}: ${val}`));
                rect.addEventListener("mousemove", moveTip);
                rect.addEventListener("mouseleave", hideTip);
                svg.appendChild(rect);

                const valTxt = svgEl("text", {
                    x: x + cellW / 2,
                    y: y + cellH / 2 + 4,
                    "text-anchor": "middle",
                    "font-size": "12",
                    "font-weight": "600",
                    fill: intensity > 0.58 ? "#ffffff" : "#1a202c"
                });
                valTxt.textContent = val;
                svg.appendChild(valTxt);
            });
        });

        container.appendChild(svg);
    }

    // 4. 100% Stacked Bar Chart
    function renderStacked100(rowsData) {
        const container = document.getElementById("chart-stacked100");
        const categories = [
            { key: "high", label: "High Risk", color: "#002677" },
            { key: "limited", label: "Limited Risk", color: "#007C58" },
            { key: "minimal", label: "Minimal Risk", color: "#88b8a8" }
        ];

        const legend = document.createElement("div");
        legend.className = "chart-legend";
        categories.forEach((c) => {
            legend.innerHTML += `<span class="legend-item"><span class="legend-swatch" style="background:${c.color}"></span>${c.label}</span>`;
        });
        container.appendChild(legend);

        const width = 760;
        const rowH = 44;
        const margin = { top: 10, right: 20, bottom: 20, left: 220 };
        const height = margin.top + margin.bottom + rowsData.length * rowH;
        const barTotalW = width - margin.left - margin.right;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        rowsData.forEach((row, idx) => {
            const y = margin.top + idx * rowH;
            const total = categories.reduce((acc, c) => acc + (row[c.key] || 0), 0) || 100;

            const lbl = svgEl("text", {
                x: margin.left - 10, y: y + 23,
                "text-anchor": "end", "font-size": "12.5", fill: "#2b2b2b"
            });
            lbl.textContent = row.domain;
            svg.appendChild(lbl);

            let curX = margin.left;
            categories.forEach((c) => {
                const pct = Math.round(((row[c.key] || 0) / total) * 100);
                const w = (pct / 100) * barTotalW;

                const rect = svgEl("rect", {
                    x: curX, y: y + 7, width: w, height: 26,
                    fill: c.color, stroke: "#ffffff", "stroke-width": "1.5"
                });
                rect.addEventListener("mouseenter", (e) => showTip(e, `${row.domain} — ${c.label}: ${pct}%`));
                rect.addEventListener("mousemove", moveTip);
                rect.addEventListener("mouseleave", hideTip);
                svg.appendChild(rect);

                if (pct >= 12) {
                    const txt = svgEl("text", {
                        x: curX + w / 2, y: y + 24,
                        "text-anchor": "middle", "font-size": "11.5",
                        "font-weight": "600", fill: "#ffffff"
                    });
                    txt.textContent = `${pct}%`;
                    svg.appendChild(txt);
                }

                curX += w;
            });
        });

        container.appendChild(svg);
    }

    // 5. Waffle Chart
    function renderWaffle(cfg) {
        const container = document.getElementById("chart-waffle");
        const pct = Math.max(0, Math.min(100, Number(cfg.percentage) || 0));

        const wrapper = document.createElement("div");
        wrapper.className = "waffle-wrapper";

        const grid = document.createElement("div");
        grid.className = "waffle-grid";

        for (let i = 0; i < 100; i++) {
            const cell = document.createElement("div");
            cell.className = `waffle-cell ${i < pct ? "filled" : ""}`;
            cell.addEventListener("mouseenter", (e) => showTip(e, `${pct}% (${i < pct ? "Included" : "Not included"} — 1% per cell)`));
            cell.addEventListener("mousemove", moveTip);
            cell.addEventListener("mouseleave", hideTip);
            grid.appendChild(cell);
        }

        const kpi = document.createElement("div");
        kpi.className = "waffle-kpi";
        kpi.innerHTML = `
            <div class="waffle-number">${pct}%</div>
            <div><strong>${cfg.label}</strong></div>
            <p class="chart-desc" style="margin-top:0.4rem;margin-bottom:0;">${cfg.note}</p>
        `;

        wrapper.appendChild(grid);
        wrapper.appendChild(kpi);
        container.appendChild(wrapper);
    }
});