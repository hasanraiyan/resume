import Link from 'next/link';
import Image from 'next/image';
import { getAllProjects } from '@/app/actions/projectActions';
import { Button, Card, Badge } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Badge as UIBadge } from '@/components/ui';

export default async function ProjectsListPage() {
  const result = await getAllProjects();
  const projects = result.projects || [];

  return (
    <AdminPageWrapper
      title="Projects"
      description="Manage your portfolio projects. Create, edit, and organize your work."
      actionButton={
        <Button href="/admin/projects/new" variant="primary">
          <i className="fas fa-plus mr-2"></i>
          Add Project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-folder text-neutral-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No projects yet</h3>
          <p className="text-neutral-600 mb-8">
            Get started by creating your first portfolio project.
          </p>
          <Button href="/admin/projects/new" variant="primary">
            <i className="fas fa-plus mr-2"></i>
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              {/* Project Image */}
              <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                {project.thumbnail ? (
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-neutral-400 text-2xl"></i>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {project.featured && (
                    <Badge
                      variant="tag"
                      className="bg-yellow-100 text-yellow-800 border border-yellow-200"
                    >
                      <i className="fas fa-star mr-1"></i>
                      Featured
                    </Badge>
                  )}
                  <Badge
                    variant="tag"
                    className={
                      project.status === 'published'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }
                  >
                    <i
                      className={`fas ${project.status === 'published' ? 'fa-check-circle' : 'fa-clock'} mr-1`}
                    ></i>
                    {project.status}
                  </Badge>
                  <Badge
                    variant="tag"
                    className={
                      project.visibility === 'private'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : project.visibility === 'unlisted'
                          ? 'bg-gray-100 text-gray-800 border border-gray-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }
                  >
                    <i
                      className={`fas ${project.visibility === 'private' ? 'fa-lock' : project.visibility === 'unlisted' ? 'fa-eye-slash' : 'fa-globe'} mr-1`}
                    ></i>
                    {project.visibility}
                  </Badge>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      #{project.projectNumber}
                    </p>
                    <h3 className="text-lg font-bold text-black mt-1 group-hover:text-neutral-700 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                </div>

                <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                <div className="flex items-center justify-between">
                  <Badge variant="tag" className="bg-neutral-100 text-neutral-700">
                    {project.category}
                  </Badge>

                  <div className="flex space-x-2">
                    <Button
                      href={`/projects/${project.slug}`}
                      variant="ghost"
                      size="small"
                      external={true}
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                    <Button
                      href={`/admin/projects/${project._id}/edit`}
                      variant="ghost"
                      size="small"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
}
