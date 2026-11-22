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
            renderDumbbell(data.dumbbell);
            renderCirclePacking(data.circle_packing);
            renderStackedSmallMultiples(data.stacked_small_multiples);
            renderPieChart(data.pie_chart);
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
        if (!container || !Array.isArray(items)) return;

        const width = 760;
        const rowH = 42;
        const margin = { top: 10, right: 50, bottom: 25, left: 210 };
        const height = margin.top + margin.bottom + items.length * rowH;
        const maxVal = Math.max(...items.map((d) => Number(d.value) || 0), 10);
        const plotW = width - margin.left - margin.right;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        items.forEach((d, i) => {
            const val = Number(d.value) || 0;
            const y = margin.top + i * rowH;
            const barW = (val / maxVal) * plotW;

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
            rect.addEventListener("mouseenter", (e) => showTip(e, `${d.label}: ${val}%`));
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
            valTxt.textContent = `${val}%`;
            svg.appendChild(valTxt);
        });

        container.appendChild(svg);
    }

    // 2. Grouped Bar Chart
    function renderGroupedBarChart(cfg) {
        const container = document.getElementById("chart-grouped");
        if (!container || !cfg || !Array.isArray(cfg.categories) || !Array.isArray(cfg.series)) return;

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
                const val = Number(s.values[cIdx]) || 0;
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
        if (!container || !cfg || !Array.isArray(cfg.countries) || !Array.isArray(cfg.metrics) || !Array.isArray(cfg.matrix)) return;

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

            cfg.matrix[r].forEach((rawVal, c) => {
                const val = Number(rawVal) || 0;
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
        if (!container || !Array.isArray(rowsData)) return;

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
            const total = categories.reduce((acc, c) => acc + (Number(row[c.key]) || 0), 0) || 100;

            const lbl = svgEl("text", {
                x: margin.left - 10, y: y + 23,
                "text-anchor": "end", "font-size": "12.5", fill: "#2b2b2b"
            });
            lbl.textContent = row.domain;
            svg.appendChild(lbl);

            let curX = margin.left;
            categories.forEach((c) => {
                const pct = Math.round(((Number(row[c.key]) || 0) / total) * 100);
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
        if (!container || !cfg) return;

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
            <div><strong>${cfg.label || ""}</strong></div>
            <p class="chart-desc" style="margin-top:0.4rem;margin-bottom:0;">${cfg.note || ""}</p>
        `;

        wrapper.appendChild(grid);
        wrapper.appendChild(kpi);
        container.appendChild(wrapper);
    }

    // Extra 1: Dumbbell Plot (Italy vs EU Average)
    function renderDumbbell(items) {
        const container = document.getElementById("chart-dumbbell");
        if (!container || !Array.isArray(items)) return;

        const legend = document.createElement("div");
        legend.className = "chart-legend";
        legend.innerHTML = `
            <span class="legend-item"><span class="legend-swatch" style="background:#002677"></span>Italy</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#007C58"></span>EU Average</span>
        `;
        container.appendChild(legend);

        const width = 760;
        const rowH = 52;
        const margin = { top: 16, right: 35, bottom: 28, left: 225 };
        const height = margin.top + margin.bottom + items.length * rowH;
        const plotW = width - margin.left - margin.right;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        [0, 25, 50, 75, 100].forEach((tick) => {
            const x = margin.left + (tick / 100) * plotW;
            svg.appendChild(svgEl("line", {
                x1: x, y1: margin.top, x2: x, y2: height - margin.bottom,
                stroke: "#e2e8f0", "stroke-width": "1"
            }));
            const t = svgEl("text", {
                x, y: height - 8,
                "text-anchor": "middle", "font-size": "11", fill: "#555"
            });
            t.textContent = `${tick}`;
            svg.appendChild(t);
        });

        items.forEach((d, i) => {
            const itVal = Number(d.italy) || 0;
            const euVal = Number(d.eu) || 0;
            const cy = margin.top + i * rowH + rowH / 2;
            const xIt = margin.left + (itVal / 100) * plotW;
            const xEu = margin.left + (euVal / 100) * plotW;

            const lbl = svgEl("text", {
                x: margin.left - 12, y: cy + 4,
                "text-anchor": "end", "font-size": "12.5", fill: "#2b2b2b"
            });
            lbl.textContent = d.metric;
            svg.appendChild(lbl);

            svg.appendChild(svgEl("line", {
                x1: xIt, y1: cy, x2: xEu, y2: cy,
                stroke: "#94a3b8", "stroke-width": "3"
            }));

            const cIt = svgEl("circle", {
                cx: xIt, cy, r: 7, fill: "#002677", stroke: "#ffffff", "stroke-width": "1.5"
            });
            cIt.addEventListener("mouseenter", (e) => showTip(e, `${d.metric} — Italy: ${itVal}`));
            cIt.addEventListener("mousemove", moveTip);
            cIt.addEventListener("mouseleave", hideTip);
            svg.appendChild(cIt);

            const cEu = svgEl("circle", {
                cx: xEu, cy, r: 7, fill: "#007C58", stroke: "#ffffff", "stroke-width": "1.5"
            });
            cEu.addEventListener("mouseenter", (e) => showTip(e, `${d.metric} — EU Average: ${euVal}`));
            cEu.addEventListener("mousemove", moveTip);
            cEu.addEventListener("mouseleave", hideTip);
            svg.appendChild(cEu);
        });

        container.appendChild(svg);
    }

    // Extra 2: Circle Packing
    function renderCirclePacking(root) {
        const container = document.getElementById("chart-circlepacking");
        if (!container || !root || !Array.isArray(root.children)) return;

        const width = 760;
        const height = 360;
        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        const groups = root.children;
        const groupTotals = groups.map((g) =>
            (g.children || []).reduce((sum, item) => sum + (Number(item.value) || 0), 0)
        );
        const totalAll = groupTotals.reduce((a, b) => a + b, 0) || 1;

        const palette = ["#007C58", "#002677", "#2b6cb0"];
        const slotW = width / groups.length;

        groups.forEach((grp, gIdx) => {
            const baseColor = palette[gIdx % palette.length];
            const ratio = groupTotals[gIdx] / totalAll;
            const maxR = Math.min(slotW * 0.42, height * 0.36);
            const outerR = Math.max(52, maxR * Math.sqrt(ratio * groups.length * 0.85));
            const cx = slotW * gIdx + slotW / 2;
            const cy = height / 2 + 8;

            const outerCircle = svgEl("circle", {
                cx, cy, r: outerR,
                fill: baseColor, "fill-opacity": "0.14",
                stroke: baseColor, "stroke-width": "2"
            });
            outerCircle.addEventListener("mouseenter", (e) => showTip(e, `${grp.name}: ${groupTotals[gIdx]} total`));
            outerCircle.addEventListener("mousemove", moveTip);
            outerCircle.addEventListener("mouseleave", hideTip);
            svg.appendChild(outerCircle);

            const grpTitle = svgEl("text", {
                x: cx, y: cy - outerR - 10,
                "text-anchor": "middle", "font-size": "12.5",
                "font-weight": "700", fill: baseColor
            });
            grpTitle.textContent = grp.name;
            svg.appendChild(grpTitle);

            const kids = grp.children || [];
            const kidMax = Math.max(...kids.map((k) => Number(k.value) || 0), 1);
            const spread = outerR * 0.45;

            kids.forEach((kid, kIdx) => {
                const val = Number(kid.value) || 0;
                const angle = (kIdx / Math.max(kids.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const offset = kids.length > 1 ? spread : 0;
                const kx = cx + Math.cos(angle) * offset;
                const ky = cy + Math.sin(angle) * offset;
                const kr = Math.max(16, (outerR * 0.42) * Math.sqrt(val / kidMax));

                const innerCircle = svgEl("circle", {
                    cx: kx, cy: ky, r: kr,
                    fill: baseColor, "fill-opacity": "0.85",
                    stroke: "#ffffff", "stroke-width": "1.5"
                });
                innerCircle.addEventListener("mouseenter", (e) => showTip(e, `${grp.name} — ${kid.name}: ${val}`));
                innerCircle.addEventListener("mousemove", moveTip);
                innerCircle.addEventListener("mouseleave", hideTip);
                svg.appendChild(innerCircle);

                const kTxt = svgEl("text", {
                    x: kx, y: ky + 4,
                    "text-anchor": "middle", "font-size": "11",
                    "font-weight": "600", fill: "#ffffff"
                });
                kTxt.textContent = val;
                svg.appendChild(kTxt);
            });
        });

        container.appendChild(svg);
    }

    // Extra 3: Stacked Bar Chart (Small Multiple)
    function renderStackedSmallMultiples(panels) {
        const container = document.getElementById("chart-small-multiples");
        if (!container || !Array.isArray(panels) || panels.length === 0) return;

        const segments = [
            { key: "segA", label: "Core AI & Automation", color: "#002677" },
            { key: "segB", label: "Digital & Data Enablement", color: "#007C58" },
            { key: "segC", label: "Governance & Training", color: "#88b8a8" }
        ];

        const legend = document.createElement("div");
        legend.className = "chart-legend";
        segments.forEach((s) => {
            legend.innerHTML += `<span class="legend-item"><span class="legend-swatch" style="background:${s.color}"></span>${s.label}</span>`;
        });
        container.appendChild(legend);

        const panelW = 240;
        const gap = 20;
        const width = panels.length * panelW + (panels.length - 1) * gap;
        const height = 250;
        const margin = { top: 34, right: 16, bottom: 36, left: 38 };
        const plotH = height - margin.top - margin.bottom;

        const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}` });

        const allTotals = panels.flatMap((p) =>
            (p.bars || []).map((b) => segments.reduce((sum, s) => sum + (Number(b[s.key]) || 0), 0))
        );
        const maxTotal = Math.max(...allTotals, 100);

        panels.forEach((panel, pIdx) => {
            const ox = pIdx * (panelW + gap);

            const title = svgEl("text", {
                x: ox + panelW / 2,
                y: 18,
                "text-anchor": "middle",
                "font-size": "13",
                "font-weight": "700",
                fill: "#002677"
            });
            title.textContent = panel.panelTitle;
            svg.appendChild(title);

            [0, 50, 100].forEach((tick) => {
                if (tick > maxTotal) return;
                const y = margin.top + plotH - (tick / maxTotal) * plotH;
                svg.appendChild(svgEl("line", {
                    x1: ox + margin.left, y1: y,
                    x2: ox + panelW - margin.right, y2: y,
                    stroke: "#e2e8f0", "stroke-width": "1"
                }));
                if (pIdx === 0) {
                    const t = svgEl("text", {
                        x: ox + margin.left - 6, y: y + 4,
                        "text-anchor": "end", "font-size": "10.5", fill: "#555"
                    });
                    t.textContent = tick;
                    svg.appendChild(t);
                }
            });

            const bars = panel.bars || [];
            const innerW = panelW - margin.left - margin.right;
            const slotW = innerW / Math.max(bars.length, 1);
            const barW = Math.min(44, slotW * 0.55);

            bars.forEach((b, bIdx) => {
                const bx = ox + margin.left + bIdx * slotW + (slotW - barW) / 2;
                let curBottom = margin.top + plotH;

                segments.forEach((s) => {
                    const val = Number(b[s.key]) || 0;
                    const h = (val / maxTotal) * plotH;
                    curBottom -= h;

                    const rect = svgEl("rect", {
                        x: bx, y: curBottom,
                        width: barW, height: Math.max(h, 0),
                        fill: s.color, stroke: "#ffffff", "stroke-width": "1"
                    });
                    rect.addEventListener("mouseenter", (e) => showTip(e, `${panel.panelTitle} (${b.label}) — ${s.label}: ${val}`));
                    rect.addEventListener("mousemove", moveTip);
                    rect.addEventListener("mouseleave", hideTip);
                    svg.appendChild(rect);
                });

                const bLbl = svgEl("text", {
                    x: bx + barW / 2,
                    y: height - 12,
                    "text-anchor": "middle",
                    "font-size": "11.5",
                    fill: "#2b2b2b"
                });
                bLbl.textContent = b.label;
                svg.appendChild(bLbl);
            });
        });

        container.appendChild(svg);
    }

    // Extra 4: Pie Chart
    function renderPieChart(items) {
        const container = document.getElementById("chart-pie");
        if (!container || !Array.isArray(items) || items.length === 0) return;

        const colors = ["#007C58", "#002677", "#2b6cb0", "#68a691", "#4a5568"];
        const total = items.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 1;

        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.flexWrap = "wrap";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "1.8rem";

        const size = 280;
        const r = 115;
        const cx = size / 2;
        const cy = size / 2;
        const svg = svgEl("svg", {
            viewBox: `0 0 ${size} ${size}`,
            style: "max-width: 280px; flex: 0 0 auto;"
        });

        let startAngle = -Math.PI / 2;

        items.forEach((d, idx) => {
            const val = Number(d.value) || 0;
            const sliceAngle = (val / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const largeArc = sliceAngle > Math.PI ? 1 : 0;

            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);

            const pathData = [
                `M ${cx} ${cy}`,
                `L ${x1} ${y1}`,
                `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                "Z"
            ].join(" ");

            const pct = Math.round((val / total) * 100);
            const slice = svgEl("path", {
                d: pathData,
                fill: colors[idx % colors.length],
                stroke: "#ffffff",
                "stroke-width": "2"
            });
            slice.addEventListener("mouseenter", (e) => showTip(e, `${d.label}: ${val} (${pct}%)`));
            slice.addEventListener("mousemove", moveTip);
            slice.addEventListener("mouseleave", hideTip);
            svg.appendChild(slice);

            startAngle = endAngle;
        });

        const legendList = document.createElement("div");
        legendList.style.display = "flex";
        legendList.style.flexDirection = "column";
        legendList.style.gap = "0.55rem";
        legendList.style.fontSize = "0.9rem";

        items.forEach((d, idx) => {
            const val = Number(d.value) || 0;
            const pct = Math.round((val / total) * 100);
            legendList.innerHTML += `
                <span class="legend-item">
                    <span class="legend-swatch" style="background:${colors[idx % colors.length]}"></span>
                    <span><strong>${d.label}</strong>: ${val} (${pct}%)</span>
                </span>
            `;
        });

        wrapper.appendChild(svg);
        wrapper.appendChild(legendList);
        container.appendChild(wrapper);
    }
});
