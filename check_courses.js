import dbConnect from './src/lib/dbConnect.js';
import CoursifyCourse from './src/models/CoursifyCourse.js';

async function check() {
  await dbConnect();
  const courses = await CoursifyCourse.find({ deletedAt: null }).limit(5);
  console.log(JSON.stringify(courses.map(c => ({ id: c._id, slug: c.slug, title: c.title }))));
  process.exit(0);
}

check();
