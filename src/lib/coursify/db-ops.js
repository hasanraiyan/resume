/**
 * Coursify shared DB operations.
 * Both the MCP server (tools.js) and the Studio agent (coursify-studio-tools.js)
 * import from here so business logic lives in exactly one place.
 *
 * Every function throws on failure — callers format the error for their transport.
 */

import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import CoursifyModule from '@/models/CoursifyModule';
import CoursifySection from '@/models/CoursifySection';
import { generateUniqueSlug } from './slugify.js';
import { generateCourseThumbnail } from './thumbnailGen.js';
import { normalizeCourse, normalizeModule, normalizeSection } from '@/lib/mcp/coursify/utils.js';

function cleanPatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
}

function triggerThumbnail(course) {
  generateCourseThumbnail(course._id.toString(), course.title, course.description).catch(() => {});
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function dbListCourses({ status } = {}) {
  await dbConnect();
  const query = { deletedAt: null };
  if (status && status !== 'all') query.status = status;

  const courses = await CoursifyCourse.find(query).sort({ updatedAt: -1 }).lean();
  const courseIds = courses.map((c) => c._id);

  const sections = await CoursifySection.find({ courseId: { $in: courseIds }, deletedAt: null })
    .select('courseId')
    .lean();

  const countMap = {};
  for (const s of sections) {
    const id = s.courseId.toString();
    countMap[id] = (countMap[id] || 0) + 1;
  }

  return courses.map((c) =>
    normalizeCourse({ ...c, sectionCount: countMap[c._id.toString()] || 0 })
  );
}

export async function dbGetCourse({ id }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const [modules, sections] = await Promise.all([
    CoursifyModule.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
    CoursifySection.find({ courseId: id, deletedAt: null })
      .select('moduleId title summary status order learningGoals estimatedDuration resources')
      .sort({ order: 1 })
      .lean(),
  ]);

  const sectionsByModule = {};
  const uncategorized = [];
  for (const s of sections) {
    const mid = s.moduleId?.toString();
    const meta = {
      id: s._id.toString(),
      title: s.title,
      summary: s.summary || '',
      status: s.status || 'draft',
      order: s.order ?? 0,
      learningGoals: s.learningGoals || [],
      estimatedDuration: s.estimatedDuration || '',
    };
    if (mid) {
      if (!sectionsByModule[mid]) sectionsByModule[mid] = [];
      sectionsByModule[mid].push(meta);
    } else {
      uncategorized.push(meta);
    }
  }

  const modulesWithSections = modules.map((m) => ({
    ...normalizeModule(m),
    sections: sectionsByModule[m._id.toString()] || [],
  }));

  return {
    course: normalizeCourse({ ...course, sectionCount: sections.length }),
    modules: modulesWithSections,
    uncategorizedSections: uncategorized,
  };
}

export async function dbCreateCourse({ title, description, difficulty, estimatedDuration, tags }) {
  await dbConnect();
  const slug = await generateUniqueSlug(title.trim());
  const course = await CoursifyCourse.create({
    title: title.trim(),
    slug,
    description: description?.trim() || '',
    difficulty: difficulty || 'beginner',
    estimatedDuration: estimatedDuration || '',
    tags: tags || [],
    thumbnailGenerating: true,
  });
  triggerThumbnail(course);
  return { course: normalizeCourse({ ...course.toObject(), sectionCount: 0 }) };
}

export async function dbUpdateCourse({
  id,
  title,
  description,
  difficulty,
  estimatedDuration,
  tags,
  status,
}) {
  await dbConnect();
  const clean = cleanPatch({ title, description, difficulty, estimatedDuration, tags, status });
  if (clean.title) clean.slug = await generateUniqueSlug(clean.title, id);
  if (clean.status === 'published') clean.authoringStatus = 'published';

  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const sectionCount = await CoursifySection.countDocuments({ courseId: id, deletedAt: null });
  return { course: normalizeCourse({ ...course, sectionCount }) };
}

export async function dbPublishCourse({ id }) {
  await dbConnect();
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { status: 'published', authoringStatus: 'published' }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const sectionCount = await CoursifySection.countDocuments({ courseId: id, deletedAt: null });
  return { course: normalizeCourse({ ...course, sectionCount }) };
}

export async function dbDeleteCourse({ id }) {
  await dbConnect();
  const deletedAt = new Date();
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt }, $inc: { syncVersion: 1 } }
  ).lean();
  if (!course) throw new Error('Course not found.');
  await Promise.all([
    CoursifySection.updateMany(
      { courseId: id, deletedAt: null },
      { $set: { deletedAt }, $inc: { syncVersion: 1 } }
    ),
    CoursifyModule.updateMany(
      { courseId: id, deletedAt: null },
      { $set: { deletedAt }, $inc: { syncVersion: 1 } }
    ),
  ]);
  return { deletedId: id, title: course.title };
}

