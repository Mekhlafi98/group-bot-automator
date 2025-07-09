# Group Bot Automator - External API Documentation

## Overview

The Group Bot Automator External API provides secure access to all system functionality through RESTful endpoints. This API is designed for external integrations and third-party applications.

**Base URL**: `https://your-domain.com/api/external`

## Authentication

All API requests require authentication using an API token in the request headers.

### Headers Required
```
X-API-Token: your_api_token_here
Content-Type: application/json
```

### Getting an API Token
1. Log into your Group Bot Automator account
2. Navigate to Profile → API Tokens
3. Generate a new API token
4. Copy the token and use it in your requests

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns `429 Too Many Requests` with retry-after information

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "count": 10,
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Endpoints

### Health Check

#### GET /health
Check API health and status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "group-bot-automator-external-api"
}
```

---

## Contacts

### Get All Contacts
#### GET /contacts
Retrieve all contacts for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of contacts to return (default: all)
- `offset` (optional): Number of contacts to skip (default: 0)

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

### Get Contact by ID
#### GET /contacts/:id
Retrieve a specific contact by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "group": "VIP",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Contact
#### POST /contacts
Create a new contact.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "phone": "+1987654321",
  "email": "jane@example.com",
  "group": "Regular",
  "status": "active"
}
```

**Required Fields:**
- `name`: Contact name
- `phone`: Phone number

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

### Update Contact
#### PUT /contacts/:id
Update an existing contact.

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "group": "VIP"
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
      "group": "VIP",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Contact updated successfully"
}
```

### Delete Contact
#### DELETE /contacts/:id
Delete a contact.

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### Toggle Contact Status
#### PATCH /contacts/:id/toggle-status
Toggle contact status between active and inactive.

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
      "group": "VIP",
      "status": "inactive",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:40:00.000Z"
    }
  },
  "message": "Contact inactive successfully"
}
```

### Search Contacts
#### GET /contacts/search
Search contacts by name, email, or phone.

**Query Parameters:**
- `q` (optional): Search query
- `group` (optional): Filter by group
- `status` (optional): Filter by status (active/inactive)

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
        "status": "active"
      }
    ]
  },
  "count": 1
}
```

---

## Workflows

### Get All Workflows
#### GET /workflows
Retrieve all workflows for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Welcome Workflow",
        "description": "Welcome new users",
        "steps": [
          {
            "type": "message",
            "content": "Welcome to our group!",
            "delay": 0
          }
        ],
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Get Workflow by ID
#### GET /workflows/:id
Retrieve a specific workflow by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Welcome Workflow",
      "description": "Welcome new users",
      "steps": [...],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Workflow
#### POST /workflows
Create a new workflow.

**Request Body:**
```json
{
  "name": "Support Workflow",
  "description": "Handle support requests",
  "steps": [
    {
      "type": "message",
      "content": "Thank you for contacting support. We'll get back to you soon.",
      "delay": 0
    },
    {
      "type": "action",
      "action": "create_ticket",
      "delay": 5
    }
  ],
  "status": "active"
}
```

**Required Fields:**
- `name`: Workflow name

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Support Workflow",
      "description": "Handle support requests",
      "steps": [...],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Workflow created successfully"
}
```

### Update Workflow
#### PUT /workflows/:id
Update an existing workflow.

**Request Body:**
```json
{
  "name": "Updated Support Workflow",
  "description": "Enhanced support workflow",
  "steps": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Updated Support Workflow",
      "description": "Enhanced support workflow",
      "steps": [...],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Workflow updated successfully"
}
```

### Delete Workflow
#### DELETE /workflows/:id
Delete a workflow.

**Response:**
```json
{
  "success": true,
  "message": "Workflow deleted successfully"
}
```

---

## Telegram Groups

### Get All Groups
#### GET /groups
Retrieve all Telegram groups for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Main Support Group",
        "chatId": "-1001234567890",
        "description": "Primary support channel",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Get Group by ID
