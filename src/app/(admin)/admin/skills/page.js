import { getAllSkills } from '@/app/actions/skillActions';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
import Link from 'next/link';

export default async function SkillsPage() {
  console.log('📋 [ADMIN SKILLS PAGE] Loading skills admin page...');
  const skills = await getAllSkills();
  console.log('📊 [ADMIN SKILLS PAGE] Skills loaded:', skills.length);

  return (
    <AdminPageWrapper
      title="Skills"
      description="Manage your technical skills and expertise levels."
      actionButton={
        <Button href="/admin/skills/new" variant="primary">
          <i className="fas fa-plus mr-2"></i> Add Skill
        </Button>
      }
    >
      <div className="space-y-4">
        {skills.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-code text-neutral-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No skills yet</h3>
            <p className="text-neutral-600 mb-8">
              Get started by creating your first technical skill.
            </p>
            <Button href="/admin/skills/new" variant="primary">
              <i className="fas fa-plus mr-2"></i>
              Create First Skill
            </Button>
          </div>
        ) : (
          skills.map((skill) => {
            console.log('🔲 [ADMIN SKILLS PAGE] Rendering skill card:', skill.name);
            return (
              <Card key={skill._id} className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-code text-neutral-600"></i>
                  </div>
                  <div>
                    <p className="font-bold">{skill.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-neutral-600">Level: {skill.level}%</span>
                      <Badge variant={skill.isActive ? 'success' : 'secondary'}>
                        {skill.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-500">Order: {skill.displayOrder}</span>
                  <Link href={`/admin/skills/${skill._id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      // This would be handled by a delete action
                    }}
                    className="inline"
                  >
                    <Button
                      variant="danger"
                      size="sm"
                      type="submit"
                      onClick={(e) => {
                        if (!confirm('Are you sure you want to delete this skill?')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </AdminPageWrapper>
  );
}
