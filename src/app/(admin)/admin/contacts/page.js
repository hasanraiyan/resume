import { getAllContacts } from '@/app/actions/contactActions';
import { Card, Badge } from '@/components/custom-ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import ContactActions from '@/components/admin/ContactActions';

export default async function ContactsListPage() {
  const result = await getAllContacts();
  const contacts = result.contacts || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-yellow-100 text-yellow-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contacts.map((contact) => (
            <Card
              key={contact._id}
              className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group"
            >
              {/* Contact Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                    <span className="text-white font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black group-hover:text-neutral-700 transition-colors">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-neutral-600">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="tag" className={`${getStatusColor(contact.status)} border-0`}>
                    <i
                      className={`mr-1 ${
                        contact.status === 'new'
                          ? 'fas fa-circle'
                          : contact.status === 'read'
                            ? 'fas fa-eye'
                            : contact.status === 'replied'
                              ? 'fas fa-check'
                              : 'fas fa-archive'
                      }`}
                    ></i>
                    {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                  </Badge>

                  {contact.projectType && (
                    <Badge
                      variant="tag"
                      className="bg-neutral-100 text-neutral-700 border border-neutral-200"
                    >
                      {contact.projectType.replace('-', ' ')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Message */}
              <div className="mb-4">
                <p className="text-neutral-800 leading-relaxed bg-neutral-50 p-3 rounded-lg border-l-4 border-black">
                  "{contact.message}"
                </p>
              </div>

              {/* Contact Meta & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-neutral-500">
                  <span className="flex items-center">
                    <i className="fas fa-calendar-alt mr-1"></i>
                    {new Date(contact.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-clock mr-1"></i>
                    {new Date(contact.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-neutral-600 hover:text-black transition-colors p-2 rounded-lg hover:bg-neutral-100"
                    title="Send email"
                  >
                    <i className="fas fa-envelope"></i>
                  </a>
                  <ContactActions contactId={contact._id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
}
