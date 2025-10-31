'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import Link from 'next/link';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('skills');

  // Mock data for demonstration - in a real app, this would come from APIs
  const [data, setData] = useState({
    skills: [],
    technologies: [],
    certifications: [],
  });

  const tabs = [
    { id: 'skills', label: 'Skills', count: data.skills.length, href: '/admin/skills' },
    {
      id: 'technologies',
      label: 'Technologies',
      count: data.technologies.length,
      href: '/admin/technologies',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      count: data.certifications.length,
      href: '/admin/certifications',
    },
  ];

  return (
    <AdminPageWrapper
      title="Skills & Portfolio Management"
      description="Manage your technical skills, technologies, and professional certifications."
    >
      <div className="space-y-6">
        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tabs.map((tab) => (
            <Card key={tab.id} className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tab.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {tab.count} item{tab.count !== 1 ? 's' : ''} configured
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-3">
                    {tab.count}
                  </Badge>
                  <br />
                  <Link href={tab.href}>
                    <Button variant="primary" size="sm">
                      Manage {tab.label}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Information Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Manage Your Skills Portfolio
              </h3>
              <p className="text-blue-800 mb-4">
                Your skills, technologies, and certifications are what showcase your expertise to
                potential clients and employers. Keep this section updated to reflect your current
                capabilities and achievements.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <i className="fas fa-code text-blue-600 mr-2"></i>
                  <strong>Skills:</strong> Technical proficiencies and expertise levels
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <i className="fas fa-cogs text-blue-600 mr-2"></i>
                  <strong>Technologies:</strong> Tools, frameworks, and platforms you use
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <i className="fas fa-certificate text-blue-600 mr-2"></i>
                  <strong>Certifications:</strong> Professional credentials and achievements
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{data.skills.length}</div>
            <div className="text-gray-600">Skills Listed</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{data.technologies.length}</div>
            <div className="text-gray-600">Technologies</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.certifications.length}
            </div>
            <div className="text-gray-600">Certifications</div>
          </Card>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
