# Vivexa API Documentation

## Endpoints

### 1. `GET /api/v1/health`
Checks server health.
- **Response**: `{ status: "success", message: "Vivexa API is running optimally." }`

### 2. `POST /api/v1/gemini/chat`
Sends a query and context to the Gemini AI Analyst.
- **Headers**: `Authorization: Bearer <Supabase Token>`
- **Body Payload**:
  ```json
  {
    "message": "What is the average of column X?",
    "context": "Dataset Name: Sales\\nRows: 100"
  }
  ```
- **Response Payload**:
  ```json
  {
    "success": true,
    "data": {
      "text": "The average is...",
      "confidence": 95
    }
  }
  ```

### 3. `GET /api/v1/admin/stats`
(Deprecated mostly in favor of client-side queries for security and ease). 
Retrieves basic admin metrics if configured.
