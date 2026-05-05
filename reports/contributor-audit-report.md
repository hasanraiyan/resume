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
- **PUT/DELETE** `/api/projects/[slug]`: **Warning:** These routes currently perform project mutations/deletions **without** session or role-based authentication checks in the handler. Additionally, the root `middleware.js` matcher does not cover these paths, making them publicly accessible for mutation.
- **GET** `/api/admin/contributors`: Lists all contributors with search and pagination support. Protected by admin session check.
- **POST** `/api/admin/contributors`: Creates a new contributor profile. Protected by admin session check.
- **GET/PUT/DELETE** `/api/admin/contributors/[id]`: Manages individual contributor profiles.
  - **Deletion Logic (API):** The `DELETE` handler in `src/app/api/admin/contributors/[id]/route.js` includes a check: `Project.countDocuments({ 'contributors.contributor': params.id })`. It prevents deletion if the contributor is assigned to any projects.

### Server Actions
- **`src/app/actions/projectActions.js`**:
  - `getProjectBySlug(slug, isAuthenticated)`: Fetches project and populates contributors.
  - `createProject(formData)` / `updateProject(id, formData)`: Processes `contributors` from JSON string in `FormData`.
- **`src/app/actions/contributorActions.js`**:
  - `getAllContributors()`: Fetches all contributor profiles.
  - `getContributorById(id)`: Fetches a single profile.
  - `createContributor(formData)` / `updateContributor(id, formData)`: Manages contributor profile data.
  - **`deleteContributor(id)` (Vulnerability):** Unlike the REST API counterpart, this server action uses `Contributor.findByIdAndDelete(id)` directly **without** checking if the contributor is linked to any projects. This allows linked contributors to be hard-deleted, potentially leaving dangling references in Project documents.

---

## 3. Admin Panel (Frontend)

### Components & Management
- **Project Management:**
  - **Page:** `src/app/(admin)/admin/projects/[id]/edit/page.js` and `src/app/(admin)/admin/projects/new/page.js`.
  - **Form:** `src/components/admin/ProjectForm.js` manages the overall project state, handles submission, and owns the contributor lookup state for the project editor.
  - **Contributor Fetching in Form:** On mount, `ProjectForm` fetches `/api/admin/contributors`, stores the response in `allContributors`, and passes that list down to `ContributorManager`.
  - **Contributor Manager:** `src/components/admin/ContributorManager.js` receives the contributor lookup data from `ProjectForm` and is used within the form to:
    - Assign contributors from the existing list.
    - Define roles for each contributor on the specific project.
    - Store/preserve contributor order metadata in the project payload, without a dedicated UI to edit or reorder it.
    - Remove contributor associations from the project.

- **Contributor Profile Management:**
  - **Page:** `src/app/(admin)/admin/contributors/page.js`.
  - **Client Component:** `src/components/admin/ContributorsClient.js` handles listing and searching. **Note:** It invokes the `deleteContributor` server action directly upon user confirmation, bypassing the project-reference check present in the REST API.
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

## 5. Summary of Data Flow & Security Gaps
1.  **Creation:** Contributor profiles are created independently in the Admin Contributor section.
2.  **Association:** While editing a project, contributors are selected and assigned roles. This stores the `Contributor` ObjectID and role/order metadata in the `Project` document's `contributors` array.
3.  **Retrieval:** The public project page fetches the project data and uses Mongoose's `.populate()` to join the contributor profile details.
4.  **Security Gap (Auth):** Project mutation/deletion via `/api/projects/[slug]` is currently unprotected by authentication middleware or inline checks.
5.  **Security Gap (Integrity):** While the REST API for contributors protects against deleting linked records, the Admin UI uses a Server Action that bypasses this check, allowing for referential integrity breakage.
