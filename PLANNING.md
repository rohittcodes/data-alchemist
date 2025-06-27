## **2-Day Build Strategy: MVP Focus**

You need to be **ruthlessly selective** to build this in 2 days. Here's how to prioritize:

---

## **Day 1: Core Data Pipeline (MVP)**

### **Hour 1-2: Project Setup**
```bash
npx create-next-app@latest data-alchemist --typescript --tailwind --app
cd data-alchemist
npm install papaparse xlsx @types/papaparse zustand lucide-react
npm install @tanstack/react-table react-hook-form @hookform/resolvers zod
```

### **Hour 3-6: Basic File Upload + Data Display**
**Focus**: Get files in, show them in a table
- Simple drag-and-drop upload component
- Parse CSV/XLSX files
- Display in basic data tables (one tab per entity)
- **Skip**: Advanced column mapping, just handle standard headers

### **Hour 7-8: Basic Validation Engine**
**Implement only 4-5 core validations**:
- Duplicate IDs
- Missing required fields
- Invalid data types
- Basic reference checking (RequestedTaskIDs exist)
- **Skip**: Complex circular dependency checks

---

## **Day 2: AI Integration + Polish**

### **Hour 1-3: AI Integration**
**Choose ONE AI provider** (OpenAI is easiest):
```bash
npm install openai
```

**Focus on 2 AI features**:
1. **Natural language data search** - convert queries to filters
2. **Basic error correction suggestions**
**Skip**: Complex rule generation, advanced AI validation

### **Hour 4-6: Rule Builder (Simplified)**
- Simple form-based rule creation (not drag-and-drop)
- Support 2-3 rule types: co-run, load-limit, phase-window
- Generate rules.json for export
- **Skip**: Visual rule builder, complex rule validation

### **Hour 7-8: Export + Deploy**
- Export functionality (clean CSV + rules.json)
- Quick deploy to Vercel
- **Skip**: Priority sliders, advanced export options

---

## **Minimal Tech Stack**

```typescript
// Keep it simple - don't over-engineer
Next.js 14 + TypeScript + Tailwind
Zustand (state management)
React Hook Form + Zod (forms/validation)
TanStack Table (data grid)
OpenAI API (AI features)
Papaparse + XLSX (file parsing)
```

---

## **2-Day Architecture**

### **File Structure**
```
src/
├── app/
│   ├── page.tsx (landing + upload)
│   ├── dashboard/
│   │   ├── page.tsx (main dashboard)
│   │   ├── data/page.tsx (data view)
│   │   ├── rules/page.tsx (rule builder)
│   │   └── export/page.tsx (export)
├── components/
│   ├── FileUpload.tsx
│   ├── DataTable.tsx
│   ├── ValidationPanel.tsx
│   ├── AISearch.tsx
│   └── RuleBuilder.tsx
├── lib/
│   ├── validation.ts
│   ├── ai-service.ts
│   ├── file-parser.ts
│   └── types.ts
└── store/
    └── data-store.ts
```

### **State Management (Simple)**
```typescript
// One central store with Zustand
interface DataStore {
  clients: Client[]
  workers: Worker[]
  tasks: Task[]
  validationErrors: ValidationError[]
  rules: Rule[]
  setClients: (clients: Client[]) => void
  // ... other setters
}
```

---

## **Day-by-Day Breakdown**

### **Day 1 Schedule**
- **9-11 AM**: Project setup + basic upload UI
- **11-1 PM**: File parsing + data display
- **2-4 PM**: Basic validation engine
- **4-6 PM**: Validation UI + error highlighting
- **6-8 PM**: Inline editing + error fixing

### **Day 2 Schedule**
- **9-11 AM**: OpenAI integration + natural language search
- **11-1 PM**: AI error correction suggestions
- **2-4 PM**: Basic rule builder
- **4-6 PM**: Export functionality
- **6-8 PM**: Deploy + polish

---

## **What to Cut for Time**

### **Skip These Complex Features**:
- Advanced AI column mapping
- Complex circular dependency validation
- Visual drag-and-drop rule builder
- Priority sliders and weight configuration
- Advanced AI rule recommendations
- Complex UI animations
- Mobile responsiveness
- Comprehensive error handling

### **MVP Feature Set**:
✅ File upload (CSV/XLSX)
✅ Basic data display in tables
✅ 4-5 core validations
✅ Natural language data search
✅ AI error correction suggestions
✅ Simple rule creation
✅ Export clean data + rules.json

---

## **Quick Win AI Implementation**

### **Natural Language Search** (2 hours):
```typescript
// Simple approach - convert NL to filter objects
const searchWithAI = async (query: string, data: any[]) => {
  const prompt = `Convert this search to a filter object: "${query}"
  Available fields: ${Object.keys(data[0]).join(', ')}
  Return JSON only.`
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### **Error Correction** (2 hours):
```typescript
// AI suggests fixes for validation errors
const suggestFix = async (error: ValidationError, context: any) => {
  const prompt = `Fix this data error: ${error.message}
  Context: ${JSON.stringify(context)}
  Suggest a specific fix.`
  
  // Return structured fix suggestion
}
```

---

## **Deployment Strategy**

### **Quick Deploy**:
```bash
# Deploy to Vercel (5 minutes)
npm run build
npx vercel --prod
```

### **Environment Variables**:
```env
OPENAI_API_KEY=your_key_here
```

---

## **Success Metrics for 2 Days**

**Must Have**:
- ✅ Upload 3 CSV files
- ✅ Display data in tables
- ✅ Show validation errors
- ✅ Search with natural language
- ✅ Export clean files
- ✅ Deployed and working

**Nice to Have**:
- ✅ AI error suggestions
- ✅ Basic rule creation
- ✅ Inline editing

**Don't Stress About**:
- Perfect UI/UX
- Complex validations
- Advanced AI features
- Edge cases

---

## **Time-Saving Tips**

1. **Use shadcn/ui components** - don't build from scratch
2. **Copy-paste validation logic** - focus on AI features
3. **Mock complex features** - show UI without full backend
4. **Use sample data** - create small, clean test files
5. **Deploy early** - get it online by end of Day 1

**Remember**: This is about demonstrating **product thinking** and **AI integration skills**, not building a production system. Focus on the core user flow and impressive AI features rather than edge cases and polish.

The judges want to see you can:
- Understand complex requirements
- Integrate AI meaningfully
- Build a working prototype quickly
- Show good product judgment

You've got this! 🚀