#### GET /groups/:id
Retrieve a specific group by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Main Support Group",
      "chatId": "-1001234567890",
      "description": "Primary support channel",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Group
#### POST /groups
Create a new Telegram group entry.

**Request Body:**
```json
{
  "name": "Announcements Group",
  "chatId": "-1001987654321",
  "description": "Official announcements channel",
  "status": "active"
}
```

**Required Fields:**
- `name`: Group name
- `chatId`: Telegram chat ID

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Announcements Group",
      "chatId": "-1001987654321",
      "description": "Official announcements channel",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Group created successfully"
}
```

### Update Group
#### PUT /groups/:id
Update an existing group.

**Request Body:**
```json
{
  "name": "Updated Announcements Group",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Updated Announcements Group",
      "chatId": "-1001987654321",
      "description": "Updated description",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Group updated successfully"
}
```

### Delete Group
#### DELETE /groups/:id
Delete a group.

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

---

## Message Filters

### Get All Filters
#### GET /filters
Retrieve all message filters for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "filterName": "Spam Filter",
        "filterType": "keyword",
        "filterValue": "spam",
        "groupId": "507f1f77bcf86cd799439015",
        "workflowId": "507f1f77bcf86cd799439013",
        "priority": 1,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Get Filter by ID
#### GET /filters/:id
Retrieve a specific filter by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "filter": {
      "_id": "507f1f77bcf86cd799439017",
      "filterName": "Spam Filter",
      "filterType": "keyword",
      "filterValue": "spam",
      "groupId": "507f1f77bcf86cd799439015",
      "workflowId": "507f1f77bcf86cd799439013",
      "priority": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Filter
#### POST /filters
Create a new message filter.

**Request Body:**
```json
{
  "filterName": "Support Request Filter",
  "filterType": "regex",
  "filterValue": "help|support|issue",
  "groupId": "507f1f77bcf86cd799439015",
  "workflowId": "507f1f77bcf86cd799439013",
  "priority": 2,
  "isActive": true
}
```

**Required Fields:**
- `filterName`: Filter name
- `filterType`: Filter type (keyword, regex, etc.)
- `filterValue`: Filter value/pattern

**Response:**
```json
{
  "success": true,
  "data": {
    "filter": {
      "_id": "507f1f77bcf86cd799439018",
      "filterName": "Support Request Filter",
      "filterType": "regex",
      "filterValue": "help|support|issue",
      "groupId": "507f1f77bcf86cd799439015",
      "workflowId": "507f1f77bcf86cd799439013",
      "priority": 2,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Filter created successfully"
}
```

### Update Filter
#### PUT /filters/:id
Update an existing filter.

**Request Body:**
```json
{
  "filterName": "Updated Support Filter",
  "filterValue": "help|support|issue|problem",
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filter": {
      "_id": "507f1f77bcf86cd799439018",
      "filterName": "Updated Support Filter",
      "filterType": "regex",
      "filterValue": "help|support|issue|problem",
      "groupId": "507f1f77bcf86cd799439015",
      "workflowId": "507f1f77bcf86cd799439013",
      "priority": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Filter updated successfully"
}
```

### Delete Filter
#### DELETE /filters/:id
Delete a filter.

**Response:**
```json
{
  "success": true,
  "message": "Filter deleted successfully"
}
```

### Get Filters by Group
#### GET /filters/group/:groupId
Retrieve all filters for a specific group.

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "filterName": "Spam Filter",
        "filterType": "keyword",
        "filterValue": "spam",
        "groupId": "507f1f77bcf86cd799439015",
        "workflowId": "507f1f77bcf86cd799439013",
        "priority": 1,
        "isActive": true
      }
    ]
  },
  "count": 1
}
```

---

## Webhooks

### Get All Webhooks
#### GET /webhooks
Retrieve all webhooks for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "_id": "507f1f77bcf86cd799439019",
        "url": "https://api.example.com/webhook",
        "method": "POST",
        "entityType": "all",
        "events": ["message_received", "workflow_triggered"],
        "enabled": true,
        "description": "Main webhook for notifications",
        "payload": {
          "custom_field": "value"
        },
        "headers": {
          "Authorization": "Bearer token"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Get Webhook by ID
#### GET /webhooks/:id
Retrieve a specific webhook by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook": {
      "_id": "507f1f77bcf86cd799439019",
      "url": "https://api.example.com/webhook",
      "method": "POST",
      "entityType": "all",
      "events": ["message_received", "workflow_triggered"],
      "enabled": true,
      "description": "Main webhook for notifications",
      "payload": {...},
      "headers": {...},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Create Webhook
#### POST /webhooks
Create a new webhook.

**Request Body:**
```json
{
  "url": "https://api.example.com/new-webhook",
  "method": "POST",
  "entityType": "contacts",
  "events": ["contact_created", "contact_updated"],
  "enabled": true,
  "description": "Contact change notifications",
  "payload": {
    "source": "group-bot-automator"
  },
  "headers": {
    "X-Custom-Header": "value"
  }
}
```

**Required Fields:**
- `url`: Webhook URL

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook": {
      "_id": "507f1f77bcf86cd799439020",
      "url": "https://api.example.com/new-webhook",
      "method": "POST",
      "entityType": "contacts",
      "events": ["contact_created", "contact_updated"],
      "enabled": true,
      "description": "Contact change notifications",
      "payload": {...},
      "headers": {...},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Webhook created successfully"
}
```

### Update Webhook
#### PUT /webhooks/:id
Update an existing webhook.

**Request Body:**
```json
{
  "url": "https://api.example.com/updated-webhook",
  "description": "Updated webhook description",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook": {
      "_id": "507f1f77bcf86cd799439020",
      "url": "https://api.example.com/updated-webhook",
      "method": "POST",
      "entityType": "contacts",
      "events": ["contact_created", "contact_updated"],
      "enabled": false,
      "description": "Updated webhook description",
      "payload": {...},
      "headers": {...},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "Webhook updated successfully"
}
```

### Delete Webhook
#### DELETE /webhooks/:id
Delete a webhook.

**Response:**
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

---

## Message Logs

### Get All Logs
#### GET /logs
Retrieve message logs with optional filtering and pagination.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Number of logs to skip (default: 0)
- `status` (optional): Filter by status (success, failed, pending)
- `workflowId` (optional): Filter by workflow ID
- `groupId` (optional): Filter by group ID

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "message": "Welcome message sent",
        "status": "success",
        "workflowId": "507f1f77bcf86cd799439013",
        "groupId": "507f1f77bcf86cd799439015",
        "contactId": "507f1f77bcf86cd799439011",
        "details": {
          "sent_at": "2024-01-15T10:30:00.000Z",
          "delivery_status": "delivered"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Log by ID
#### GET /logs/:id
Retrieve a specific log by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "log": {
      "_id": "507f1f77bcf86cd799439021",
      "message": "Welcome message sent",
      "status": "success",
      "workflowId": "507f1f77bcf86cd799439013",
      "groupId": "507f1f77bcf86cd799439015",
      "contactId": "507f1f77bcf86cd799439011",
      "details": {...},
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Logs by Workflow
#### GET /logs/workflow/:workflowId
Retrieve logs for a specific workflow.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Number of logs to skip (default: 0)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...]
  },
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Get Logs by Status
#### GET /logs/status/:status
Retrieve logs by status.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Number of logs to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...]
  },
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## Actions

### Get All Actions
#### GET /actions
Retrieve all actions for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "type": "bulk-message",
        "data": {
          "message": "Hello everyone!",
          "contactIds": ["507f1f77bcf86cd799439011"],
          "groupIds": ["507f1f77bcf86cd799439015"]
        },
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
      }
    ]
  },
  "count": 1
}
```

### Get Action by ID
#### GET /actions/:id
Retrieve a specific action by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "_id": "507f1f77bcf86cd799439022",
      "type": "bulk-message",
      "data": {...},
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### Create Action
#### POST /actions
Create a new action.

**Request Body:**
```json
{
  "type": "custom-action",
  "data": {
    "custom_field": "value",
    "target": "specific_target"
  },
  "status": "pending"
}
```

**Required Fields:**
- `type`: Action type

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "_id": "507f1f77bcf86cd799439023",
      "type": "custom-action",
      "data": {...},
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Action created successfully"
}
```

### Execute Action
#### POST /actions/:id/execute
Execute a specific action.

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "_id": "507f1f77bcf86cd799439023",
      "type": "custom-action",
      "data": {...},
      "status": "executing",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:40:00.000Z"
    }
  },
  "message": "Action execution started"
}
```

---

## Bulk Messages

### Send Bulk Message
#### POST /bulk-messages
Send a bulk message to multiple contacts or groups.

**Request Body:**
```json
{
  "message": "Important announcement for all users!",
  "contactIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "groupIds": ["507f1f77bcf86cd799439015"],
  "workflowId": "507f1f77bcf86cd799439013",
  "scheduledAt": "2024-01-15T11:00:00.000Z"
}
```

**Required Fields:**
- `message`: Message content
- At least one of: `contactIds` or `groupIds`

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "_id": "507f1f77bcf86cd799439024",
      "type": "bulk-message",
      "data": {
        "message": "Important announcement for all users!",
        "contactIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
        "groupIds": ["507f1f77bcf86cd799439015"],
        "workflowId": "507f1f77bcf86cd799439013",
        "scheduledAt": "2024-01-15T11:00:00.000Z"
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Bulk message scheduled successfully"
}
```

### Get Bulk Message Status
#### GET /bulk-messages/:actionId
Get the status of a bulk message action.

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "_id": "507f1f77bcf86cd799439024",
      "type": "bulk-message",
      "data": {...},
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

---

## System Status

### Get System Status
#### GET /system-status
Retrieve the current system status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "_id": "507f1f77bcf86cd799439025",
      "status": "operational",
      "details": {
        "uptime": "99.9%",
        "last_check": "2024-01-15T10:30:00.000Z",
        "services": {
          "telegram": "online",
          "database": "online",
          "webhooks": "online"
        }
      },
      "lastUpdated": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update System Status
#### PUT /system-status
Update the system status.

**Request Body:**
```json
{
  "status": "maintenance",
  "details": {
    "reason": "Scheduled maintenance",
    "estimated_duration": "2 hours",
    "affected_services": ["webhooks"]
  }
}
```

**Required Fields:**
- `status`: System status

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "_id": "507f1f77bcf86cd799439025",
      "status": "maintenance",
      "details": {
        "reason": "Scheduled maintenance",
        "estimated_duration": "2 hours",
        "affected_services": ["webhooks"]
      },
      "lastUpdated": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  },
  "message": "System status updated successfully"
}
```

---

## Notifications

### Get Notifications
#### GET /notifications
Retrieve notifications for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50)
- `offset` (optional): Number of notifications to skip (default: 0)
- `read` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": []
  },
  "count": 0,
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Mark Notification as Read
#### PATCH /notifications/:id/read
Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## Statistics

