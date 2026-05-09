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
import CoursifyUnit from '@/models/CoursifyUnit';
import { generateUniqueSlug } from './slugify.js';
import { generateCourseThumbnail } from './thumbnailGen.js';
import {
  normalizeCourse,
  normalizeModule,
  normalizeUnit,
  parseOutlineToModules,
} from '@/lib/mcp/coursify/utils.js';

function cleanPatch(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
}

function triggerThumbnail(course) {
  generateCourseThumbnail(course._id.toString(), course.title, course.description).catch(() => {});
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

  const units = await CoursifyUnit.find({ courseId: { $in: courseIds }, deletedAt: null })
    .select('courseId status')
    .lean();

  const progressMap = {};
  for (const u of units) {
    const cid = u.courseId.toString();
    if (!progressMap[cid]) progressMap[cid] = { total: 0, complete: 0 };
    progressMap[cid].total++;
    if (u.status === 'complete') progressMap[cid].complete++;
  }

  return courses.map((c) => {
    const progress = progressMap[c._id.toString()] || { total: 0, complete: 0 };
    return normalizeCourse({
      ...c,
      unitCount: progress.total,
      unitsTotal: progress.total,
      unitsComplete: progress.complete,
    });
  });
}

export async function dbGetCourse({ id, includeUnitContent = false }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const unitSelect = includeUnitContent
    ? 'moduleId title content unitType quiz summary status order learningGoals estimatedDuration resources blocks completionStatus'
    : 'moduleId title summary status order learningGoals estimatedDuration resources completionStatus';

  const [modules, units] = await Promise.all([
    CoursifyModule.find({ courseId: id, deletedAt: null }).sort({ order: 1 }).lean(),
    CoursifyUnit.find({ courseId: id, deletedAt: null })
      .select(unitSelect)
      .sort({ order: 1 })
      .lean(),
  ]);

  const unitsByModule = {};
  const uncategorized = [];
  for (const u of units) {
    const mid = u.moduleId?.toString();
    const meta = normalizeUnit(u);
    if (!includeUnitContent) {
      delete meta.content;
      delete meta.quiz;
      delete meta.blocks;
    }

    if (mid) {
      if (!unitsByModule[mid]) unitsByModule[mid] = [];
      unitsByModule[mid].push(meta);
    } else {
      uncategorized.push(meta);
    }
  }

  const modulesWithUnits = modules.map((m) => ({
    ...normalizeModule(m),
    units: unitsByModule[m._id.toString()] || [],
  }));

  const unitsComplete = units.filter((u) => u.status === 'complete').length;

  return {
    course: normalizeCourse({
      ...course,
      unitCount: units.length,
      unitsTotal: units.length,
      unitsComplete,
    }),
    modules: modulesWithUnits,
    uncategorizedUnits: uncategorized,
  };
}

