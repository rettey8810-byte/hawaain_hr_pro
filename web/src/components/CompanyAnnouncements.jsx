import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Megaphone, FileText, Bell, Calendar, Users, CheckCircle, Clock,
  Plus, Edit2, Trash2, Eye, Download, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Search, Filter, Globe, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Company Announcements & Policies Module
 * 
 * Features:
 * - Company-wide announcements
 * - Policy document repository
 * - Version control for policy changes
 * - Read receipts for important notices
 * - Categories: HR, Finance, Operations, General
 */

const ANNOUNCEMENT_CATEGORIES = [
  { id: 'general', name: 'General', color: 'bg-blue-100 text-blue-800' },
  { id: 'hr', name: 'HR & People', color: 'bg-green-100 text-green-800' },
  { id: 'finance', name: 'Finance', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'operations', name: 'Operations', color: 'bg-purple-100 text-purple-800' },
  { id: 'emergency', name: 'Emergency', color: 'bg-red-100 text-red-800' }
];

const POLICY_CATEGORIES = [
  { id: 'employee_handbook', name: 'Employee Handbook' },
  { id: 'leave_policy', name: 'Leave Policy' },
  { id: 'code_of_conduct', name: 'Code of Conduct' },
  { id: 'dress_code', name: 'Dress Code' },
  { id: 'it_policy', name: 'IT & Security Policy' },
  { id: 'health_safety', name: 'Health & Safety' },
  { id: 'anti_harassment', name: 'Anti-Harassment' },
  { id: 'disciplinary', name: 'Disciplinary Policy' },
  { id: 'travel_policy', name: 'Travel Policy' },
  { id: 'expense_policy', name: 'Expense Policy' }
];

