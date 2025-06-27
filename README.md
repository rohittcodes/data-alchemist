# Data Alchemist

A robust data validation and editing experience for CSV/XLSX files with real-time validation, error highlighting, and comprehensive data quality checks.

## Features

- **File Upload & Parsing**: Support for CSV and XLSX files (clients, workers, tasks)
- **Session Management**: Persistent file-based sessions that survive development hot reloads
- **Interactive Data Tables**: Inline editing with auto-save functionality
- **Comprehensive Validation**: 6 core validation categories with real-time error detection
- **Visual Feedback**: Error highlighting, tooltips, and validation summary panel
- **Health Scoring**: Data quality metrics with visual progress indicators

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open the application:**
   - Main app: [http://localhost:3000](http://localhost:3000)

4. **Upload sample data:**
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
- `POST /api/upload` - File upload and parsing
- `GET /api/session/[id]` - Session data retrieval
- `PUT /api/session/[id]/update` - Session data updates

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
