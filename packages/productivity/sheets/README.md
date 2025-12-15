# 📊 Sheets Wizard

**AI-powered Google Sheets automation - create spreadsheets, read and write data, add formulas, create charts, and export to CSV**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://github.com/anthropics/mcp)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Compatible-34A853?logo=google-sheets)](https://sheets.google.com/)

---

## 🤔 The Spreadsheet Challenge

**"Manual spreadsheet work is tedious and repetitive"**

Creating reports, updating data, adding formulas - each task requires navigating through Google Sheets UI.

- 🖱️ Manually clicking through menus
- 📝 Writing formulas one cell at a time
- 📊 Creating charts with many clicks
- 📤 Exporting data manually

**Sheets Wizard brings Google Sheets to your conversation** - create, update, and analyze spreadsheets through natural language.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Spreadsheet Creation** | Create new Google Spreadsheets |
| 📖 **Data Reading** | Retrieve data from any range |
| ✏️ **Data Writing** | Update cells with values |
| 🔢 **Formula Support** | Add formulas to cells |
| 📊 **Chart Creation** | Create various chart types |
| 📤 **CSV Export** | Export sheets as CSV format |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Cloud account with Sheets API enabled
- OAuth 2.0 credentials
- Claude Desktop

### Installation

```bash
git clone https://github.com/consigcody94/sheets-wizard.git
cd sheets-wizard
npm install
npm run build
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search "Google Sheets API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI
   - Download the credentials JSON

### Getting OAuth Tokens

1. Use the OAuth 2.0 Playground or your own OAuth flow
2. Authorize with scope: `https://www.googleapis.com/auth/spreadsheets`
3. Exchange authorization code for tokens
4. Save `access_token` and `refresh_token`

### Configure Claude Desktop

Add to your config file:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "sheets-wizard": {
      "command": "node",
      "args": ["/absolute/path/to/sheets-wizard/dist/index.js"]
    }
  }
}
```

### Restart Claude Desktop
Completely quit and reopen Claude Desktop to load the MCP server.

---

## 💬 Usage Examples

### Create Spreadsheets
```
"Create a new spreadsheet for Q4 expenses"
→ Creates spreadsheet and returns ID and URL

"Make a new budget tracking sheet"
→ Creates empty spreadsheet ready for data
```

### Read and Write Data
```
"Get all data from the Sales sheet"
→ Returns 2D array of values from the range

"Update cells A1:B10 with the monthly totals"
→ Writes data to specified range
```

### Add Formulas
```
"Add a SUM formula for the revenue column"
→ Adds =SUM(B2:B100) to calculate totals

"Create an AVERAGE formula for column C"
→ Adds formula to calculate averages
```

### Create Charts
```
"Create a bar chart from the sales data"
→ Creates COLUMN chart from specified range

"Add a pie chart showing the budget breakdown"
→ Creates PIE chart visualization
```

### Export Data
```
"Export the report sheet as CSV"
→ Returns CSV content for download/processing
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `create_sheet` | Create a new Google Spreadsheet |
| `get_data` | Retrieve data from a spreadsheet range |
| `update_cells` | Update cells in a spreadsheet range |
| `add_formula` | Add a formula to a cell or range |
| `create_chart` | Create a chart in the spreadsheet |
| `export_csv` | Export a sheet as CSV format |

---

## 📊 Tool Details

### create_sheet

Create a new Google Spreadsheet.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Spreadsheet title |
| `credentials` | string | Yes | JSON string of OAuth credentials |

**Response includes:**
- Spreadsheet ID (for future operations)
- Spreadsheet URL (direct link)
- Title confirmation

### get_data

Retrieve data from a spreadsheet range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID |
| `range` | string | Yes | A1 notation range |
| `credentials` | string | Yes | OAuth credentials |

**A1 Notation examples:**
- `Sheet1!A1:D10` - Specific range on Sheet1
- `Sheet1!A:D` - Columns A through D
- `Sheet1!1:10` - Rows 1 through 10
- `A1:D10` - Range on first sheet

### update_cells

