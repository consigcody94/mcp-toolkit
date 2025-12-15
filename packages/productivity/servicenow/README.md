# 🎨 ServiceNow Dashboard Generator

> AI-powered ServiceNow dashboard and widget generator with natural language support

**🎯 [Try Live Demo](https://consigcody94.github.io/servicenow-dashboard-generator/)** | [GitHub](https://github.com/consigcody94/servicenow-dashboard-generator)

Generate beautiful, production-ready ServiceNow dashboards and widgets through an interactive question system or natural language commands via Claude Desktop. No manual coding required!

## ✨ Features

### 🎯 Interactive Dashboard Creation
- **Guided Question System** - Answer intuitive questions to build your dashboard
- **5 Configuration Flows** - Basic info, layout, widgets, theme, and advanced settings
- **Smart Defaults** - Intelligent default values based on ServiceNow best practices
- **Conditional Questions** - Only see relevant questions based on your answers

### 🔥 Amazing Table Generation
- **4 Beautiful Styles** - List, Grid, Card, and Compact layouts
- **Smart Column Detection** - Automatically infers field types and formatting
- **Color-Coded Values** - Priority, state, and status fields get beautiful badges
- **Advanced Features**:
  - ✅ Sortable columns with smooth animations
  - ✅ Filterable data with instant search
  - ✅ Advanced pagination with page size control
  - ✅ Export to CSV functionality
  - ✅ Sticky headers for long tables
  - ✅ Responsive design for all devices
  - ✅ Hover effects with subtle elevation
  - ✅ Print-friendly views

### 🎨 Widget Types Supported
- **Table** - Advanced data tables with sorting, filtering, pagination
- **List** - Simple record lists with customizable fields
- **Chart** - Visual data representations (bar, line, pie, donut, area, scatter, heatmap)
- **Gauge** - Single metric displays with thresholds and colors
- **Stat** - KPI cards with trends and comparisons
- **Timeline** - Chronological event displays

### 🤖 MCP Integration
- **Natural Language Generation** - Create dashboards with simple descriptions
- **8 Powerful MCP Tools** - Full control through Claude Desktop
- **Markdown Responses** - Beautiful, formatted output with examples
- **Guided Workflows** - Step-by-step dashboard creation

### 🎨 Theme Customization
- **Custom Colors** - Primary, background, header, text, and border colors
- **Card Shadows** - Optional elevation effects
- **Responsive Layouts** - Automatically adapt to screen size
- **Brand Consistency** - Apply your organization's design system

### 📦 Pre-Built Templates
- **Incident Management Dashboard** - Track and manage incidents with priority views
- **Change Management Dashboard** - Monitor change requests with risk assessment
- **Custom Templates** - Easy to create and share

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/consigcody94/servicenow-dashboard-generator.git
cd servicenow-dashboard-generator

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage with Claude Desktop (Recommended)

1. Install Claude Desktop
2. Configure the MCP server (see [MCP_SETUP.md](./MCP_SETUP.md))
3. Talk to Claude naturally:

```
"Create a dashboard for tracking incidents with priority, state, and assignment"
```

Claude will guide you through the process and generate complete ServiceNow code!

### Programmatic Usage

```typescript
import { QuestionEngine, WidgetGenerator } from 'servicenow-dashboard-generator';

// Create question engine
const engine = new QuestionEngine();

// Answer questions
engine.recordAnswer('dashboard_name', 'my_dashboard');
engine.recordAnswer('dashboard_title', 'My Dashboard');
engine.recordAnswer('widget_count', 1);

// Build configuration
const config = engine.buildDashboardConfig();

// Generate code
const generator = new WidgetGenerator();
const code = generator.generateWidget(config);

console.log(code.xml);        // ServiceNow Widget XML
console.log(code.clientScript); // Client-side JavaScript
console.log(code.serverScript); // Server-side JavaScript
console.log(code.css);         // CSS Styling
```

## 🎯 MCP Tools

### 1. `create_dashboard`
Guided dashboard creation with all question flows.

```json
{
  "name": "create_dashboard",
  "arguments": {
    "answers": {
      "dashboard_name": "incident_tracker"
    }
  }
}
```

### 2. `generate_table`
Create an amazing table widget with advanced features.

```json
{
  "name": "generate_table",
  "arguments": {
    "title": "Active Incidents",
    "table": "incident",
    "fields": ["number", "short_description", "priority", "state", "assigned_to"],
    "sortable": true,
    "filterable": true,
    "style": "list"
  }
}
```

### 3. `quick_dashboard`
Fast dashboard creation with natural language.

```json
{
  "name": "quick_dashboard",
  "arguments": {
    "description": "Show all active incidents sorted by priority",
    "table": "incident",
    "fields": ["number", "short_description", "priority", "state"]
  }
}
```

### 4. `get_questions`
View all available configuration questions.

### 5. `answer_questions`
Provide answers to dashboard questions.

### 6. `build_config`
Build dashboard configuration from answers.

### 7. `generate_code`
Generate ServiceNow code from configuration.

### 8. `generate_widget`
Create a single widget with specific configuration.

## 📋 Question Flows

### Basic Information
- Dashboard technical name (lowercase, no spaces)
- Dashboard display title
- Description (optional)
- Dashboard type (homepage, performance, service, custom)

### Layout Configuration
- Number of columns (1-12)
- Responsive layout (yes/no)

### Widget Configuration
- Number of widgets
- Per widget:
  - Type (list, table, chart, gauge, stat, timeline)
  - Title
  - Source table
  - Fields to display
  - Filter conditions
  - Maximum records
  - Width in columns
  - Sortable/filterable options

### Theme & Styling
- Enable custom theme (yes/no)
- Primary color (hex)
- Background color (hex)
- Card shadow (yes/no)

### Advanced Settings
- Auto-refresh interval (seconds)
- Enable data export (yes/no)
- Enable print view (yes/no)

## 🎨 Generated Code

The generator produces **production-ready** ServiceNow code:

### Widget XML
Complete widget definition with:
- Template structure
- Option schema
- Metadata and category
- Public/private settings

### Client Script (JavaScript)
AngularJS controller with:
- Data loading and refresh
- Table sorting and filtering
- Pagination controls
- Row click handlers
- CSV export functionality
- Badge styling logic
- Auto-refresh support

### Server Script (GlideAjax)
GlideRecord queries with:
- Optimized data fetching
- Filter application
- Sorting and limits
- Field selection
- Aggregation support

### CSS Stylesheet
Beautiful styling with:
- Responsive design
- Gradient headers
- Hover effects with elevation
- Badge and label styles
- Table animations
- Print-friendly views
- Mobile optimization

## 🎯 Table Features

### Intelligent Column Configuration

The table generator automatically:
- **Detects field types** from ServiceNow field names
- **Infers renderers** (badge, link, icon, progress)
- **Applies smart alignment** (numbers right, text left)
- **Generates labels** from field names
- **Adds color coding** for priority, state, urgency, impact, severity

### Example Table Styles

#### List Style
Traditional striped table with hover effects:
```typescript
style: 'list',
striped: true,
bordered: true,
hover: true
```

#### Grid Style
Bordered cells with individual cell highlighting:
```typescript
style: 'grid',
bordered: true,
hover: true
```

#### Card Style
Responsive card layout for mobile:
```typescript
style: 'card',
hover: true
```

#### Compact Style
Dense table for maximum data density:
```typescript
style: 'compact',
striped: true
```

### Advanced Pagination

- **Page Size Selector** - 10, 25, 50, 100 rows
- **Full Navigation** - First, Previous, Next, Last buttons
- **Page Numbers** - Click to jump to specific page
- **Jump to Page** - Direct input for large datasets
- **Record Count** - Shows "X to Y of Z records"

### Color Coding

Automatic color coding for ServiceNow fields:

| Field | Values | Colors |
|-------|--------|--------|
| Priority | 1-5 | Critical (red) → Planning (gray) |
| State | 1-8 | New (blue) → Closed (gray) |
| Urgency/Impact | 1-3 | High (red) → Low (green) |
| Severity | 1-4 | Critical (red) → Minor (blue) |

## 📦 Example Templates

### Incident Management Dashboard

```typescript
import { incidentDashboardTemplate } from './templates/incident-dashboard';

// Use the template
const config = incidentDashboardTemplate.config;
const code = generator.generateWidget(config);
```

Features:
- Critical incidents table
- All active incidents table
- Active incident count stat
- Resolved today count stat
- Average resolution time stat
- Auto-refresh every 60 seconds

### Change Management Dashboard

```typescript
import { changeDashboardTemplate } from './templates/change-dashboard';

// Use the template
const config = changeDashboardTemplate.config;
const code = generator.generateWidget(config);
```

Features:
- Pending changes table
- Risk assessment with color coding
- Approval status tracking
- Active change count stat
- Auto-refresh every 120 seconds

## 🛠️ Development

### Prerequisites
- Node.js 16+ and npm
- TypeScript 5.3+
- ServiceNow instance (for testing generated code)

### Build

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode for development
npm run typecheck    # Type checking only
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── generators/
│   ├── widget-generator.ts    # Main widget code generator
│   └── table-generator.ts     # Advanced table generator
├── questions/
│   └── question-engine.ts     # Interactive question system
├── templates/
│   ├── incident-dashboard.ts  # Incident management template
│   └── change-dashboard.ts    # Change management template
├── types.ts                   # Comprehensive type system
├── mcp-server.ts              # MCP server implementation
└── index.ts                   # Public API exports
```

## 🎯 Use Cases

### IT Service Management
- Incident tracking dashboards
- Problem management views
- Change request monitoring
- Service catalog analytics

### Performance Analytics
- KPI dashboards with metrics
- Trend analysis views
- SLA compliance tracking
- Team performance monitoring

### Custom Solutions
- Department-specific dashboards
- Project tracking views
- Asset management displays
- Custom workflow monitoring

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Ensure `npm run typecheck` and `npm run lint` pass
5. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
6. Push to your branch
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- ServiceNow platform and best practices
- Model Context Protocol (MCP) specification
- Claude Desktop for natural language interaction
- Open source community for inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/consigcody94/servicenow-dashboard-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/consigcody94/servicenow-dashboard-generator/discussions)
- **Documentation**: [MCP Setup Guide](./MCP_SETUP.md)

---

**Built with ❤️ for the ServiceNow community**

Generate amazing dashboards in seconds, not hours! 🚀
