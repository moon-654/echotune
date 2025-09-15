# Overview

This is an employee education history management system called "Ashimori" built as a modern web application. The system tracks training records, certifications, language skills, and other competencies for company employees using an interactive organizational chart as the primary UI. It's designed to centralize employee development data and provide visual insights into organizational capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Charts**: Recharts for data visualization, including radar charts for skill analysis

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with structured route handlers
- **Data Access**: Custom storage abstraction layer for database operations
- **Development**: Hot module replacement via Vite in development mode

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon Database serverless driver
- **Schema**: Comprehensive relational schema covering employees, training history, certifications, languages, and skills
- **Migrations**: Drizzle-kit for schema migrations and database management

## Key Data Models
- **Employees**: Core employee information with hierarchical relationships (manager/subordinate)
- **Training History**: Educational courses, completion status, and scores
- **Certifications**: Professional certifications with expiry tracking
- **Languages**: Language proficiency levels and test scores
- **Skills**: Technical and soft skills with calculated proficiency scores
- **Skill Calculations**: Computed skill metrics based on experience, training, and certifications

## Authentication & Security
- Session-based authentication (infrastructure in place via connect-pg-simple)
- Role-based access control for HR admins, managers, and employees
- Secure API endpoints with proper error handling

## Core Features
- **Interactive Organizational Chart**: Visual employee hierarchy with skill indicators
- **Employee Profiles**: Comprehensive view of individual employee data and capabilities
- **Training Management**: CRUD operations for educational records and progress tracking
- **Skill Analytics**: Calculated skill scores using algorithms that factor experience, certifications, and training
- **Dashboard & Reporting**: KPI visualization and department-level analytics
- **Google Sheets Integration**: Bidirectional sync with existing spreadsheet data

## Skill Calculation System
- Multi-factor skill scoring algorithm considering:
  - Years of experience (with diminishing returns)
  - Certification achievements and validity
  - Training completion and scores
  - Language proficiency levels
  - Technical vs soft skill categorization
- Real-time skill level updates based on new data

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations

## UI & Styling
- **Shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Data & Analytics
- **TanStack Query**: Server state management and caching
- **Recharts**: Chart and visualization components
- **Date-fns**: Date manipulation and formatting utilities

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production

## Google Services Integration
- **Google Apps Script**: Backend integration for Google Sheets data sync
- **Google Sheets API**: Bidirectional data synchronization with existing spreadsheets

## Runtime & Deployment
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Session Management**: Connect-pg-simple for PostgreSQL session storage