export default function CompanyAnnouncements() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('announcement');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());
  const [readReceipts, setReadReceipts] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    status: 'draft',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    requireAcknowledgment: false,
    attachments: []
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      
      // Fetch announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnap = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData);

      // Fetch policies
      const policiesQuery = query(
        collection(db, 'policies'),
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc')
      );
      const policiesSnap = await getDocs(policiesQuery);
      const policiesData = policiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPolicies(policiesData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load announcements and policies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const announcementData = {
        ...formData,
        authorId: userData.uid,
        authorName: userData.name,
        authorRole: userData.role,
        companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        readBy: [],
        acknowledgedBy: []
      };

      await addDoc(collection(db, 'announcements'), announcementData);
      toast.success(formData.status === 'draft' ? 'Draft saved' : 'Announcement published');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      const policyData = {
        ...formData,
        version: '1.0',
        authorId: userData.uid,
        authorName: userData.name,
        companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        acknowledgedBy: []
      };

      await addDoc(collection(db, 'policies'), policyData);
      toast.success('Policy document created');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement) return;

      const readBy = announcement.readBy || [];
      if (!readBy.includes(userData.uid)) {
        readBy.push(userData.uid);
        await updateDoc(doc(db, 'announcements', announcementId), {
          readBy,
          updatedAt: Timestamp.now()
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleAcknowledge = async (itemId, type) => {
    try {
      const collectionName = type === 'announcement' ? 'announcements' : 'policies';
      const item = type === 'announcement' 
        ? announcements.find(a => a.id === itemId)
        : policies.find(p => p.id === itemId);
      
      if (!item) return;

      const acknowledgedBy = item.acknowledgedBy || [];
      if (!acknowledgedBy.find(a => a.userId === userData.uid)) {
        acknowledgedBy.push({
          userId: userData.uid,
          userName: userData.name,
          acknowledgedAt: Timestamp.now()
        });
        await updateDoc(doc(db, collectionName, itemId), {
          acknowledgedBy,
          updatedAt: Timestamp.now()
        });
        toast.success('Acknowledged successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error acknowledging:', error);
      toast.error('Failed to acknowledge');
    }
  };

  const handleDelete = async (itemId, type) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const collectionName = type === 'announcement' ? 'announcements' : 'policies';
      await deleteDoc(doc(db, collectionName, itemId));
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      status: 'draft',
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      requireAcknowledgment: false,
      attachments: []
    });
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const getReadCount = (item) => {
    return (item.readBy || []).length;
  };

  const getAcknowledgedCount = (item) => {
    return (item.acknowledgedBy || []).length;
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPolicies = policies.filter(p => {
    return p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.content?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Announcements & Policies</h2>
          </div>
          <p className="text-gray-600 mt-1">Company communications and policy documents</p>
        </div>
        {hasAccess('settings', 'create') && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModalType('announcement');
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
            <button
              onClick={() => {
                setModalType('policy');
                setShowModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              New Policy
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === 'announcements' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Bell className="h-4 w-4" />
              Announcements
              <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                {announcements.filter(a => a.status === 'active').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                activeTab === 'policies' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Policies
              <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                {policies.length}
              </span>
            </button>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {activeTab === 'announcements' && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {ANNOUNCEMENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const isExpanded = expandedAnnouncements.has(announcement.id);
            const isRead = (announcement.readBy || []).includes(userData.uid);
            const isAcknowledged = (announcement.acknowledgedBy || []).find(a => a.userId === userData.uid);
            const category = ANNOUNCEMENT_CATEGORIES.find(c => c.id === announcement.category);
            
            return (
              <div 
                key={announcement.id} 
                className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
                  !isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${category?.color || 'bg-gray-100'}`}>
                        {category?.name || announcement.category}
                      </span>
                      {announcement.priority === 'urgent' && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {announcement.createdAt?.toDate?.().toLocaleDateString?.() || announcement.publishDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      {hasAccess('settings', 'edit') && (
                        <>
                          <button
                            onClick={() => handleDelete(announcement.id, 'announcement')}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                  
                  <div className={`text-gray-600 ${isExpanded ? '' : 'line-clamp-3'}`}>
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </div>

                  {announcement.content?.length > 200 && (
                    <button
                      onClick={() => toggleExpand(announcement.id)}
                      className="text-blue-600 text-sm mt-2 hover:underline"
                    >
                      {isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {getReadCount(announcement)} read
                      </span>
                      {announcement.requireAcknowledgment && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {getAcknowledgedCount(announcement)} acknowledged
                        </span>
                      )}
                      <span>By {announcement.authorName}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!isRead && (
                        <button
                          onClick={() => handleMarkAsRead(announcement.id)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Mark as Read
                        </button>
                      )}
                      {announcement.requireAcknowledgment && !isAcknowledged && (
                        <button
                          onClick={() => handleAcknowledge(announcement.id, 'announcement')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      {isAcknowledged && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No announcements found</p>
            </div>
          )}
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPolicies.map((policy) => {
            const category = POLICY_CATEGORIES.find(c => c.id === policy.category);
            const isAcknowledged = (policy.acknowledgedBy || []).find(a => a.userId === userData.uid);
            
            return (
              <div key={policy.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      {category?.name || policy.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    v{policy.version || '1.0'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{policy.content}</p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Updated {policy.updatedAt?.toDate?.().toLocaleDateString?.() || 'Recently'}
                  </div>
                  
                  <div className="flex gap-2">
                    {policy.requireAcknowledgment && !isAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(policy.id, 'policy')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Acknowledge
                      </button>
                    )}
                    {isAcknowledged && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Acknowledged
                      </span>
                    )}
                    <button className="text-blue-600 hover:underline text-sm">
                      View Full Policy
                    </button>
                  </div>
                </div>
                
                {hasAccess('settings', 'edit') && (
                  <div className="mt-3 pt-3 border-t flex justify-end gap-2">
                    <span className="text-sm text-gray-500">
                      {getAcknowledgedCount(policy)} of {announcements.length > 0 ? announcements[0].readBy?.length || 0 : 0} acknowledged
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredPolicies.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No policies found</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {modalType === 'announcement' ? 'Create Announcement' : 'Create Policy'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form 
              onSubmit={modalType === 'announcement' ? handleCreateAnnouncement : handleCreatePolicy} 
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {modalType === 'announcement' ? (
                    ANNOUNCEMENT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    POLICY_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  )}
                </select>
              </div>

              {modalType === 'announcement' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                    <input
                      type="date"
                      value={formData.publishDate}
                      onChange={(e) => setFormData({...formData, publishDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="6"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={modalType === 'announcement' 
                    ? "Enter announcement details..." 
                    : "Enter policy content..."}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireAcknowledgment"
                  checked={formData.requireAcknowledgment}
                  onChange={(e) => setFormData({...formData, requireAcknowledgment: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="requireAcknowledgment" className="text-sm text-gray-700">
                  Require employee acknowledgment
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setFormData({...formData, status: 'draft'})}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setFormData({...formData, status: 'active'})}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalType === 'announcement' ? 'Publish' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
