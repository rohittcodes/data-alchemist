# API Documentation

## Overview

Data Alchemist provides a RESTful API for data upload, validation, AI processing, and export functionality.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required for local development.

---

## Upload & Session Management

### POST /api/upload
Upload and parse CSV files to create a new session.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "clients=@clients.csv" \
  -F "workers=@workers.csv" \
  -F "tasks=@tasks.csv"
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_1234567890_abcdef",
  "data": {
    "clients": { "rowCount": 10, "headers": [...] },
    "workers": { "rowCount": 15, "headers": [...] },
    "tasks": { "rowCount": 25, "headers": [...] }
  }
}
```

### GET /api/session/[sessionId]
Retrieve session data and metadata.

**Parameters:**
- `includeData=true` - Include actual row data in response

**Response:**
```json
{
  "sessionId": "session_1234567890_abcdef",
  "status": "uploaded",
  "created": 1234567890,
  "lastModified": 1234567890,
  "clients": {
    "headers": ["clientId", "name", "requirements"],
    "rows": [...],
    "rowCount": 10
  }
}
```

### POST /api/session/[sessionId]/update
Update specific cell data in a session.

**Request:**
```json
{
  "type": "clients",
  "rowIndex": 0,
  "columnId": "name",
  "value": "Updated Name"
}
```

---

## AI Features

### POST /api/ai/search
Natural language search and filtering.

**Request:**
```json
{
  "sessionId": "session_1234567890_abcdef",
  "query": "Show me all React developers available this week",
  "context": {
    "dataTypes": ["workers", "tasks"],
    "includeMetadata": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": "React developers available this week",
  "filteredData": {
    "workers": [
      {
        "workerId": "WRK001",
        "name": "John Doe",
        "skills": "React|TypeScript|Node.js",
        "availability": "90"
      }
    ]
  },
  "explanation": "Found 5 workers with React skills and high availability",
  "appliedFilters": [
    {
      "field": "skills",
      "operation": "contains",
      "value": "React"
    },
    {
      "field": "availability",
      "operation": "gte",
      "value": 80
    }
  ]
}
```

### POST /api/ai/auto-fix
Batch auto-fix validation errors.

**Request:**
```json
{
  "sessionId": "session_1234567890_abcdef",
  "errors": [
    {
      "category": "datatype",
      "severity": "medium",
      "row": 0,
      "column": "deadline",
      "message": "Task deadline is in the past: 2025-02-15"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalAttempted": 25,
    "totalFixed": 20,
    "totalRequireManual": 5
  },
  "details": {
    "tasks": {
      "totalFixed": 20,
      "fixedErrors": [
        {
          "row": 0,
          "column": "deadline",
          "autoFixValue": "2025-07-28",
          "fixReason": "Updated past deadline to future date"
        }
      ],
      "manualErrors": [...]
    }
  }
}
```

### POST /api/ai/suggest-fix
Get AI suggestions for individual error fixes.

**Request:**
```json
{
  "sessionId": "session_1234567890_abcdef",
  "error": {
    "category": "datatype",
    "row": 0,
    "column": "availability",
    "message": "Invalid availability format",
    "value": "Monday-Friday 9AM-5PM"
  },
  "context": {
    "relatedData": [...],
    "fieldOptions": [...]
  }
}
```

**Response:**
```json
{
  "suggestion": {
    "suggestedValue": "75",
    "confidence": "high",
    "explanation": "Converted work schedule to 75% availability (40 hours/week)",
    "isAutomatable": false,
    "alternativeValues": ["80", "70", "100"]
  }
}
```

---

## Export

### GET /api/export/csv
Export clean CSV data.

**Parameters:**
- `sessionId` - Session identifier
- `dataType` - `clients`, `workers`, or `tasks`

**Response:** CSV file download

### GET /api/export/rules
Export applied validation rules.

**Parameters:**
- `sessionId` - Session identifier

**Response:**
```json
{
  "rules": [
    {
      "id": "rule_001",
      "name": "Required Fields",
      "conditions": [...],
      "actions": [...]
    }
  ],
  "appliedAt": "2025-06-28T12:00:00Z"
}
```

### GET /api/export/zip
Export complete data package as ZIP.

**Parameters:**
- `sessionId` - Session identifier

**Response:** ZIP file containing:
- `clients.csv`
- `workers.csv` 
- `tasks.csv`
- `validation-rules.json`
- `session-summary.json`

---

## Debug & Development

### GET /api/debug/sessions
List all active sessions (development only).

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "session_1234567890_abcdef",
      "status": "uploaded",
      "created": 1234567890,
      "dataTypes": ["clients", "workers", "tasks"]
    }
  ]
}
```

---

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-28T12:00:00Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (session not found)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Error Codes

- `SESSION_NOT_FOUND` - Session ID doesn't exist
- `INVALID_FILE_FORMAT` - Unsupported file format
- `AI_SERVICE_ERROR` - Google AI API error
- `VALIDATION_ERROR` - Data validation failed
- `EXPORT_ERROR` - Export generation failed

---

## Rate Limits

- **AI Endpoints**: 60 requests/minute per session
- **Upload**: 10 files/minute per IP
- **Export**: 30 requests/minute per session

## SDKs & Examples

### JavaScript/TypeScript
```typescript
import { DataAlchemistClient } from '@/lib/api-client'

const client = new DataAlchemistClient('http://localhost:3000')

// Upload files
const session = await client.upload({
  clients: clientsFile,
  workers: workersFile,
  tasks: tasksFile
})

// Search with AI
const results = await client.search(session.sessionId, {
  query: "Show me React developers",
  dataTypes: ["workers"]
})
```

### cURL Examples
```bash
# Upload files
curl -X POST http://localhost:3000/api/upload \
  -F "clients=@data/clients.csv"

# AI search
curl -X POST http://localhost:3000/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_123","query":"React developers"}'

# Export clean data
curl "http://localhost:3000/api/export/csv?sessionId=session_123&dataType=workers" \
  -o workers_clean.csv
```
