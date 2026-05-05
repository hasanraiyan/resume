# Contributor Architecture Audit & Map

This report documents the architecture and data flow for project contributors within the portfolio application.

## 1. Database & Models (MongoDB/Mongoose)

### Project Model
- **File:** `src/models/Project.js`
- **Field:** `contributors`
- **Schema Detail:**
  ```javascript
  contributors: [
    {
      contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', required: true },
      role: { type: String, required: true },
      order: { type: Number, default: 0 },
    },
  ]
  ```
- **Hooks/Middleware:**
  - `ProjectSchema.pre('save', ...)`: Sets `publishedAt` when status changes to 'published'. No specific hooks for contributor manipulation.

### Contributor Model
- **File:** `src/models/Contributor.js`
- **Fields:** `name`, `avatar`, `bio`, `socialLinks` (portfolio, linkedin, github, twitter, dribbble, behance, instagram, youtube).
- **Indexing:** Text index on `name` and `bio` for search functionality.

---

## 2. Backend Logic (API & Server Actions)

### API Endpoints
- **GET** `/api/projects/[slug]`: Retrieves project details and populates `contributors.contributor`. Handles both slugs and ObjectIDs.
- **PUT/DELETE** `/api/projects/[slug]`: Admin operations for projects.
- **GET** `/api/admin/contributors`: Lists all contributors with search and pagination support.
- **POST** `/api/admin/contributors`: Creates a new contributor profile.
- **GET/PUT/DELETE** `/api/admin/contributors/[id]`: Manages individual contributor profiles.
  - **Deletion Logic:** The `DELETE` handler in `src/app/api/admin/contributors/[id]/route.js` explicitly checks if a contributor is assigned to any projects using `Project.countDocuments({ 'contributors.contributor': params.id })` and prevents deletion if the count is greater than zero.

### Server Actions
- **`src/app/actions/projectActions.js`**:
  - `getProjectBySlug(slug, isAuthenticated)`: Fetches project and populates contributors.
  - `createProject(formData)` / `updateProject(id, formData)`: Processes `contributors` from JSON string in `FormData`.
- **`src/app/actions/contributorActions.js`**:
  - `getAllContributors()`: Fetches all contributor profiles.
  - `getContributorById(id)`: Fetches a single profile.
  - `createContributor(formData)` / `updateContributor(id, formData)`: Manages contributor profile data.
  - `deleteContributor(id)`: Deletes a contributor profile.

---

## 3. Admin Panel (Frontend)

### Components & Management
- **Project Management:**
  - **Page:** `src/app/(admin)/admin/projects/[id]/edit/page.js` and `src/app/(admin)/admin/projects/new/page.js`.
  - **Form:** `src/components/admin/ProjectForm.js` manages the overall project state and handles submission.
  - **Contributor Manager:** `src/components/admin/ContributorManager.js` is used within `ProjectForm` to:
    - Assign contributors from the existing list.
    - Define roles for each contributor on the specific project.
    - Manage display order.
    - Remove contributor associations from the project.

- **Contributor Profile Management:**
  - **Page:** `src/app/(admin)/admin/contributors/page.js`.
  - **Client Component:** `src/components/admin/ContributorsClient.js` handles listing, searching, and calling the delete action.
  - **Form:** `src/components/admin/ContributorForm.js` handles creation and editing of the reusable contributor profiles.

---

## 4. Public Project Page (Frontend)

- **Page:** `src/app/projects/[slug]/page.js` (Server Component).
- **Client Component:** `src/components/projects/ProjectDetailClient.js`.
- **Rendering Logic:**
  - Maps through `project.contributors`.
  - Transforms data into a flat structure for rendering.
  - Displays a "Contributors" section at the bottom of the project detail page with avatars, names, roles, and social links.

---

## 5. Summary of Data Flow
1.  **Creation:** Contributor profiles are created independently in the Admin Contributor section.
2.  **Association:** While editing a project, contributors are selected and assigned roles. This stores the `Contributor` ObjectID and role/order metadata in the `Project` document's `contributors` array.
3.  **Retrieval:** The public project page fetches the project data and uses Mongoose's `.populate()` to join the contributor profile details.
4.  **Deletion Protection:** Contributor profiles cannot be deleted via the API if they are currently linked to one or more projects.