### Get User Statistics
#### GET /stats
Retrieve comprehensive statistics for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "contacts": {
        "total": 150,
        "active": 120,
        "inactive": 30
      },
      "workflows": {
        "total": 25,
        "active": 20,
        "inactive": 5
      },
      "groups": {
        "total": 10,
        "active": 8,
        "inactive": 2
      },
      "filters": {
        "total": 15,
        "active": 12,
        "inactive": 3
      },
      "webhooks": {
        "total": 5,
        "active": 4,
        "inactive": 1
      },
      "logs": {
        "total": 1000,
        "recent": 10,
        "byStatus": {
          "success": 850,
          "failed": 100,
          "pending": 50
        }
      }
    }
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Name and phone are required"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API token is required"
}
```

#### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Contact not found"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch contacts"
}
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'https://your-domain.com/api/external',
  headers: {
    'X-API-Token': 'your_api_token_here',
    'Content-Type': 'application/json'
  }
});

// Get all contacts
const getContacts = async () => {
  try {
    const response = await apiClient.get('/contacts');
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error.response.data);
  }
};

// Create a new contact
const createContact = async (contactData) => {
  try {
    const response = await apiClient.post('/contacts', contactData);
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error.response.data);
  }
};

// Send bulk message
const sendBulkMessage = async (message, contactIds, groupIds) => {
  try {
    const response = await apiClient.post('/bulk-messages', {
      message,
      contactIds,
      groupIds
    });
    return response.data;
  } catch (error) {
    console.error('Error sending bulk message:', error.response.data);
  }
};
```

