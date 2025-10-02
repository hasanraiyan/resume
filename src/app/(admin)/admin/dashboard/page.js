import Link from 'next/link';
import { getAllProjects } from '@/app/actions/projectActions';
import { getAllContacts } from '@/app/actions/contactActions';
import { Button, Card } from '@/components/ui';

function getStatIcon(statName) {
  switch (statName) {
    case 'Total Projects': return 'fas fa-folder';
    case 'Featured Projects': return 'fas fa-star';
    case 'Total Contacts': return 'fas fa-envelope';
    case 'New Messages': return 'fas fa-bell';
    default: return 'fas fa-chart-bar';
  }
}

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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-neutral-200 pb-6">
        <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-neutral-600 text-lg">
          Quick overview of your portfolio content and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.link} className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                  <i className={`text-white ${getStatIcon(stat.name)}`}></i>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <Link href="/admin/projects/new" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-black group-hover:text-white">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                  <i className="fas fa-plus text-white group-hover:text-black text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-white mb-1">Add New Project</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-300">Create a new portfolio project</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/projects" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-900 group-hover:text-white">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-100 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                  <i className="fas fa-folder text-neutral-600 group-hover:text-black text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-white mb-1">Manage Projects</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-300">View and edit all projects</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/contacts" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-900 group-hover:text-white">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-100 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                  <i className="fas fa-envelope text-neutral-600 group-hover:text-black text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-white mb-1">View Messages</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-300">Check contact submissions</p>
                </div>
              </div>
            </Card>
          </Link>
          
        </div>
      </div>
    </div>
  );
}
