Based on user input, they want an App Builder added to the admin dashboard under Apps.
The App Builder itself is a system, it manages "Apps".
I'll create a CRUD for Apps.
App Schema:
name, description, content (html/js/css string), icon, type ('ai' or 'manual')
UI:
Admin Sidebar has "App Builder".
/admin/apps -> Grid of apps, + Create App button.
Create App has two options: Generate App with AI, Add App Manually.
AI App: Ask for Name, Description. Hit endpoint to generate simple HTML/JS app. Show preview, then save.
Manual: Form with Name, Description, Content (Code Editor).
Run: The app runs inside the admin panel. The user said: "it is in the index.html no react frame but uses lib from the cdn like tailiwind css or what ever is necessary and so on and can you do make a placeholde rfirs but we can edit it later as we want and so on and more or we can use the ai to gener athe config think about it and with a fall back and so on yes apprived adn selct waht ever is best".
So I'll just render the HTML string in an iframe (using srcDoc) so it's isolated but "inside the platform".

Steps:

1. Create Mongoose model `App.js` in `src/models/App.js`
2. Update `src/app/(admin)/admin/layout.js` to add "App Builder" under the "Apps" section in `navigationGroups`. Use an icon like Wrench or Layers. Path: `/admin/apps`
3. Create `/api/admin/apps` (GET, POST)
4. Create `/api/admin/apps/[id]` (GET, PUT, DELETE)
5. Create `/api/admin/apps/generate` (POST) to handle AI generation using the default AI models.
6. Create `/admin/apps/page.js` - Dashboard grid showing all apps with Edit and Open buttons. "+ Create App" at top.
7. Create `/admin/apps/create/page.js` - Options to create Manual or AI.
8. Create `/admin/apps/[id]/edit/page.js` - Editor for manual or AI generated apps.
9. Create `/admin/apps/[id]/run/page.js` - Runs the app in a full-screen or large iframe using `srcDoc`.

Let me think if there are other files to check or modify...