export async function dbGetCourseWorkspace({ id }) {
  // Full workspace loader: metadata, planning, research, all modules + units with content
  const { course, modules, uncategorizedUnits } = await dbGetCourse({
    id,
    includeUnitContent: true,
  });

  return {
    course,
    modules,
    uncategorizedUnits,
    researchNotes: course.researchNotes,
    progressSummary: {
      unitsTotal: course.unitsTotal,
      unitsComplete: course.unitsComplete,
      authoringStatus: course.authoringStatus,
    },
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
  return { course: normalizeCourse({ ...course.toObject(), unitCount: 0 }) };
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
  const unitCount = await CoursifyUnit.countDocuments({ courseId: id, deletedAt: null });
  return { course: normalizeCourse({ ...course, unitCount }) };
}

export async function dbPublishCourse({ id }) {
  await dbConnect();
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { status: 'published', authoringStatus: 'published' }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const unitCount = await CoursifyUnit.countDocuments({ courseId: id, deletedAt: null });
  return { course: normalizeCourse({ ...course, unitCount }) };
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
    CoursifyUnit.updateMany(
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
  agentNotes,
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
    agentNotes,
  });
  const course = await CoursifyCourse.findOneAndUpdate(
    { _id: courseId, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!course) throw new Error('Course not found.');
  const unitCount = await CoursifyUnit.countDocuments({ courseId, deletedAt: null });
  return { course: normalizeCourse({ ...course, unitCount }) };
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

export async function dbGetModule({ id }) {
  await dbConnect();
  const module = await CoursifyModule.findOne({ _id: id, deletedAt: null }).lean();
  if (!module) throw new Error('Module not found.');

  const units = await CoursifyUnit.find({ moduleId: id, deletedAt: null })
    .select('title summary status order learningGoals estimatedDuration resources completionStatus')
    .sort({ order: 1 })
    .lean();

  return {
    module: normalizeModule({ ...module, unitCount: units.length }),
    units: units.map(normalizeUnit),
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
  await CoursifyUnit.updateMany(
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

// ─── Units ───────────────────────────────────────────────────────────────────

export async function dbAddUnit({
  courseId,
  title,
  unitType,
  content,
  questions,
  order,
  resources,
  moduleId,
  status,
  summary,
  learningGoals,
  estimatedDuration,
  blocks,
  completionStatus,
}) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const last = await CoursifyUnit.findOne({ courseId, deletedAt: null }).sort({ order: -1 }).lean();
  const resolvedOrder = order !== undefined ? order : last ? last.order + 1 : 0;
  const resolvedType = unitType || 'lesson';

  const unit = await CoursifyUnit.create({
    courseId,
    title: title.trim(),
    unitType: resolvedType,
    content: resolvedType === 'lesson' ? content || '' : '',
    quiz: { questions: questions || [] },
    order: resolvedOrder,
    resources: resources || [],
    moduleId: moduleId || null,
    status: status || 'draft',
    summary: summary || '',
    learningGoals: learningGoals || [],
    estimatedDuration: estimatedDuration || '',
    blocks: blocks || [],
    completionStatus: completionStatus || 'not_started',
  });
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { unit: normalizeUnit(unit.toObject()) };
}

export async function dbUpdateUnit({
  id,
  title,
  unitType,
  content,
  questions,
  summary,
  learningGoals,
  estimatedDuration,
  order,
  status,
  moduleId,
  resources,
  blocks,
  completionStatus,
}) {
  await dbConnect();
  const clean = cleanPatch({
    title,
    unitType,
    content,
    summary,
    learningGoals,
    estimatedDuration,
    order,
    status,
    moduleId,
    resources,
    blocks,
    completionStatus,
  });
  if (questions !== undefined) clean['quiz.questions'] = questions;
  const unit = await CoursifyUnit.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: clean, $inc: { syncVersion: 1 } },
    { new: true, strict: false }
  ).lean();
  if (!unit) throw new Error('Unit not found.');
  const allUnits = await CoursifyUnit.find({
    courseId: unit.courseId,
    deletedAt: null,
  }).lean();
  const allComplete = allUnits.length > 0 && allUnits.every((u) => u.status === 'complete');

  if (allComplete) {
    await CoursifyCourse.updateOne(
      { _id: unit.courseId, deletedAt: null },
      { $set: { authoringStatus: 'reviewing' }, $inc: { syncVersion: 1 } }
    );
  } else {
    await CoursifyCourse.updateOne(
      { _id: unit.courseId, deletedAt: null },
      { $inc: { syncVersion: 1 } }
    );
  }

  return { unit: normalizeUnit(unit) };
}

export async function dbMarkUnitComplete({ id, completionStatus }) {
  await dbConnect();
  const unit = await CoursifyUnit.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { completionStatus }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!unit) throw new Error('Unit not found.');
  await CoursifyCourse.updateOne(
    { _id: unit.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { unit: normalizeUnit(unit) };
}

export async function dbAddUnits({ courseId, units }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const last = await CoursifyUnit.findOne({ courseId, deletedAt: null }).sort({ order: -1 }).lean();
  let currentOrder = last ? last.order + 1 : 0;

  const docs = units.map((u) => ({
    courseId,
    title: u.title.trim(),
    unitType: u.unitType || 'lesson',
    content: u.content || '',
    quiz: { questions: u.questions || [] },
    order: u.order !== undefined ? u.order : currentOrder++,
    resources: u.resources || [],
    moduleId: u.moduleId || null,
    status: u.status || 'draft',
    summary: u.summary || '',
    learningGoals: u.learningGoals || [],
    estimatedDuration: u.estimatedDuration || '',
    blocks: u.blocks || [],
    completionStatus: u.completionStatus || 'not_started',
  }));

  const created = await CoursifyUnit.insertMany(docs);
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { units: created.map(normalizeUnit) };
}

export async function dbDeleteUnit({ id }) {
  await dbConnect();
  const unit = await CoursifyUnit.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  ).lean();
  if (!unit) throw new Error('Unit not found.');
  await CoursifyCourse.updateOne(
    { _id: unit.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { deletedId: id, title: unit.title };
}

export async function dbReorderUnits({ courseId, unitIds, moduleId }) {
  await dbConnect();
  if (!unitIds.length) throw new Error('unitIds must not be empty.');

  const query = { courseId, deletedAt: null };
  if (moduleId) query.moduleId = moduleId;

  const results = await Promise.all(
    unitIds.map((id, index) =>
      CoursifyUnit.updateOne(
        { ...query, _id: id },
        { $set: { order: index }, $inc: { syncVersion: 1 } }
      )
    )
  );
  const matched = results.reduce((sum, r) => sum + r.matchedCount, 0);
  if (matched < unitIds.length) throw new Error(`Only ${matched}/${unitIds.length} units found.`);
  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return { reordered: unitIds.length };
}

export async function dbGetUnitContent({ id }) {
  await dbConnect();
  const unit = await CoursifyUnit.findOne({ _id: id, deletedAt: null }).lean();
  if (!unit) throw new Error('Unit not found.');
  const moduleTitle = unit.moduleId
    ? (await CoursifyModule.findOne({ _id: unit.moduleId, deletedAt: null }).lean())?.title || ''
    : '';
  return { unit: { ...normalizeUnit(unit), moduleTitle } };
}

export async function dbSetQuizQuestions({ id, questions }) {
  await dbConnect();
  const unit = await CoursifyUnit.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { 'quiz.questions': questions }, $inc: { syncVersion: 1 } },
    { new: true, strict: false }
  ).lean();
  if (!unit) throw new Error('Unit not found.');
  await CoursifyCourse.updateOne(
    { _id: unit.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { unit: normalizeUnit(unit) };
}

export async function dbListCourseModules({ courseId }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');

  const [modules, units] = await Promise.all([
    CoursifyModule.find({ courseId, deletedAt: null }).sort({ order: 1 }).lean(),
    CoursifyUnit.find({ courseId, deletedAt: null })
      .select('moduleId title status order completionStatus')
      .sort({ order: 1 })
      .lean(),
  ]);

  const unitsByModule = {};
  const uncategorized = [];
  for (const u of units) {
    const mid = u.moduleId?.toString();
    const entry = {
      id: u._id.toString(),
      title: u.title,
      status: u.status,
      completionStatus: u.completionStatus,
    };
    if (mid) {
      if (!unitsByModule[mid]) unitsByModule[mid] = [];
      unitsByModule[mid].push(entry);
    } else {
      uncategorized.push(entry);
    }
  }

  return {
    course: normalizeCourse({ ...course, unitCount: units.length }),
    modules: modules.map((m) => ({
      ...normalizeModule({ ...m, unitCount: (unitsByModule[m._id.toString()] || []).length }),
      units: unitsByModule[m._id.toString()] || [],
    })),
    uncategorizedUnits: uncategorized,
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

export async function dbApplySuggestedModules({ courseId }) {
  await dbConnect();
  const course = await CoursifyCourse.findOne({ _id: courseId, deletedAt: null }).lean();
  if (!course) throw new Error('Course not found.');
  if (!course.outline) throw new Error('No course outline found.');

  const suggestions = parseOutlineToModules(course.outline);
  if (suggestions.length === 0) throw new Error('Could not parse unit titles from outline.');

  const createdModules = [];
  for (const suggestion of suggestions) {
    const newModule = await CoursifyModule.create({
      courseId,
      title: suggestion.title,
      summary: suggestion.summary,
      order: suggestion.order,
    });
    createdModules.push(newModule);

    const unitDocs = suggestion.units.map((title, i) => ({
      courseId,
      moduleId: newModule._id,
      title,
      order: i,
      status: 'planned',
      completionStatus: 'not_started',
    }));
    await CoursifyUnit.insertMany(unitDocs);
  }

  await CoursifyCourse.updateOne({ _id: courseId, deletedAt: null }, { $inc: { syncVersion: 1 } });
  return {
    modulesCreated: createdModules.length,
    moduleIds: createdModules.map((m) => m._id.toString()),
  };
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

export async function dbAddUnitResource({ unitId, resource }) {
  await dbConnect();
  const unit = await CoursifyUnit.findOneAndUpdate(
    { _id: unitId, deletedAt: null },
    { $push: { resources: resource }, $inc: { syncVersion: 1 } },
    { new: true }
  ).lean();
  if (!unit) throw new Error('Unit not found.');
  await CoursifyCourse.updateOne(
    { _id: unit.courseId, deletedAt: null },
    { $inc: { syncVersion: 1 } }
  );
  return { unit: normalizeUnit(unit) };
}

export async function dbDeleteUnits({ ids }) {
  await dbConnect();
  const result = await CoursifyUnit.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  );
  return { deletedCount: result.modifiedCount };
}

export async function dbDeleteModules({ ids }) {
  await dbConnect();
  const result = await CoursifyModule.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
  );
  // Also unassign units
  await CoursifyUnit.updateMany(
    { moduleId: { $in: ids }, deletedAt: null },
    { $set: { moduleId: null }, $inc: { syncVersion: 1 } }
  );
  return { deletedCount: result.modifiedCount };
}

export async function dbGetResearchNotes({ courseId }) {
  await dbConnect();
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
