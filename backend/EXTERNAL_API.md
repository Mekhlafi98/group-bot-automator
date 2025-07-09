# External API Documentation

This document describes the secure external API endpoints for the Group Bot Automator application.

## Overview

The external API provides secure access to your application data using API tokens. All endpoints require authentication and are rate-limited for security.

## Base URL

```
https://your-domain.com/api/external
```

## Authentication

All external API requests must include an API token in the `x-api-token` header:

```
x-api-token: your-api-token-here
```

### Getting an API Token

1. Log into your Group Bot Automator dashboard
2. Navigate to the Tokens section
3. Create a new API token with a descriptive label
4. Copy the generated token (it will only be shown once)

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status with error message

## Security Features

- **Helmet**: Security headers for protection against common vulnerabilities
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Token Authentication**: Secure API token-based authentication
- **User Isolation**: Each token is tied to a specific user account
- **Input Validation**: All inputs are validated and sanitized

## Endpoints

### Health Check

Check if the external API is operational.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "group-bot-automator-external-api"
}
```

### Contacts

#### Get All Contacts

```http
GET /contacts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "group": "VIP",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

#### Create Contact

```http
POST /contacts
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "+1987654321",
  "email": "jane@example.com",
  "group": "Regular",
  "status": "active"
}
```

**Required Fields:**
- `name` (string): Contact's full name
- `phone` (string): Contact's phone number

**Optional Fields:**
- `email` (string): Contact's email address
- `group` (string): Contact's group/category
- `status` (string): Contact status (default: "active")

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "phone": "+1987654321",
      "email": "jane@example.com",
      "group": "Regular",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Contact created successfully"
}
```

#### Update Contact

```http
PUT /contacts/{id}
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith Updated",
      "phone": "+1987654321",
      "email": "jane.updated@example.com",
      "group": "Regular",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Contact updated successfully"
}
```

#### Delete Contact

```http
DELETE /contacts/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### Workflows

#### Get All Workflows

```http
GET /workflows
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Welcome Workflow",
        "description": "Automated welcome messages",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Telegram Groups

#### Get All Groups

```http
GET /groups
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "My Telegram Group",
        "chatId": "-1001234567890",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### System Status

#### Get System Status

```http
GET /system-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "_id": "507f1f77bcf86cd799439015",
      "status": "operational",
      "lastCheck": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Message Logs

#### Get Message Logs

```http
GET /logs?limit=50&offset=0&status=success
```

**Query Parameters:**
- `limit` (number, optional): Number of logs to return (default: 50, max: 100)
- `offset` (number, optional): Number of logs to skip (default: 0)
- `status` (string, optional): Filter by status (e.g., "success", "failed", "pending")

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "workflowId": "507f1f77bcf86cd799439013",
        "contactId": "507f1f77bcf86cd799439011",
        "status": "success",
        "message": "Welcome message sent successfully",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Name and phone are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API token is required"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Contact not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch contacts"
}
```

## Usage Examples

### cURL Examples

#### Get Contacts
```bash
curl -X GET "https://your-domain.com/api/external/contacts" \
  -H "x-api-token: your-api-token-here"
```

#### Create Contact
```bash
curl -X POST "https://your-domain.com/api/external/contacts" \
  -H "Content-Type: application/json" \
  -H "x-api-token: your-api-token-here" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  }'
```

#### Update Contact
```bash
curl -X PUT "https://your-domain.com/api/external/contacts/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "x-api-token: your-api-token-here" \
  -d '{
    "name": "John Doe Updated"
  }'
```

### JavaScript Examples

#### Using fetch
```javascript
const API_TOKEN = 'your-api-token-here';
const BASE_URL = 'https://your-domain.com/api/external';

// Get contacts
async function getContacts() {
  const response = await fetch(`${BASE_URL}/contacts`, {
    headers: {
      'x-api-token': API_TOKEN
    }
  });
  return response.json();
}

// Create contact
async function createContact(contactData) {
  const response = await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': API_TOKEN
    },
    body: JSON.stringify(contactData)
  });
  return response.json();
}
```

#### Using axios
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-domain.com/api/external',
  headers: {
    'x-api-token': 'your-api-token-here'
  }
});

// Get contacts
const getContacts = () => api.get('/contacts');

// Create contact
const createContact = (contactData) => api.post('/contacts', contactData);
```

## Best Practices

1. **Store tokens securely**: Never expose API tokens in client-side code or public repositories
2. **Use HTTPS**: Always use HTTPS in production environments
3. **Handle rate limits**: Implement exponential backoff when hitting rate limits
4. **Validate responses**: Always check the `success` field in responses
5. **Error handling**: Implement proper error handling for all API calls
6. **Token rotation**: Regularly rotate your API tokens for security
7. **Monitor usage**: Keep track of your API usage to stay within limits

## Support

For API support or questions, please contact your system administrator or refer to the main application documentation. 