Update cells in a spreadsheet range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID |
| `range` | string | Yes | A1 notation range |
| `values` | string[][] | Yes | 2D array of values |
| `credentials` | string | Yes | OAuth credentials |

### add_formula

Add a formula to a cell or range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID |
| `range` | string | Yes | Target cell (A1 notation) |
| `formula` | string | Yes | Formula (include `=`) |
| `credentials` | string | Yes | OAuth credentials |

**Common formulas:**
- `=SUM(A1:A10)` - Sum of range
- `=AVERAGE(B1:B10)` - Average
- `=COUNT(C1:C10)` - Count numbers
- `=IF(A1>100,"High","Low")` - Conditional
- `=VLOOKUP(A1,B:C,2,FALSE)` - Lookup

### create_chart

Create a chart in the spreadsheet.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID |
| `sheetId` | number | Yes | Sheet ID (usually 0 for first) |
| `chartType` | string | Yes | Chart type |
| `sourceRange` | string | Yes | Data range for chart |
| `credentials` | string | Yes | OAuth credentials |

**Chart types:**
- `COLUMN` - Vertical bar chart
- `BAR` - Horizontal bar chart
- `LINE` - Line chart
- `PIE` - Pie chart
- `AREA` - Area chart
- `SCATTER` - Scatter plot

### export_csv

Export a sheet as CSV format.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID |
| `sheetId` | number | Yes | Sheet ID to export |
| `credentials` | string | Yes | OAuth credentials |

---

## 🔑 Finding IDs

### Spreadsheet ID
From URL: `https://docs.google.com/spreadsheets/d/1abc123def456/edit`

The ID is: `1abc123def456`

### Sheet ID
- First sheet is usually `0`
- Check sheet properties in Sheets UI
- Or use API to list sheets

---

## 🎯 Workflow Examples

### Creating a Report

1. **Create spreadsheet:**
   ```
   create_sheet with title: "Monthly Report - January 2024", credentials: "..."
   ```

2. **Add headers:**
   ```
   update_cells with range: "A1:D1", values: [["Date", "Revenue", "Expenses", "Profit"]], ...
   ```

3. **Add data:**
   ```
   update_cells with range: "A2:C10", values: [...data...], ...
   ```

4. **Add formulas:**
   ```
   add_formula with range: "D2", formula: "=B2-C2", ...
   ```

5. **Create chart:**
   ```
   create_chart with chartType: "LINE", sourceRange: "A1:B10", ...
   ```

### Data Analysis

1. **Read existing data:**
   ```
   get_data with range: "Sheet1!A:D", ...
   ```

2. **Add summary formulas:**
   ```
   add_formula with range: "E1", formula: "=SUM(B:B)", ...
   add_formula with range: "E2", formula: "=AVERAGE(B:B)", ...
   ```

3. **Export for analysis:**
   ```
   export_csv with sheetId: 0, ...
   ```

---

## ⚡ API Quotas

| Quota | Limit |
|-------|-------|
| Read requests | 300/minute per project |
| Write requests | 300/minute per project |
| Per-user limit | 60/minute |

**If you hit limits:**
- Wait 60 seconds
- Batch multiple updates into single requests
- Use larger ranges instead of cell-by-cell

---

## 🔒 Security Notes

| Principle | Description |
|-----------|-------------|
| Never commit credentials | Keep tokens out of version control |
| Tokens expire | Access tokens expire (~1 hour) |
| Store securely | Refresh tokens should be stored securely |
| Minimum scopes | Use only required OAuth scopes |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Verify OAuth credentials format, check token expiry |
| "Spreadsheet not found" | Verify spreadsheet ID, check access permissions |
| "Range not found" | Verify sheet name (case-sensitive), check A1 notation |
| Token refresh issues | Include refresh_token, verify client_id and client_secret |

---

## 📋 Requirements

- Node.js 18 or higher
- Google Cloud account
- Sheets API enabled
- OAuth 2.0 credentials with valid tokens

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👤 Author

**consigcody94**

---

<p align="center">
  <i>Spreadsheet magic at your command.</i>
</p>
