# Development Guide

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── ai/           # AI-powered features (search, auto-fix)
│   │   ├── export/       # Data export functionality
│   │   ├── session/      # Session management
│   │   └── upload/       # File upload handling
│   ├── dashboard/        # Dashboard pages
│   │   ├── data/         # Data editor page
│   │   ├── export/       # Export page
│   │   └── rules/        # Rules management
│   └── page.tsx          # Home/upload page
├── components/           # React components
│   ├── data/            # Data-specific components
│   │   ├── AISearch.tsx          # Natural language search
│   │   ├── AutoFixSection.tsx    # Batch auto-fix UI
│   │   ├── CriticalIssues.tsx    # Critical error display
│   │   ├── DataTable.tsx         # Editable data grid
│   │   ├── ErrorCategories.tsx   # Error categorization
│   │   ├── FileUpload.tsx        # File upload component
│   │   ├── HealthScore.tsx       # Data quality metrics
│   │   ├── RuleBuilder.tsx       # Rule creation interface
│   │   ├── ValidationPanel.tsx   # Main validation interface
│   │   └── ValidationErrorItem.tsx # Individual error display
│   ├── global/          # Global components
│   ├── layout/          # Layout components
│   └── ui/              # UI primitives (shadcn/ui)
└── lib/                 # Core utilities
    ├── ai/              # AI services
    │   └── google-ai-service.ts  # Google AI integration
    ├── data/            # Data processing utilities
    │   └── parsers.ts           # CSV/file parsing logic
    ├── storage/         # Storage utilities
    │   └── kv-store.ts          # File-based storage
    ├── validators/      # Validation engine
    │   ├── auto-fix.ts          # Auto-fix logic
    │   ├── types.ts             # Validation types
    │   └── ...                  # Individual validators
    ├── types.ts         # Core TypeScript definitions
    └── utils.ts         # General utilities
```

## Key Components

### ValidationPanel
The main validation interface that orchestrates all validation-related components:
- **AutoFixSection**: Batch auto-fixing with progress feedback
- **ErrorCategories**: Categorizes errors by type and severity
- **CriticalIssues**: Highlights high-priority errors
- **HealthScore**: Shows overall data quality metrics

### Auto-Fix Engine
Located in `src/lib/validators/auto-fix.ts`:
- **canAutoFix()**: Determines if an error can be automatically fixed
- **autoFixError()**: Applies fixes to individual errors
- **applyAutoFixes()**: Batch processing for multiple errors

#### Auto-Fix Logic:
✅ **Auto-fixable:**
- Past deadline warnings → Updated to future dates
- Number format errors → Parsed numeric values
- Missing required fields → Sensible defaults
- Boolean text → Standardized true/false

❌ **Manual review required:**
- Schedule format conversions (e.g., "Mon-Fri 9-5" → percentage)
- Duration warnings (business decisions)
- Complex business logic violations

### AI Integration
Google AI (Gemini) powers several features:
- **Natural Language Search**: Query data using plain English
- **Intelligent Filtering**: Context-aware column mapping
- **Auto-Fix Suggestions**: AI-powered error correction

## Development Workflow

### 1. Setting Up
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your GOOGLE_AI_API_KEY

# Start development server
npm run dev
```

### 2. Adding New Validators
Create new validators in `src/lib/validators/`:
```typescript
export function validateCustomField(value: any, field: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Add validation logic
  if (/* condition */) {
    errors.push({
      type: 'error',
      category: 'custom',
      severity: 'medium',
      message: 'Custom validation failed',
      // ... other properties
    })
  }
  
  return errors
}
```

### 3. Adding Auto-Fix Rules
Extend the auto-fix engine in `src/lib/validators/auto-fix.ts`:
```typescript
// In canAutoFix function
if (error.category === 'custom' && /* conditions */) {
  console.log('canAutoFix: custom error - FIXABLE')
  return true
}

// In autoFixError function
if (error.category === 'custom') {
  return fixCustomError(error, rowData, currentValue)
}
```

### 4. Testing
```bash
# Build and check for errors
npm run build

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Common Development Tasks

### Adding New Data Types
1. Update `src/lib/types.ts` with new interfaces
2. Add parsers in `src/lib/data/parsers.ts`
3. Create validators in `src/lib/validators/`
4. Update UI components to handle new data type

### Extending AI Features
1. Modify `src/lib/ai/google-ai-service.ts`
2. Add new API endpoints in `src/app/api/ai/`
3. Update frontend components to use new AI features

### UI Improvements
1. Modify components in `src/components/`
2. Use existing shadcn/ui components when possible
3. Follow the established design patterns

## Code Standards

- **TypeScript**: Strict type checking, avoid `any`
- **Components**: Functional components with proper props interfaces
- **Error Handling**: Comprehensive error boundaries and logging
- **State Management**: React hooks and context where appropriate
- **API Design**: RESTful endpoints with proper status codes

## Architecture Decisions

### Why File-Based Storage?
- Simple development setup
- No database dependencies
- Easy debugging and data inspection
- Sufficient for MVP/demo purposes

### Why Google AI?
- Excellent natural language understanding
- Good integration with JavaScript/TypeScript
- Reliable API with reasonable pricing

### Why Next.js App Router?
- Modern React patterns
- Built-in API routes
- Excellent TypeScript support
- Great development experience

## Performance Considerations

- **Large CSV Files**: Implement streaming for files > 10MB
- **Validation**: Debounced validation for real-time editing
- **AI Calls**: Rate limiting and caching for API calls
- **Memory**: Clean up session data periodically

## Deployment

### Environment Variables
```bash
GOOGLE_AI_API_KEY=your_api_key_here
NODE_ENV=production
```

### Build Process
```bash
npm run build
npm start
```

### Vercel Deployment
The project is optimized for Vercel deployment with minimal configuration needed.