### Python
```python
import requests

class GroupBotAPI:
    def __init__(self, base_url, api_token):
        self.base_url = base_url
        self.headers = {
            'X-API-Token': api_token,
            'Content-Type': 'application/json'
        }
    
    def get_contacts(self):
        response = requests.get(f'{self.base_url}/contacts', headers=self.headers)
        return response.json()
    
    def create_contact(self, contact_data):
        response = requests.post(f'{self.base_url}/contacts', 
                               json=contact_data, headers=self.headers)
        return response.json()
    
    def send_bulk_message(self, message, contact_ids=None, group_ids=None):
        data = {
            'message': message,
            'contactIds': contact_ids or [],
            'groupIds': group_ids or []
        }
        response = requests.post(f'{self.base_url}/bulk-messages', 
                               json=data, headers=self.headers)
        return response.json()

# Usage
api = GroupBotAPI('https://your-domain.com/api/external', 'your_api_token_here')
contacts = api.get_contacts()
```

### cURL Examples

#### Get all contacts
```bash
curl -X GET "https://your-domain.com/api/external/contacts" \
  -H "X-API-Token: your_api_token_here" \
  -H "Content-Type: application/json"
```

#### Create a contact
```bash
curl -X POST "https://your-domain.com/api/external/contacts" \
  -H "X-API-Token: your_api_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "group": "VIP"
  }'
```