export async function dbSaveCoursePlan({
  courseId,
  targetAudience,
  learningObjectives,
  prerequisites,
  outcome,
  outline,
  planningNotes,
  authoringStatus,
}) {
  await dbConnect();
  const clean = cleanPatch({
    targetAudience,
    learningObjectives,
    prerequisites,
    outcome,
    outline,
    planningNotes,
    authoringStatus,
  });
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const sectionCount = await CoursifySection.countDocuments({ courseId, deletedAt: null });
  return { course: normalizeCourse({ ...course, sectionCount }) };
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function dbCreateModule({ courseId, title, summary, learningGoals, order }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  let resolvedOrder = order;
  if (resolvedOrder === undefined) {
    const last = await CoursifyModule.findOne({ courseId, deletedAt: null })
      .sort({ order: -1 })
      .lean();
    resolvedOrder = last ? last.order + 1 : 0;
  }
  const module = await CoursifyModule.create({
    courseId,
    title: title.trim(),
    summary: summary || '',
    learningGoals: learningGoals || [],
    order: resolvedOrder,
  });
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { module: normalizeModule(module.toObject()) };
}

export async function dbUpdateModule({ id, title, summary, learningGoals, order, status }) {
  await dbConnect();
  const clean = cleanPatch({ title, summary, learningGoals, order, status });
  const module = await CoursifyModule.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!module) throw new Error('Module not found.');
  await CoursifyCourse.updateOne(
    { _id: module.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { module: normalizeModule(module) };
}

export async function dbDeleteModule({ id }) {
  await dbConnect();
  const module = await CoursifyModule.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  ).lean();
  if (!module) throw new Error('Module not found.');
  await CoursifySection.updateMany(
    { moduleId: id, deletedAt: null },
    { $set: { moduleId: null }, $inc: { syncVersion: 1 } }
  );
  await CoursifyCourse.updateOne(
    { _id: module.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { deletedId: id, title: module.title };
}

export async function dbReorderModules({ courseId, moduleIds }) {
  await dbConnect();
  if (!moduleIds.length) throw new Error('moduleIds must not be empty.');
  const results = await Promise.all(
    moduleIds.map((id, index) =>
      CoursifyModule.updateOne(
        { _id: id, courseId, deletedAt: null },
        { $set: { order: index }, $inc: { syncVersion: 1 } }
      )
    )
  );
  const matched = results.reduce((sum, r) => sum + r.matchedCount, 0);
  if (matched < moduleIds.length)
    throw new Error(`Only ${matched}/${moduleIds.length} modules found.`);
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { reordered: moduleIds.length };
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function dbAddSection({
  courseId,
  title,
  sectionType,
  content,
  questions,
  order,
  resources,
  moduleId,
  status,
  summary,
  learningGoals,
  estimatedDuration,
}) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const last = await CoursifySection.findOne({ courseId, deletedAt: null })
    .sort({ order: -1 })
    .lean();
  const resolvedOrder = order !== undefined ? order : last ? last.order + 1 : 0;
  const resolvedType = sectionType || 'lesson';

  const section = await CoursifySection.create({
    courseId,
    title: title.trim(),
    sectionType: resolvedType,
    content: resolvedType === 'lesson' ? content || '' : '',
    quiz: { questions: questions || [] },
    order: resolvedOrder,
    resources: resources || [],
    moduleId: moduleId || null,
    status: status || 'draft',
    summary: summary || '',
    learningGoals: learningGoals || [],
    estimatedDuration: estimatedDuration || '',
  });
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { section: normalizeSection(section.toObject()) };
}

export async function dbUpdateSection({
  id,
  title,
  sectionType,
  content,
  questions,
  summary,
  learningGoals,
  estimatedDuration,
  order,
  status,
  moduleId,
  resources,
}) {
  await dbConnect();
  const clean = cleanPatch({
    title,
    sectionType,
    content,
    summary,
    learningGoals,
    estimatedDuration,
    order,
    status,
    moduleId,
    resources,
  });
  if (questions !== undefined) clean['quiz.questions'] = questions;
  const section = await CoursifySection.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true, strict: false }
  ).lean();
  if (!section) throw new Error('Section not found.');
  await CoursifyCourse.updateOne(
    { _id: section.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { section: normalizeSection(section) };
}

export async function dbDeleteSection({ id }) {
  await dbConnect();
  const section = await CoursifySection.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  ).lean();
  if (!section) throw new Error('Section not found.');
  await CoursifyCourse.updateOne(
    { _id: section.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { deletedId: id, title: section.title };
}

export async function dbReorderSections({ courseId, sectionIds }) {
  await dbConnect();
  if (!sectionIds.length) throw new Error('sectionIds must not be empty.');
  const results = await Promise.all(
    sectionIds.map((id, index) =>
      CoursifySection.updateOne(
        { _id: id, courseId, deletedAt: null },
        { $set: { order: index }, $inc: { syncVersion: 1 } }
      )
    )
  );
  const matched = results.reduce((sum, r) => sum + r.matchedCount, 0);
  if (matched < sectionIds.length)
    throw new Error(`Only ${matched}/${sectionIds.length} sections found.`);
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { reordered: sectionIds.length };
}

export async function dbGetSectionContent({ id }) {
  await dbConnect();
  const section = await CoursifySection.findOne({ _id: id, deletedAt: null }).lean();
  if (!section) throw new Error('Section not found.');
  const moduleTitle = section.moduleId
    ? (await CoursifyModule.findOne({ _id: section.moduleId, deletedAt: null }).lean())?.title || ''
    : '';
  return { section: { ...normalizeSection(section), moduleTitle } };
}

export async function dbSetQuizQuestions({ id, questions }) {
  await dbConnect();
  const section = await CoursifySection.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { 'quiz.questions': questions }, $inc: { syncVersion: 1 } },
    { new: true, strict: false }
  ).lean();
  if (!section) throw new Error('Section not found.');
  await CoursifyCourse.updateOne(
    { _id: section.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { section: normalizeSection(section) };
}

export async function dbListCourseModules({ courseId }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const [modules, sections] = await Promise.all([
    CoursifyModule.find({ courseId, deletedAt: null }).sort({ order: 1 }).lean(),
    CoursifySection.find({ courseId, deletedAt: null })
      .select('moduleId title status order')
      .sort({ order: 1 })
      .lean(),
  ]);

  const sectionsByModule = {};
  const uncategorized = [];
  for (const s of sections) {
    const mid = s.moduleId?.toString();
    const entry = { id: s._id.toString(), title: s.title, status: s.status };
    if (mid) {
      if (!sectionsByModule[mid]) sectionsByModule[mid] = [];
      sectionsByModule[mid].push(entry);
    } else {
      uncategorized.push(entry);
    }
  }

  return {
    course: normalizeCourse({ ...course, sectionCount: sections.length }),
    modules: modules.map((m) => ({
      ...normalizeModule({ ...m, sectionCount: (sectionsByModule[m._id.toString()] || []).length }),
      sections: sectionsByModule[m._id.toString()] || [],
    })),
    uncategorizedSections: uncategorized,
  };
}

export async function dbAddResearchNote({
  courseId,
  title,
  summary,
  sourceUrl,
  sourceType,
  notes,
}) {
  await dbConnect();
  const note = {
    title: title.trim(),
    summary: summary.trim(),
    sourceUrl: sourceUrl || '',
    sourceType: sourceType || 'other',
    notes: notes || '',
  };
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $push: { researchNotes: note }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const saved = course.researchNotes[course.researchNotes.length - 1];
  return { note: { id: saved._id?.toString(), ...saved } };
}

export async function dbResearchFindings({ courseId, findings }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');
  if (!findings?.length) throw new Error('Provide at least one finding.');
  const notes = findings.map((f) => ({
    title: f.title.trim(),
    summary: f.summary.trim(),
    sourceUrl: f.sourceUrl || '',
    sourceType: f.sourceType || 'other',
    notes: f.notes || '',
  }));
  await CoursifyCourse.updateOne(
    { _id: courseId, deletedAt: null },
    { $push: { researchNotes: { $each: notes } }, $inc: { syncVersion: 1 } }
  );
  return { count: notes.length };
}
