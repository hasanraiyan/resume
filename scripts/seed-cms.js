require('dotenv').config();
const mongoose = require('mongoose');

// Define temporary schemas for seeding
const TechnologySchema = new mongoose.Schema({
  name: { type: String, required: true },
  iconType: { type: String, required: true, enum: ['fa', 'lucide'] },
  iconName: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true },
  url: { type: String, required: true },
  iconType: { type: String, required: true, enum: ['fa', 'lucide'] },
  iconName: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const SiteConfigSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Portfolio' },
  ownerName: { type: String, default: 'Admin' },
  isActive: { type: Boolean, default: true },
});

const ContactSectionSchema = new mongoose.Schema({
  title: { type: String, default: "Let's Build." },
  isActive: { type: Boolean, default: true },
});

const Technology = mongoose.models.Technology || mongoose.model('Technology', TechnologySchema);
const Certification =
  mongoose.models.Certification || mongoose.model('Certification', CertificationSchema);
const SiteConfig = mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);
const ContactSection =
  mongoose.models.ContactSection || mongoose.model('ContactSection', ContactSectionSchema);

const skillsData = [
  { name: 'JavaScript', iconType: 'fa', iconName: 'faCode' },
  { name: 'TypeScript', iconType: 'fa', iconName: 'faCode' },
  { name: 'React', iconType: 'fa', iconName: 'faReact' },
  { name: 'React Native', iconType: 'fa', iconName: 'faReact' },
  { name: 'Node.js', iconType: 'fa', iconName: 'faNodeJs' },
  { name: 'Express.js', iconType: 'fa', iconName: 'faServer' },
  { name: 'Next.js', iconType: 'lucide', iconName: 'Server' },
  { name: 'MongoDB', iconType: 'fa', iconName: 'faMdb' },
  { name: 'Expo', iconType: 'lucide', iconName: 'Code' },
];

const technologies = [
  { name: 'Python', iconType: 'fa', iconName: 'faPython' },
  { name: 'Git', iconType: 'fa', iconName: 'faGitAlt' },
  { name: 'Vercel', iconType: 'lucide', iconName: 'Server' },
  { name: 'Tailwind CSS', iconType: 'fa', iconName: 'faCss3' },
  { name: 'LLM', iconType: 'lucide', iconName: 'Code' },
  { name: 'MERN Stack', iconType: 'lucide', iconName: 'Code' },
  { name: 'OpenAI', iconType: 'lucide', iconName: 'Code' },
  { name: 'Gemini', iconType: 'lucide', iconName: 'Code' },
  { name: 'Generative AI', iconType: 'lucide', iconName: 'Code' },
  { name: 'React Query', iconType: 'lucide', iconName: 'Zap' },
  { name: 'Framer Motion', iconType: 'lucide', iconName: 'Layers' },
  { name: 'Firebase', iconType: 'fa', iconName: 'faServer' },
  { name: 'Supabase', iconType: 'fa', iconName: 'faDatabase' },
];

const certifications = [
  {
    name: 'Programming Essentials in Python',
    issuer: 'Cisco Networking Academy',
    date: '2024',
    iconType: 'fa',
    iconName: 'faPython',
    url: 'https://www.linkedin.com/in/hasanraiyan/',
  },
  {
    name: 'Solutions Arch. Job Simulation',
    issuer: 'Forage',
    date: 'Sep 2025',
    iconType: 'fa',
    iconName: 'faAws',
    url: 'https://www.theforage.com/',
  },
  {
    name: 'Introduction to Cybersecurity',
    issuer: 'Cisco Networking Academy',
    date: '2024',
    iconType: 'fa',
    iconName: 'faShieldAlt',
    url: 'https://www.linkedin.com/in/hasanraiyan/',
  },
  {
    name: 'Python (Basic)',
    issuer: 'HackerRank',
    date: '2024',
    iconType: 'fa',
    iconName: 'faPython',
    url: 'https://www.hackerrank.com/certificates/bb25b2ccfbf1',
  },
  {
    name: 'SQL (Basic)',
    issuer: 'HackerRank',
    date: '2024',
    iconType: 'fa',
    iconName: 'faDatabase',
    url: 'https://www.hackerrank.com/certificates/96328a48b49a',
  },
];

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean existing data if any (optional, but good for idempotency)
    // await Technology.deleteMany({});
    // await Certification.deleteMany({});

    console.log('Seeding technologies...');
    const allTech = [...skillsData, ...technologies].map((t, i) => ({ ...t, displayOrder: i }));
    for (const tech of allTech) {
      await Technology.findOneAndUpdate({ name: tech.name }, tech, { upsert: true });
    }

    console.log('Seeding certifications...');
    for (const [i, cert] of certifications.entries()) {
      await Certification.findOneAndUpdate(
        { name: cert.name },
        { ...cert, displayOrder: i },
        { upsert: true }
      );
    }

    console.log('Initializing SiteConfig...');
    await SiteConfig.findOneAndUpdate(
      { isActive: true },
      {
        siteName: 'Portfolio',
        ownerName: 'Admin',
        tagline: 'Digital Excellence',
        seo: {
          description: 'Modern portfolio showcase.',
          keywords: ['Developer', 'Portfolio'],
        },
      },
      { upsert: true }
    );

    console.log('Initializing ContactSection...');
    await ContactSection.findOneAndUpdate(
      { isActive: true },
      {
        title: "Let's Build.",
        subtitle: 'Something Amazing',
        description: 'Turning complex requirements into elegant, functional software.',
      },
      { upsert: true }
    );

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