#### Send bulk message
```bash
curl -X POST "https://your-domain.com/api/external/bulk-messages" \
  -H "X-API-Token: your_api_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello everyone!",
    "contactIds": ["507f1f77bcf86cd799439011"],
    "groupIds": ["507f1f77bcf86cd799439015"]
  }'
```

---

## Webhook Events

When webhooks are configured, the following events will trigger webhook calls:

### Contact Events
- `contact_created` - When a new contact is created
- `contact_updated` - When a contact is updated
- `contact_deleted` - When a contact is deleted

### Workflow Events
- `workflow_created` - When a new workflow is created
- `workflow_updated` - When a workflow is updated
- `workflow_deleted` - When a workflow is deleted
- `workflow_triggered` - When a workflow is executed

### Message Events
- `message_received` - When a message is received
- `message_sent` - When a message is sent
- `message_failed` - When message sending fails

### System Events
- `system_status_changed` - When system status changes
- `bulk_message_started` - When bulk messaging starts
- `bulk_message_completed` - When bulk messaging completes

### Webhook Payload Example
```json
{
  "event": "contact_created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "contact": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    }
  },
  "user_id": "user_123"
}
```

---

## Best Practices

1. **Rate Limiting**: Respect the rate limits and implement exponential backoff for retries
2. **Error Handling**: Always handle errors gracefully and implement proper logging
3. **Authentication**: Keep your API tokens secure and rotate them regularly
4. **Webhooks**: Use webhooks for real-time updates instead of polling
5. **Pagination**: Use pagination for large datasets to improve performance
6. **Validation**: Validate data before sending to the API
7. **Monitoring**: Monitor your API usage and implement alerts for failures

---

## Support

For API support and questions:
- Email: api-support@your-domain.com
- Documentation: https://docs.your-domain.com/api
- Status Page: https://status.your-domain.com

---

*Last updated: January 15, 2024* 