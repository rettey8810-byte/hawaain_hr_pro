import { useState } from 'react';
import { Book, Search, MessageCircle, Mail, FileText, Video, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I add a new employee?",
      answer: "Go to the Employees page and click the 'Add Employee' button. Fill in the required information including personal details, department, and position. You can also upload documents like passport, visa, and work permit."
    },
    {
      id: 2,
      question: "How does the document expiry alert system work?",
      answer: "The system automatically tracks expiry dates for passports, visas, work permits, and medical records. You'll receive alerts at 90, 60, and 30 days before expiry. Expired documents are highlighted in red on the dashboard."
    },
    {
      id: 3,
      question: "How do I renew an expired document?",
      answer: "Go to the Renewals page and create a new renewal workflow. The system guides you through 5 steps: Alert, HR Notification, Renewal Start, Document Upload, and Status Update."
    },
    {
      id: 4,
      question: "Can I export employee data?",
      answer: "Yes! Go to the Reports page, select the report type you need, and click the 'Export CSV' button. You can export employee lists, expiring documents, and renewal status reports."
    },
    {
      id: 5,
      question: "How do I manage user permissions?",
      answer: "HR and Admin users can access User Management from the sidebar. Here you can add new users, assign roles (Staff, HR, Admin), and deactivate accounts when needed."
    },
    {
      id: 6,
      question: "What are the different user roles?",
      answer: "Staff can view their own profile and documents. HR can manage employees and documents. Admin has full access including user management. Super Admin can manage multiple companies."
    },
    {
      id: 7,
      question: "How do I use the Global Search feature?",
      answer: "Click on Global Search in the sidebar or navigation menu. You can search across employees, passports, visas, work permits, and medical records. Use filters to narrow down results."
    },
    {
      id: 8,
      question: "Can I customize notification settings?",
      answer: "Yes, go to Settings and select Notification Settings. You can enable/disable email notifications, set which expiry alerts you want to receive (90, 60, 30 days), and configure other preferences."
    }
  ];

  const resources = [
    { title: "Getting Started Guide", icon: Book, description: "Learn the basics of Hawaain HR Pro", link: "#" },
    { title: "Video Tutorials", icon: Video, description: "Watch step-by-step video guides", link: "#" },
    { title: "API Documentation", icon: FileText, description: "Technical documentation for developers", link: "#" },
    { title: "Contact Support", icon: Mail, description: "Get help from our support team", link: "#" },
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Help & Support</h2>
        <p className="mt-1 text-sm text-gray-500">Find answers and get support</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 border pl-10 pr-3 py-3 text-base focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quick Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource, index) => (
          <a
            key={index}
            href={resource.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <resource.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t bg-gray-50">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No FAQs found matching your search
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Need more help?</h3>
            <p className="text-blue-100 mt-1">Our support team is here to assist you</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <a
              href="mailto:support@hawaainhr.com"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </a>
            <a
              href="#"
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Live Chat
            </a>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-gray-400">
        <p>Hawaain HR Pro v1.0.0</p>
        <p className="mt-1">© 2026 Hawaain HR Pro. All rights reserved.</p>
      </div>
    </div>
  );
}
