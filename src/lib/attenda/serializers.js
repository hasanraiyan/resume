// @/lib/attenda/serializers.js
// Convert Mongoose documents to plain objects for API responses.

export function serializeSemester(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  delete obj.__v;
  delete obj.deletedAt;
  delete obj.syncVersion;
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();
  return obj;
}

export function serializeSubject(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  obj.semesterId = obj.semesterId?.toString();
  delete obj.__v;
  delete obj.deletedAt;
  delete obj.syncVersion;
  return obj;
}

export function serializeDay(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  obj.semesterId = obj.semesterId?.toString();
  if (obj.lectures) {
    obj.lectures = obj.lectures.map((lec) => ({
      ...lec,
      id: lec._id?.toString(),
      _id: undefined,
      subjectId: lec.subjectId?.toString(),
    }));
  }
  delete obj.__v;
  delete obj.deletedAt;
  delete obj.syncVersion;
  return obj;
}

export function serializeTimetable(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  obj.semesterId = obj.semesterId?.toString();
  if (obj.days) {
    obj.days = obj.days.map((day) => ({
      ...day,
      slots: (day.slots || []).map((slot) => ({
        ...slot,
        id: slot._id?.toString(),
        _id: undefined,
        subjectId: slot.subjectId?.toString(),
      })),
    }));
  }
  delete obj.__v;
  delete obj.deletedAt;
  delete obj.syncVersion;
  return obj;
}

export function serializeHoliday(doc) {
  if (!doc) return null;
  const obj = { ...doc };
  obj.id = obj._id?.toString();
  obj.semesterId = obj.semesterId?.toString();
  delete obj.__v;
  delete obj.deletedAt;
  delete obj.syncVersion;
  return obj;
}
