# Pendulum Core
The core backend services for Pendulum BaaS - a self-hosted, reactive Backend as a Service platform.

## Overview
Pendulum Core provides the essential backend infrastructure including:

- App Service - RESTful API for CRUD operations, authentication, and authorization
- Events Service - Real-time event broadcasting via Server-Sent Events (SSE)
- Admin Dashboard - Web-based management interface

## Quick Start
Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB (automatically provided via Docker)

## Installation
Add Pendulum Core to your project:
```bash
npm install @pendulum-baas/core
```

## Local Development
Start the complete backend environment:
```bash
pendulum dev
```

This starts:

- MongoDB on port 27017
- App Service on port 3000
- Events Service on port 8080
- Admin Dashboard at http://localhost:3000/admin

## Environment Configuration
Create a .env file in your project root:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=your_app_name
JWT_SECRET=your_jwt_secret_key
PORT=3000
EVENTS_SERVICE_URL=http://localhost:8080
NODE_ENV=development
```

# API Endpoints
## Core API

- GET /pendulum/api/ - Get all documents from collection
- GET /pendulum/api/:id - Get single document
- POST /pendulum/api/ - Insert documents
- PATCH /pendulum/api/:id - Update single document
- DELETE /pendulum/api/:id - Delete single document

## Authentication

- POST /pendulum/auth/register - User registration
- POST /pendulum/auth/login - User login
- GET /pendulum/auth/me - Get current user

## Real-time Events

- GET /pendulum-events/events - SSE connection for real-time updates

## Admin Dashboard

- GET /admin - Admin dashboard interface
- GET /pendulum/logs - Server logs via SSE

## Docker Compose Services
The included compose.yaml defines:
```yaml
services:
  mongodb:     # MongoDB database
  app:         # Main API service  
  events:      # Real-time events service
```

## Management Commands
Start services:
```bash
docker compose start
```

Stop services:
```bash
docker compose stop
```

View logs:
```bash
docker compose logs -f
```

Architecture
┌─────────────────┐    ┌─────────────────┐
│   App Service   │    │ Events Service  │
│   (Port 3000)   │────│   (Port 8080)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                     │
              ┌──────────────┐
              │   MongoDB    │
              │ (Port 27017) │
              └──────────────┘

## Database
Collections are created automatically on first access. Default permissions apply:

- admin - Full access to all collections
- user - Access to own documents only
- public - No access by default

## Development Scripts
```bash
npm run build:all     # Build both services
npm run start         # Start both services
npm run dev           # Start with hot reload
npm run clean         # Remove build artifacts
```

## Production Notes
For production deployment, use the Pendulum CLI which automatically provisions AWS infrastructure including ECS, DocumentDB, and load balancers.

## Dependencies

- Express.js - Web framework
- MongoDB - Document database
- JWT - Authentication tokens
- bcrypt - Password hashing
- Morgan - HTTP logging
- CORS - Cross-origin support
