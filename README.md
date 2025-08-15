# Pendulum Core
The core backend services for Pendulum BaaS - a self-hosted, reactive Backend as a Service platform.

Pendulum is a complete backend solution that provides instant real-time synchronization across all connected clients. Built for developers who want to focus on building features, not managing backend infrastructure.

### Key Benefits:
- Self-hosted - Deploy to your own AWS account, keep your data
- Real-time by default - All database changes automatically sync to connected clients
- Zero configuration - Collections created automatically, no schemas required
- Familiar REST APIs - Standard HTTP endpoints, no proprietary query languages
- Complete solution - Backend services, admin dashboard, CLI, and SDK included

## Overview
Pendulum Core provides the essential backend infrastructure with real-time capabilties including:

- App Service - RESTful API for CRUD operations, authentication, and authorization
- Events Service - Real-time event broadcasting via Server-Sent Events (SSE)
- Admin Dashboard - Web-based management interface
- MongoDB Integration - Document database with automatic real-time updates

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### Installation & Setup
1. Install Pendulum Core:
   ```bash
   npm install @pendulum-baas/core
   ```
2. Start the complete backend environment:
   ```bash
   npx pendulum dev
   ```
   This automatically starts:

   - MongoDB on port 27017
   - App Service on port 3000
   - Events Service on port 8080
   - Admin Dashboard at http://localhost:3000/admin
3. Configure environment (optional):
   ```bash
   # .env file
   DB_NAME=your_app_name
   JWT_SECRET=your_jwt_secret_key
   # Other settings use sensible defaults
   ```

## Database Operations
Collections are created automatically on first access with smart defaults:

- **Document tracking** - Automatic `userId`, `createdBy`, `updatedBy` fields on all documents
- **Role-based permissions** - `admin`, `user`, `public` roles with configurable CRUD controls
- **Flexible access control** - Default open permissions, customizable per collection via admin dashboard
- **Real-time updates** - All database changes automatically broadcast to subscribed clients

## API Endpoints
### CRUD Operations:
```bash
GET    /pendulum/api?collection=<name>         # Get all documents
GET    /pendulum/api/<id>?collection=<name>    # Get single document  
POST   /pendulum/api?collection=<name>         # Insert documents
PATCH  /pendulum/api/<id>?collection=<name>    # Update document
DELETE /pendulum/api/<id>?collection=<name>    # Delete document
```

### Authentication
```bash
POST /pendulum/auth/register # User registration
POST /pendulum/auth/login    # User login
GET  /pendulum/auth/me       # Get current user
```

### Real-time Events
```bash
GET /pendulum-events/events  # SSE connection for live updates
```

### Admin Dashboard
```bash
GET /admin         # Admin dashboard interface
GET /pendulum/logs # Server logs via SSE
```

### Additional Features
- Bulk operations (`/some` endpoints for batch insert/update/delete)
- Pagination support (`limit`, `offset`, `sortKey` query parameters)
- Collection permissions management (`/pendulum/permissions`)

📖 More Details: See the SDK README for client integration examples and the CLI README for deployment options.

## Docker Services
```yaml
# compose.yaml includes:
mongodb:     # MongoDB database
app:         # Main API service  
events:      # Real-time events service
```

### Management Commands
```bash
docker compose up    # Start all services
docker compose logs  # View service logs
docker compose stop  # Stop services
```

## Production Deployment
For production, use the Pendulum CLI which automatically provisions AWS infrastructure:
```bash
pendulum deploy    # Deploy to AWS (ECS, DocumentDB, ALB)
pendulum destroy   # Remove all AWS resources
```

## Admin Dashboard
Access the admin interface at http://localhost:3000/admin to:
- View real-time database operations
- Manage user permissions
- Configure collection access controls
- Monitor system logs

## Dependencies Downloaded with `npm install`
- Express.js - Web framework
- MongoDB - Document database
- JWT - Authentication tokens
- bcrypt - Password hashing
- Morgan - HTTP logging
- CORS - Cross-origin support
