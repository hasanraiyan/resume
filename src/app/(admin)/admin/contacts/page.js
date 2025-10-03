import { getAllContacts } from '@/app/actions/contactActions';
import { Card, Badge } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import ContactActions from '@/components/admin/ContactActions';

export default async function ContactsListPage() {
  const result = await getAllContacts();
  const contacts = result.contacts || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminPageWrapper
      title="Contact Messages"
      description="Messages submitted through the contact form on your portfolio. Manage and respond to client inquiries."
    >

      {contacts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-envelope text-neutral-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">No messages yet</h3>
          <p className="text-neutral-600">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact._id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-transparent hover:border-l-black">
              <div className="flex items-start justify-between">
                
                {/* Contact Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-black">{contact.name}</h3>
                      <p className="text-sm text-neutral-600">{contact.email}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-neutral-800 leading-relaxed">"{contact.message}"</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <span className="flex items-center">
                      <i className="fas fa-calendar-alt mr-1"></i>
                      {new Date(contact.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(contact.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Status & Actions */}
                <div className="flex flex-col items-end space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="tag" 
                      className={`${getStatusColor(contact.status)} border-0`}
                    >
                      <i className={`mr-1 ${
                        contact.status === 'new' ? 'fas fa-circle' :
                        contact.status === 'read' ? 'fas fa-eye' :
                        contact.status === 'replied' ? 'fas fa-check' :
                        'fas fa-archive'
                      }`}></i>
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </Badge>
                    
                    {contact.projectType && (
                      <Badge variant="tag" className="bg-neutral-100 text-neutral-700">
                        {contact.projectType.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-neutral-600 hover:text-black transition-colors p-2"
                      title="Send email"
                    >
                      <i className="fas fa-envelope"></i>
                    </a>
                    <ContactActions contactId={contact._id} />
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
