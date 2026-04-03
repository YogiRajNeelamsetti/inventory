# 🐛 BUGS & IMPROVEMENTS

---

## Bug 1 — ML Trends: Bars Not Rendering Correctly

**Location:** ML Insights → Trends tab

**Problem:**
Progress bars are not scaled based on the magnitude of the percentage change.
Likely using raw value instead of `Math.abs()`, causing negative values to render incorrectly or all bars to appear the same length.

**Fix:**
```js
// ❌ Wrong
width: `${value}%`

// ✅ Correct - scale by absolute value relative to max
width: `${(Math.abs(value) / maxValue) * 100}%`
```

**UI Improvement:** Color-code bars by trend direction (green = RISING, orange = STABLE, red = FALLING) and make bar thickness more visible. Show both the direction badge and the magnitude clearly.

---

## Bug 2 — ML Section: APIs Not Called on Page Load

**Location:** ML Insights page (all tabs — Forecast, Recommendations, Trends)

**Problem:**
No data loads when the ML section is first opened. APIs are only triggered after the user manually selects a tab or interacts with the page.

**Fix:**
Call all three ML APIs on component mount using `useEffect`:

```js
useEffect(() => {
  fetchForecast();
  fetchRecommendations();
  fetchTrends();
}, []); // empty dependency array = runs once on mount
```

All tabs should show data immediately when the page is opened, not wait for user interaction.

---

## Feature — Transaction Page: Export Button Not Working

**Location:** Transactions page → Export button

**Problem:**
Export button exists in the UI but does not produce any file output.

**Proposed Implementation:**
Add export functionality to generate both Excel and CSV files from transaction data.

**Excel (.xlsx):**
```js
import * as XLSX from 'xlsx';

const exportExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "transactions.xlsx");
};
```

**CSV:**
```js
const exportCSV = (data) => {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
};
```

Install xlsx package if not already added:
```bash
npm install xlsx
```

---

## Summary

| # | Type | Location | Priority |
|---|------|----------|----------|
| 1 | Bug | ML Trends — bar magnitude | High |
| 2 | Bug | ML page — no default API call on load | High |
| 3 | Feature | Transactions — export to Excel/CSV | Medium |


## if you found any bugs, call me :(
