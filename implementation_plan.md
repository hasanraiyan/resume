# Implementation Plan

Add a dedicated Services section to the portfolio website to showcase service offerings and enhance the AI assistant capabilities.

Multiple paragraphs outlining the scope, context, and high-level approach. The Services feature will create a structured way to display professional offerings, making the portfolio more effective at converting visitors to clients. This implementation follows the existing patterns in the codebase, using MongoDB for data storage, Next.js for the frontend, and integrating with the existing AI chatbot system. The feature will be fully manageable through the admin panel and will enhance the AI assistant's ability to provide detailed service information.

[Types]
Single sentence describing the type system changes.

Detailed type definitions, interfaces, enums, or data structures with complete specifications. The Service model will include fields for title, description, icon, and details array. The Service schema will use Mongoose with proper validation and text indexing for search functionality.

**Service Model Schema:**
```javascript
{
  title: { type: String, required: true },           // Service title (e.g., "Full-Stack Development")
  description: { type: String, required: true },     // Brief service description
  icon: { type: String, required: true },           // Icon identifier for UI display
  details: [{ type: String }],                      // Array of detailed service points
  featured: { type: Boolean, default: false },      // Whether service is featured
  order: { type: Number, default: 0 },             // Display order
  isActive: { type: Boolean, default: true }       // Whether service is active
}
```

**Service API Types:**
```javascript
// For admin forms and API responses
interface ServiceFormData {
  title: string;
  description: string;
  icon: string;
  details: string[];
  featured?: boolean;
  order?: number;
  isActive?: boolean;
}

// For frontend display
interface ServiceDisplayData {
  _id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
  featured: boolean;
  order: number;
  isActive: boolean;
}
```

[Files]
Single sentence describing file modifications.

Detailed breakdown of new files to be created and existing files to be modified for the Services feature implementation.

**New Files to Create:**

1. **Database Model**
   - `src/models/Service.js` - MongoDB schema for services data

2. **API Routes**
   - `src/app/api/services/route.js` - GET/POST services (public endpoint)
   - `src/app/api/admin/services/route.js` - CRUD operations for admin
   - `src/app/api/admin/services/[id]/route.js` - Individual service management

3. **Admin Pages**
   - `src/app/(admin)/admin/services/page.js` - Services listing page
   - `src/app/(admin)/admin/services/new/page.js` - Create new service page
   - `src/app/(admin)/admin/services/[id]/edit/page.js` - Edit service page

4. **Components**
   - `src/components/Services.js` - Frontend services display component
   - `src/components/admin/ServiceForm.js` - Admin form for service management
   - `src/components/admin/ServicePreview.js` - Preview component for admin

5. **Actions**
   - `src/app/actions/serviceActions.js` - Server actions for service operations

**Existing Files to Modify:**

1. **Homepage Integration**
   - `src/app/page.js` - Add Services component to homepage layout

2. **AI Chatbot Enhancement**
   - `src/app/api/chat/route.js` - Add getServices tool definition and execution
   - `src/lib/ai/context-builder.js` - Include services in dynamic context

3. **Navigation Updates**
   - `src/components/Navbar.js` - Add Services link if needed

4. **Search Integration**
   - `src/app/api/search/route.js` - Include services in search results

[Functions]
Single sentence describing function modifications.

Detailed breakdown of new functions to be created and existing functions to be modified for the Services feature.

**New Functions:**

1. **Service Data Management**
   - `getAllServices()` - Fetch all active services for frontend display
   - `getServiceById(id)` - Get specific service for editing
   - `createService(data)` - Create new service with validation
   - `updateService(id, data)` - Update existing service
   - `deleteService(id)` - Soft delete service
   - `getServicesOverview()` - Get services summary for AI context

2. **AI Chatbot Integration**
   - `getServices()` - Tool function for AI assistant to retrieve services
   - `buildServicesContext()` - Build services context for AI system messages

3. **Admin Form Handlers**
   - `handleServiceSubmit()` - Form submission for create/edit
   - `validateServiceData()` - Client-side validation
   - `handleServiceDelete()` - Delete confirmation and execution

**Modified Functions:**

1. **Context Builder Updates**
   - `getProjectOverview()` - Add services overview to context
   - `buildDynamicContext()` - Include services in AI context

2. **Chat API Enhancements**
   - `executeToolCall()` - Add getServices case
   - `buildSystemMessages()` - Include services in AI knowledge

3. **Search Integration**
   - `searchPortfolio()` - Include services in search results

[Classes]
Single sentence describing class modifications.

Detailed breakdown of new classes and modifications for the Services feature implementation.

**New Classes:**

1. **Service Model Class**
   - `Service` - MongoDB model class extending mongoose.Model
   - Includes static methods for common queries
   - Text indexing for search functionality

2. **ServiceForm Component Class**
   - Extends existing form patterns in the codebase
   - Reuses AdminPageWrapper, FormSection, and other admin components
   - Integrates with IconPicker for service icons

3. **Services Display Component Class**
   - Responsive grid layout similar to existing project cards
   - Uses existing UI components (Card, Badge, Button)
   - Integrates with animation libraries (GSAP if available)

**Modified Classes:**

1. **AdminPageWrapper Integration**
   - Add services navigation to admin sidebar
   - Include services in admin dashboard

2. **ChatbotWidget Enhancement**
   - No direct class changes needed
   - Integration through API route modifications

[Dependencies]
Single sentence describing dependency modifications.

No new dependencies required. The implementation will use existing packages: Mongoose for database modeling, Next.js for API routes and pages, React for components, and existing UI libraries (Lucide React for icons, Tailwind for styling).

[Testing]
Single sentence describing testing approach.

Test file requirements include unit tests for service API routes, integration tests for admin functionality, and manual testing of AI chatbot integration. Validation strategies include testing CRUD operations, form validation, search functionality, and AI tool responses.

**Test Coverage:**
- API route testing for all CRUD operations
- Form validation and submission testing
- AI chatbot tool integration testing
- Frontend component rendering and interaction testing
- Search functionality integration testing

[Implementation Order]
Single sentence describing the implementation sequence.

Numbered steps showing the logical order of changes to minimize conflicts and ensure successful integration.

1. **Database Foundation** - Create Service model with proper schema and indexing
2. **API Infrastructure** - Build admin API routes for CRUD operations
3. **Admin Interface** - Create admin pages for service management
4. **Frontend Display** - Build Services component for homepage
5. **Homepage Integration** - Add Services section to main page layout
6. **AI Assistant Enhancement** - Add getServices tool and context integration
7. **Search Integration** - Include services in search functionality
8. **Testing and Validation** - Test all functionality and fix any issues
