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
import { parseMarkdownToBlocks, generateMarkdownFromBlocks } from '@/utils/coursify-parser.js';

function cleanPatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
}

function triggerThumbnail(course) {
  return generateCourseThumbnail(course._id.toString(), course.title, course.description).catch(
    (err) => {
      console.error(`[db-ops:triggerThumbnail] Background generation failed: ${err.message}`);
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves a course ID from either a MongoDB ObjectId or a slug.
 */
async function resolveCourseId(idOrSlug) {
  if (!idOrSlug) return null;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) return idOrSlug;

  await dbConnect();
  const course = await CoursifyCourse.findOne({ slug: idOrSlug, deletedAt: null })
    .select('_id')
    .lean();
  if (!course) throw new Error(`Course with slug or ID "${idOrSlug}" not found.`);
  return course._id.toString();
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function dbListCourses({ status, limit = 20, offset = 0 } = {}) {
  await dbConnect();
  const query = { deletedAt: null };
  if (status && status !== 'all') query.status = status;

  const courses = await CoursifyCourse.find(query)
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const courseIds = courses.map((c) => c._id);

  const sections = await CoursifySection.find({ courseId: { $in: courseIds }, deletedAt: null })
    .select('courseId status')
    .lean();

  const progressMap = {};
  for (const s of sections) {
    const cid = s.courseId.toString();
    if (!progressMap[cid]) progressMap[cid] = { total: 0, complete: 0 };
    progressMap[cid].total++;
    if (s.status === 'complete') progressMap[cid].complete++;
  }

  return courses.map((c) => {
    const progress = progressMap[c._id.toString()] || { total: 0, complete: 0 };
    return normalizeCourse({
      ...c,
      sectionCount: progress.total,
      sectionsTotal: progress.total,
      sectionsComplete: progress.complete,
    });
  });
}

export async function dbGetCourse({ id, includeSectionContent = false }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const sectionSelect = includeSectionContent
    ? 'moduleId title blocks summary status order learningGoals estimatedDuration resources'
    : 'moduleId title summary status order learningGoals estimatedDuration resources';

  const [modules, sections] = await Promise.all([
    CoursifyModule.find({ courseId, deletedAt: null }).sort({ order: 1 }).lean(),
    CoursifySection.find({ courseId, deletedAt: null })
      .select(sectionSelect)
      .sort({ order: 1 })
      .lean(),
  ]);

  const sectionsByModule = {};
  const uncategorized = [];
  for (const s of sections) {
    const mid = s.moduleId?.toString();
    const meta = normalizeSection(s);
    if (!includeSectionContent) {
      delete meta.blocks;
    }

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

  const sectionsComplete = sections.filter((s) => s.status === 'complete').length;

  return {
    course: normalizeCourse({
      ...course,
      sectionCount: sections.length,
      sectionsTotal: sections.length,
      sectionsComplete,
    }),
    modules: modulesWithSections,
    uncategorizedSections: uncategorized,
  };
}

export async function dbGetCourseWorkspace({ id }) {
  // Full workspace loader: metadata, planning, research, all modules + sections with content
  const { course, modules, uncategorizedSections } = await dbGetCourse({
    id,
    includeSectionContent: true,
  });

  return {
    course,
    modules,
    uncategorizedSections,
    researchNotes: course.researchNotes,
    progressSummary: {
      sectionsTotal: course.sectionsTotal,
      sectionsComplete: course.sectionsComplete,
      authoringStatus: course.authoringStatus,
    },
  };
}

export async function dbCreateCourse({
  title,
  description,
  difficulty,
  estimatedDuration,
  tags,
  waitForThumbnail = false,
}) {
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

  const thumbnailPromise = triggerThumbnail(course);
  if (waitForThumbnail) {
    await thumbnailPromise;
  }

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
  const courseId = await resolveCourseId(id);
  const clean = cleanPatch({ title, description, difficulty, estimatedDuration, tags, status });
  if (clean.title) clean.slug = await generateUniqueSlug(clean.title, courseId);
  if (clean.status === 'published') clean.authoringStatus = 'published';

  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const sectionCount = await CoursifySection.countDocuments({ courseId, deletedAt: null });
  return { course: normalizeCourse({ ...course, sectionCount }) };
}

export async function dbPublishCourse({ id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $set: { status: 'published', authoringStatus: 'published' }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const sectionCount = await CoursifySection.countDocuments({ courseId, deletedAt: null });
  return { course: normalizeCourse({ ...course, sectionCount }) };
}

export async function dbDeleteCourse({ id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const deletedAt = new Date();
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $set: { deletedAt }, $inc: { syncVersion: 1 } }
  ).lean();
  if (!course) throw new Error('Course not found.');
  await Promise.all([
    CoursifySection.updateMany(
      { courseId, deletedAt: null },
      { $set: { deletedAt }, $inc: { syncVersion: 1 } }
    ),
    CoursifyModule.updateMany(
      { courseId, deletedAt: null },
      { $set: { deletedAt }, $inc: { syncVersion: 1 } }
    ),
  ]);
  return { deletedId: courseId, title: course.title };
}

export async function dbListDeletedCourses() {
  await dbConnect();
  const courses = await CoursifyCourse.find({ deletedAt: { $ne: null } })
    .sort({ deletedAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const sections = await CoursifySection.find({
    courseId: { $in: courseIds },
    deletedAt: { $ne: null },
  })
    .select('courseId')
    .lean();

  const sectionCountMap = {};
  for (const s of sections) {
    const id = s.courseId.toString();
    sectionCountMap[id] = (sectionCountMap[id] || 0) + 1;
  }

  return courses.map((c) => ({
    ...normalizeCourse(c),
    sectionCount: sectionCountMap[c._id.toString()] || 0,
  }));
}

export async function dbRestoreCourse({ id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: { $ne: null } },
    { $set: { deletedAt: null }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();

  if (!course) throw new Error('Deleted course not found.');

  await Promise.all([
    CoursifySection.updateMany(
      { courseId, deletedAt: { $ne: null } },
      { $set: { deletedAt: null }, $inc: { syncVersion: 1 } }
    ),
    CoursifyModule.updateMany(
      { courseId, deletedAt: { $ne: null } },
      { $set: { deletedAt: null }, $inc: { syncVersion: 1 } }
    ),
  ]);

  return { course: normalizeCourse(course) };
}

export async function dbPermanentlyDeleteCourse({ id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOneAndDelete({ _id: courseId });

  if (!course) throw new Error('Course not found.');

  await Promise.all([
    CoursifySection.deleteMany({ courseId }),
    CoursifyModule.deleteMany({ courseId }),
  ]);

  return { deletedId: courseId, title: course.title };
}

export async function dbCleanupDeletedCourses(days = 30) {
  await dbConnect();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);

  const coursesToCleanup = await CoursifyCourse.find({
    deletedAt: { $lt: threshold },
  })
    .select('_id')
    .lean();

  if (coursesToCleanup.length === 0) return { deletedCount: 0 };

  const ids = coursesToCleanup.map((c) => c._id);

  const [courseResult, sectionResult, moduleResult] = await Promise.all([
    CoursifyCourse.deleteMany({ _id: { $in: ids } }),
    CoursifySection.deleteMany({ courseId: { $in: ids } }),
    CoursifyModule.deleteMany({ courseId: { $in: ids } }),
  ]);

  return {
    deletedCount: courseResult.deletedCount,
    sectionsDeleted: sectionResult.deletedCount,
    modulesDeleted: moduleResult.deletedCount,
  };
}

export async function dbEmptyTrash() {
  await dbConnect();
  const coursesToCleanup = await CoursifyCourse.find({
    deletedAt: { $ne: null },
  })
    .select('_id')
    .lean();

  if (coursesToCleanup.length === 0) return { deletedCount: 0 };

  const ids = coursesToCleanup.map((c) => c._id);

  const [courseResult, sectionResult, moduleResult] = await Promise.all([
    CoursifyCourse.deleteMany({ _id: { $in: ids } }),
    CoursifySection.deleteMany({ courseId: { $in: ids } }),
    CoursifyModule.deleteMany({ courseId: { $in: ids } }),
  ]);

  return {
    deletedCount: courseResult.deletedCount,
    sectionsDeleted: sectionResult.deletedCount,
    modulesDeleted: moduleResult.deletedCount,
  };
}

export async function dbSaveCoursePlan({
  courseId: id,
  targetAudience,
  learningObjectives,
  prerequisites,
  outcome,
  outline,
  planningNotes,
  authoringStatus,
  agentNotes,
  researchNotes,
}) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const clean = cleanPatch({
    targetAudience,
    learningObjectives,
    prerequisites,
    outcome,
    outline,
    planningNotes,
    authoringStatus,
    agentNotes,
    researchNotes,
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

export async function dbCreateModule({ courseId: id, title, summary, learningGoals, order }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
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

export async function dbGetModule({ id }) {
  await dbConnect();
  const module = await CoursifyModule.findOne({ _id: id, deletedAt: null }).lean();
  if (!module) throw new Error('Module not found.');

  const sections = await CoursifySection.find({ moduleId: id, deletedAt: null })
    .select('title summary status order learningGoals estimatedDuration resources')
    .sort({ order: 1 })
    .lean();

  return {
    module: normalizeModule({ ...module, sectionCount: sections.length }),
    sections: sections.map(normalizeSection),
  };
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
  courseId: id,
  title,
  blocks,
  content,
  order,
  resources,
  moduleId,
  status,
  summary,
  learningGoals,
  estimatedDuration,
}) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const last = await CoursifySection.findOne({ courseId, deletedAt: null })
    .sort({ order: -1 })
    .lean();
  const resolvedOrder = order !== undefined ? order : last ? last.order + 1 : 0;

  // Sync content and blocks
  let finalContent = content;
  let finalBlocks = blocks;

  if (content !== undefined) {
    finalBlocks = parseMarkdownToBlocks(content);
  } else if (blocks !== undefined) {
    finalContent = generateMarkdownFromBlocks(blocks);
  } else {
    finalContent = '';
    finalBlocks = [];
  }

  const section = await CoursifySection.create({
    courseId,
    title: title.trim(),
    content: finalContent,
    blocks: finalBlocks,
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
  blocks,
  content,
  summary,
  learningGoals,
  estimatedDuration,
  order,
  status,
  moduleId,
  resources,
}) {
  await dbConnect();

  // Sync content and blocks if either is provided
  let syncedPatch = {};
  if (content !== undefined) {
    syncedPatch.content = content;
    syncedPatch.blocks = parseMarkdownToBlocks(content);
  } else if (blocks !== undefined) {
    syncedPatch.blocks = blocks;
    syncedPatch.content = generateMarkdownFromBlocks(blocks);
  }

  const clean = cleanPatch({
    title,
    ...syncedPatch,
    summary,
    learningGoals,
    estimatedDuration,
    order,
    status,
    moduleId,
    resources,
  });
  const section = await CoursifySection.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true, strict: false }
  ).lean();
  if (!section) throw new Error('Section not found.');
  const allSections = await CoursifySection.find({
    courseId: section.courseId,
    deletedAt: null,
  }).lean();
  const allComplete = allSections.length > 0 && allSections.every((s) => s.status === 'complete');

  if (allComplete) {
    await CoursifyCourse.updateOne(
      { _id: section.courseId, deletedAt: null },
      { $set: { authoringStatus: 'reviewing' }, $inc: { syncVersion: 1 } }
    );
  } else {
    await CoursifyCourse.updateOne(
      { _id: section.courseId, deletedAt: null },
      { $inc: { syncVersion: 1 } }
    );
  }

  return { section: normalizeSection(section) };
}

export async function dbAddSections({ courseId, sections }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const last = await CoursifySection.findOne({ courseId, deletedAt: null })
    .sort({ order: -1 })
    .lean();
  let currentOrder = last ? last.order + 1 : 0;

  const docs = sections.map((s) => {
    let finalContent = s.content;
    let finalBlocks = s.blocks;

    if (s.content !== undefined) {
      finalBlocks = parseMarkdownToBlocks(s.content);
    } else if (s.blocks !== undefined) {
      finalContent = generateMarkdownFromBlocks(s.blocks);
    } else {
      finalContent = '';
      finalBlocks = [];
    }

    return {
      courseId,
      title: s.title.trim(),
      content: finalContent,
      blocks: finalBlocks,
      order: s.order !== undefined ? s.order : currentOrder++,
      resources: s.resources || [],
      moduleId: s.moduleId || null,
      status: s.status || 'draft',
      summary: s.summary || '',
      learningGoals: s.learningGoals || [],
      estimatedDuration: s.estimatedDuration || '',
    };
  });

  const created = await CoursifySection.insertMany(docs);
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { sections: created.map(normalizeSection) };
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

export async function dbReorderSections({ courseId: id, sectionIds, moduleId }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  if (!sectionIds.length) throw new Error('sectionIds must not be empty.');

  const query = { courseId, deletedAt: null };
  if (moduleId) query.moduleId = moduleId;

  const results = await Promise.all(
    sectionIds.map((id, index) =>
      CoursifySection.updateOne(
        { ...query, _id: id },
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

export async function dbListCourseModules({ courseId: id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
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
  courseId: id,
  title,
  summary,
  sourceUrl,
  sourceType,
  notes,
}) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
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

export async function dbResearchFindings({ courseId: id, findings }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
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

export async function dbSearchCourses({ query }) {
  await dbConnect();
  const filter = {
    deletedAt: null,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  };
  const courses = await CoursifyCourse.find(filter).sort({ updatedAt: -1 }).limit(20).lean();
  return courses.map(normalizeCourse);
}

export async function dbAddSectionResource({ sectionId, resource }) {
  await dbConnect();
  const section = await CoursifySection.findOneAndUpdate(
    { _id: sectionId, deletedAt: null },
    { $push: { resources: resource }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!section) throw new Error('Section not found.');
  await CoursifyCourse.updateOne(
    { _id: section.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { section: normalizeSection(section) };
}

export async function dbDeleteSections({ ids }) {
  await dbConnect();
  const result = await CoursifySection.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  );
  return { deletedCount: result.modifiedCount };
}

export async function dbDeleteModules({ ids }) {
  await dbConnect();
  const deletedAt = new Date();
  const result = await CoursifyModule.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt }, $inc: { syncVersion: 1 } }
  );
  await CoursifySection.updateMany(
    { moduleId: { $in: ids }, deletedAt: null },
    { $set: { deletedAt }, $inc: { syncVersion: 1 } }
  );
  return { deletedCount: result.modifiedCount };
}

export async function dbGetResearchNotes({ courseId: id }) {
  await dbConnect();
  const courseId = await resolveCourseId(id);
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null })
    .select('researchNotes')
    .lean();
  if (!course) throw new Error('Course not found.');
  return (course.researchNotes || []).map((n) => ({
    id: n._id?.toString() || n.id,
    title: n.title || '',
    summary: n.summary || '',
    sourceUrl: n.sourceUrl || '',
    sourceType: n.sourceType || 'other',
    notes: n.notes || '',
    accessedAt: n.accessedAt || null,
  }));
}
