import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const CoursifyCourse = mongoose.model('CoursifyCourse');
  const CoursifyModule = mongoose.model('CoursifyModule');
  const CoursifySection = mongoose.model('CoursifySection');

  // Find RAG course
  const ragCourse = await CoursifyCourse.findOne({
    $or: [{ title: /rag/i }, { slug: /rag/i }],
    deletedAt: null,
  }).lean();

  if (!ragCourse) {
    console.log('No RAG course found. Listing all courses:');
    const courses = await CoursifyCourse.find({ deletedAt: null }).lean();
    for (const c of courses) {
      console.log(`  - ${c.title} (slug: ${c.slug}, _id: ${c._id})`);
    }
    await mongoose.disconnect();
    return;
  }

  console.log(`\nFound course: "${ragCourse.title}" (slug: ${ragCourse.slug})`);
  console.log(`  _id: ${ragCourse._id}`);
  console.log(`  description: ${ragCourse.description}`);

  // Get modules for this course
  const modules = await CoursifyModule.find({
    courseId: ragCourse._id,
    deletedAt: null,
  })
    .sort({ order: 1 })
    .lean();

  console.log(`\nModules (${modules.length}):`);
  for (const mod of modules) {
    console.log(`  Module ${mod.order}: "${mod.title}" (_id: ${mod._id})`);

    // Get sections for this module
    const sections = await CoursifySection.find({
      courseId: ragCourse._id,
      moduleId: mod._id,
      deletedAt: null,
    })
      .sort({ order: 1 })
      .lean();

    console.log(`    Sections (${sections.length}):`);
    for (const sec of sections) {
      console.log(`      Section ${sec.order}: "${sec.title}" (status: ${sec.status})`);
    }
  }

  // Also get all sections for the course (module-agnostic)
  const allSections = await CoursifySection.find({
    courseId: ragCourse._id,
    deletedAt: null,
  })
    .sort({ order: 1 })
    .lean();

  console.log(`\nTotal sections in course: ${allSections.length}`);

  // Specific check for module-3
  const module3 = modules.find((m) => m.order === 3 || /module.?3/i.test(m.title));
  if (module3) {
    const module3Sections = allSections.filter((s) => String(s.moduleId) === String(module3._id));
    console.log(`\nModule 3 ("${module3.title}") has ${module3Sections.length} section(s):`);
    for (const sec of module3Sections) {
      console.log(`  - "${sec.title}" (order: ${sec.order}, status: ${sec.status})`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
