# Data Alchemist

A robust data validation and editing experience for CSV/XLSX files with real-time validation, error highlighting, and comprehensive data quality checks.

## Features

- **File Upload & Parsing**: Support for CSV and XLSX files (clients, workers, tasks)
- **Session Management**: Persistent file-based sessions that survive development hot reloads
- **Interactive Data Tables**: Inline editing with auto-save functionality
- **Comprehensive Validation**: 6 core validation categories with real-time error detection
- **Visual Feedback**: Error highlighting, tooltips, and validation summary panel
- **Health Scoring**: Data quality metrics with visual progress indicators
- **🤖 AI-Powered Search**: Natural language queries with Google AI (Gemini) integration
- **🔧 AI Error Correction**: Intelligent fix suggestions and batch error correction
- **📋 Smart Rule Builder**: Create project rules with forms or natural language
- **Smart Filtering**: Real-time data filtering based on AI-generated filters
- **Intelligent Suggestions**: Context-aware search suggestions for better data exploration

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Google AI (optional for AI search):**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GOOGLE_API_KEY
   # Get your API key from: https://aistudio.google.com/app/apikey
   ```

3. **Test the setup (optional):**
   ```bash
   pnpm test:ai
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open the application:**
   - Main app: [http://localhost:3000](http://localhost:3000)

5. **Upload sample data:**
   - Use the provided sample files in `/sample-data/`
   - Upload `clients.csv`, `workers.csv`, and `tasks.csv`

## Architecture

### 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── upload/        # File upload endpoint
│   │   └── session/       # Session management
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Main upload page
├── components/
│   ├── data/             # Data-related components
│   │   ├── DataTable.tsx # Interactive data grid
│   │   ├── ValidationPanel.tsx # Validation summary
│   │   └── FileUpload.tsx # File upload interface
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI primitives
├── lib/
│   ├── data/             # Data parsing & utilities
│   ├── storage/          # Session & data persistence
│   ├── ai/               # Google AI integration
│   │   ├── google-ai-service.ts # Gemini API service
│   │   └── data-filter.ts # AI-powered filtering
│   ├── validators/       # Modular validation engine
│   │   ├── duplicate.ts  # Duplicate ID detection
│   │   ├── required.ts   # Required field validation
│   │   ├── references.ts # Foreign key integrity
│   │   ├── skills.ts     # Skill coverage analysis
│   │   ├── datatype.ts   # Data type validation
│   │   └── business.ts   # Business logic rules
│   └── index.ts          # Clean export interface
└── tests/                # Test files (moved from root)
```

### 🔧 Modular Validation Engine

The validation system is split into focused modules:

1. **Duplicate Detection** (`validators/duplicate.ts`)
   - Identifies duplicate IDs across all datasets
   - Configurable ID columns per data type

2. **Required Fields** (`validators/required.ts`)
   - Validates mandatory field completion
   - Customizable required field sets

3. **Reference Integrity** (`validators/references.ts`)
   - Checks foreign key relationships (Task → Client)
   - Validates cross-table data consistency

4. **Skill Coverage** (`validators/skills.ts`)
   - Analyzes task skill requirements vs worker capabilities
   - Identifies skill gaps and over-qualifications

5. **Data Types** (`validators/datatype.ts`)
   - Number format validation and range checks
   - Date format and business day validation
   - Enum value validation (priority levels)

6. **Business Logic** (`validators/business.ts`)
   - High-priority clients without tasks
   - Worker capacity vs task duration analysis
   - Priority distribution validation

### � AI-Powered Error Correction

Intelligent, context-aware error fixing powered by Google AI (Gemini):

#### **Smart Fix Suggestions**
- **Context Analysis** - AI examines data patterns, column types, and business rules
- **Confidence Scoring** - Each suggestion rated as high, medium, or low confidence  
- **Alternative Options** - Multiple fix options provided for complex cases
- **Rule-based Fallbacks** - Sensible defaults when AI is unavailable

#### **Individual Error Fixes**
- **Magic Wand Button** - Click on any validation error to get AI suggestions
- **Real-time Suggestions** - Instant analysis of error context and data patterns
- **Preview & Apply** - Review suggestions before applying changes
- **Manual Override** - Choose from alternative suggestions or edit manually

#### **Batch Error Correction**
- **Smart Batching** - Automatically groups similar fixable errors
- **Bulk Apply** - Fix multiple missing required fields or data type issues at once
- **Progress Tracking** - Real-time feedback on batch operation status
- **Selective Processing** - Only processes high-confidence, automatable fixes

#### **Supported Error Types**
- **Missing Required Fields** - AI suggests appropriate default values
- **Data Type Mismatches** - Convert values to expected formats (dates, numbers, emails)
- **Duplicate IDs** - Generate unique identifiers with contextual suffixes
- **Invalid References** - Suggest valid foreign key values from related data
- **Business Rule Violations** - Apply domain-specific corrections

### 📋 Smart Rule Builder

Create and manage project workflow rules with both form-based and AI-powered natural language interfaces:

#### **Rule Types Supported**
1. **Co-Run Rules** - Tasks that must execute together
   - Link dependent workflows and task sequences
   - Ensure coordinated execution of related activities
   - Visual task selection with multi-select interface

2. **Load Limit Rules** - Maximum task capacity per worker
   - Prevent worker overallocation and burnout
   - Balance workloads across team members
   - Set individual capacity constraints

3. **Phase Window Rules** - Time boundaries for project phases
   - Define start and end dates for project phases
   - Organize timeline and milestone management
   - Schedule time-sensitive activities

#### **Creation Methods**

**Form-Based Builder:**
- **Visual task selection** - Click to select tasks for co-run rules
- **Worker dropdown** - Choose from available team members
- **Date pickers** - Set precise phase windows
- **Instant validation** - Real-time feedback on rule configuration

**Natural Language AI:**
- **Plain English input** - "Tasks A and B must run together"
- **Context awareness** - AI understands your available tasks and workers
- **Smart parsing** - Converts descriptions to structured rules
- **Multiple formats** - Supports various ways of expressing the same rule

#### **Rule Management**
- **Active rules display** - Visual list of all configured rules
- **Rule status tracking** - Active, inactive, and error states
- **One-click deletion** - Easy rule removal and cleanup
- **Persistent storage** - Rules saved with session data

**Example Natural Language Rules:**
```
"Task Design and Development must run together"
"John can work on maximum 5 tasks"
"Phase 1 runs from January to March 2025"
"Setup and Testing should be paired"
"Sarah's workload limit is 3 tasks"
```

### 🤖 AI-Powered Search & Filtering

Google AI (Gemini) integration provides intelligent data exploration:

1. **Natural Language Queries**
   - "Show high priority clients"
   - "Find workers with JavaScript skills"
   - "Tasks due this week"

2. **Smart Filter Generation**
   - AI converts natural language to structured filters
   - Supports complex conditions and operators
   - Real-time application to data tables

3. **Intelligent Suggestions**
   - Context-aware query suggestions
   - Based on your actual data structure
   - Adapts to available fields and values

4. **Result Explanations**
   - AI explains search results in plain English
   - Helps users understand what was found
   - Improves data exploration experience

**Example Usage:**
```typescript
// Natural language search
"Find clients with high priority and no tasks"

// Generated filter
{
  "dataType": "clients",
  "conditions": [
    {"field": "priority", "operator": "equals", "value": "high"},
    {"field": "tasksCount", "operator": "equals", "value": 0}
  ]
}
```

### 🗄️ Session Storage
- **Development**: File-based storage in `/uploads/` directory
- **Production**: Designed for Redis/Vercel KV integration
- **Persistence**: Sessions survive hot reloads and server restarts

### Validation Engine
The system includes 6 comprehensive validation categories:
1. **Duplicate Detection**: Identifies duplicate IDs across datasets
2. **Required Fields**: Validates mandatory field completion
3. **Reference Integrity**: Checks cross-table references (e.g., TaskID → ClientID)
4. **Skill Coverage**: Analyzes task requirements vs. worker capabilities
5. **Data Types**: Validates number formats, ranges, and data types
6. **Business Logic**: Custom rules like deadline validation and priority checks

### API Endpoints

#### Core Endpoints
- `POST /api/upload` - File upload and parsing
- `GET /api/session/[id]` - Session data retrieval
- `PUT /api/session/[id]/update` - Session data updates

#### AI Endpoints
- `POST /api/ai` - AI-powered search and filtering
  - Action: `search` - Convert natural language to data filters
  - Action: `suggestions` - Get AI-generated search suggestions
- `POST /api/ai/suggest-fix` - AI-powered error correction suggestions
  - Generate context-aware fixes for validation errors
  - Returns suggestions with confidence levels and alternatives
- `POST /api/ai/apply-fix` - Apply AI-suggested fixes to data
  - Apply individual fixes or batch corrections
  - Supports selective application with validation
- `POST /api/ai/create-rule` - AI-powered rule creation
  - Convert natural language descriptions to structured rules
  - Supports co-run, load-limit, and phase-window rule types

#### Rule Management Endpoints
- `GET /api/session/[id]/rules` - Retrieve session rules
- `POST /api/session/[id]/rules` - Create new rule
- `DELETE /api/session/[id]/rules` - Delete existing rule

### Available PNPM Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run comprehensive tests
- `pnpm test:ai` - Test Google AI integration
- `pnpm clean` - Clean build artifacts

## Troubleshooting

### Session Not Found Errors
If you encounter 404 session errors:
1. Sessions are stored in `/uploads/session_[timestamp]_[id]/`
2. Try uploading files again to create a new session

### Development Hot Reload Issues
- Sessions are persistent across hot reloads
- Check console logs for session creation/retrieval debugging

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
