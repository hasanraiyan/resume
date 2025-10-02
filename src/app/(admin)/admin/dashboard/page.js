import Link from 'next/link';
import { getAllProjects } from '@/app/actions/projectActions';
import { getAllContacts } from '@/app/actions/contactActions';

export default async function AdminDashboard() {
  const [projectsResult, contactsResult] = await Promise.all([
    getAllProjects(),
    getAllContacts()
  ]);

  const totalProjects = projectsResult.projects?.length || 0;
  const featuredProjects = projectsResult.projects?.filter(p => p.featured)?.length || 0;
  const totalContacts = contactsResult.contacts?.length || 0;
  const newContacts = contactsResult.contacts?.filter(c => c.status === 'new')?.length || 0;

  const stats = [
    {
      name: 'Total Projects',
      value: totalProjects,
      link: '/admin/projects',
      color: 'bg-blue-500'
    },
    {
      name: 'Featured Projects',
      value: featuredProjects,
      link: '/admin/projects',
      color: 'bg-green-500'
    },
    {
      name: 'Total Contacts',
      value: totalContacts,
      link: '/admin/contacts',
      color: 'bg-purple-500'
    },
    {
      name: 'New Messages',
      value: newContacts,
      link: '/admin/contacts',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard Overview</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Quick overview of your portfolio content and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.link} className="group">
            <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <dt>
                <div className={`absolute ${stat.color} rounded-md p-3`}>
                  <div className="w-6 h-6 text-white">📊</div>
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </dd>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/projects/new"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">+</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Add New Project</p>
              <p className="text-sm text-gray-500 truncate">Create a new portfolio project</p>
            </div>
          </Link>

          <Link
            href="/admin/projects"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-xl">📂</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Manage Projects</p>
              <p className="text-sm text-gray-500 truncate">View and edit all projects</p>
            </div>
          </Link>

          <Link
            href="/admin/contacts"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-xl">📧</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">View Messages</p>
              <p className="text-sm text-gray-500 truncate">Check contact submissions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
