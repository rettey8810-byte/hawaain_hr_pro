import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

// Default Maldives Public Holidays 2026
const DEFAULT_MALDIVES_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: "New Year's Day", type: 'Public Holiday' },
  { date: '2026-02-05', name: 'Majlis Presidential Address', type: 'Government Holiday' },
  { date: '2026-02-18', name: 'Ramadan Start', type: 'Public Holiday' },
  { date: '2026-03-09', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-10', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-11', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-12', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-13', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-14', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-15', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-16', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-17', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-18', name: 'Ramadan Holiday', type: 'Government Holiday' },
  { date: '2026-03-20', name: 'Eid-ul-Fithr', type: 'Public Holiday' },
  { date: '2026-03-21', name: 'Eid-ul-Fithr Holiday', type: 'Public Holiday' },
  { date: '2026-03-22', name: 'Eid-ul-Fithr Holiday', type: 'Public Holiday' },
  { date: '2026-05-01', name: 'Labor Day', type: 'Public Holiday' },
  { date: '2026-05-26', name: 'Hajj Day', type: 'Public Holiday', note: 'Tentative Date' },
  { date: '2026-05-27', name: "Eid-ul Al'haa", type: 'Public Holiday', note: 'Tentative Date' },
  { date: '2026-05-28', name: "Eid-ul Al'haa Holiday", type: 'Bank and Government Holiday' },
  { date: '2026-05-29', name: "Eid-ul Al'haa Holiday", type: 'Bank and Government Holiday' },
  { date: '2026-05-30', name: "Eid-ul Al'haa Holiday", type: 'Bank and Government Holiday' },
  { date: '2026-06-17', name: 'Muharram', type: 'Public Holiday', note: 'Tentative Date' },
  { date: '2026-07-26', name: 'Independence Day', type: 'Public Holiday' },
  { date: '2026-07-27', name: 'Independence Day Holiday', type: 'Public Holiday' },
  { date: '2026-08-14', name: 'National Day', type: 'Public Holiday' },
  { date: '2026-08-26', name: 'Milad un Nabi', type: 'Public Holiday', note: 'Tentative Date' },
  { date: '2026-09-14', name: 'The Day Maldives Embraced Islam', type: 'Public Holiday', note: 'Tentative Date' },
  { date: '2026-11-03', name: 'Victory Day', type: 'Public Holiday' },
  { date: '2026-11-11', name: 'Republic Day', type: 'Public Holiday' },
];

export default function PublicHolidays() {
  const { isHR } = useAuth();
  const { companyId } = useCompany();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '', type: 'Public Holiday', note: '' });

  // Fetch holidays from Firestore
  useEffect(() => {
    const fetchHolidays = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'publicHolidays'),
          where('companyId', '==', companyId),
          where('year', '==', 2026)
        );
        const snap = await getDocs(q);
        const holidayList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // If no holidays found, use defaults
        if (holidayList.length === 0) {
          setHolidays(DEFAULT_MALDIVES_HOLIDAYS_2026.map(h => ({ ...h, year: 2026 })));
        } else {
          setHolidays(holidayList);
        }
      } catch (err) {
        console.error('Error fetching holidays:', err);
        setHolidays(DEFAULT_MALDIVES_HOLIDAYS_2026.map(h => ({ ...h, year: 2026 })));
      } finally {
        setLoading(false);
      }
    };
    
    fetchHolidays();
  }, [companyId]);

  const handleAddHoliday = async () => {
    if (!formData.date || !formData.name) return;
    
    try {
      const newHoliday = {
        ...formData,
        year: 2026,
        companyId,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'publicHolidays'), newHoliday);
      setHolidays([...holidays, { id: docRef.id, ...newHoliday }]);
      setShowAddModal(false);
      setFormData({ date: '', name: '', type: 'Public Holiday', note: '' });
    } catch (err) {
      console.error('Error adding holiday:', err);
    }
  };

  const handleUpdateHoliday = async () => {
    if (!editingHoliday) return;
    
    try {
      // If holiday has no ID (default holiday), add it as new
      if (!editingHoliday.id) {
        const newHoliday = {
          ...editingHoliday,
          year: 2026,
          companyId,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'publicHolidays'), newHoliday);
        setHolidays([...holidays, { id: docRef.id, ...newHoliday }]);
      } else {
        // Update existing holiday
        await updateDoc(doc(db, 'publicHolidays', editingHoliday.id), editingHoliday);
        setHolidays(holidays.map(h => h.id === editingHoliday.id ? editingHoliday : h));
      }
      setEditingHoliday(null);
    } catch (err) {
      console.error('Error updating holiday:', err);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      await deleteDoc(doc(db, 'publicHolidays', id));
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting holiday:', err);
    }
  };

  // Get today's date for highlighting
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate upcoming holidays
  const upcomingHolidays = holidays
    .filter(h => h.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">📅 Public Holidays 2026</h2>
          <p className="mt-1 text-sm text-white/80">Maldives Public Holidays and Special Days</p>
        </div>
        {isHR?.() && (
          <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-600 shadow-lg hover:bg-gray-50 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Holiday
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Holidays Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {upcomingHolidays.map((holiday, idx) => {
          const daysLeft = calculateDaysRemaining(holiday.date);
          const isToday = holiday.date === today;
          
          return (
            <div 
              key={idx} 
              className={`rounded-2xl p-4 shadow-lg transform hover:scale-105 transition-all ${
                isToday 
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
                  : daysLeft <= 7 
                    ? 'bg-gradient-to-br from-rose-400 to-red-500 text-white'
                    : 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
              }`}
            >
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-lg mr-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80 font-medium truncate max-w-[120px]">{holiday.name}</p>
                  <p className="text-lg font-bold">{formatDate(holiday.date)}</p>
                  <p className="text-xs text-white/70">
                    {isToday ? 'Today!' : daysLeft > 0 ? `${daysLeft} days left` : 'Passed'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Holidays Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase">Day</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase">Holiday Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase">Status</th>
                {isHR?.() && <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {holidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map((holiday) => {
                const daysLeft = calculateDaysRemaining(holiday.date);
                const isToday = holiday.date === today;
                const dayName = new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' });
                
                return (
                  <tr 
                    key={holiday.id || holiday.date} 
                    className={`hover:bg-emerald-50/50 transition-colors ${isToday ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(holiday.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {dayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {holiday.name}
                      {holiday.note && <span className="ml-2 text-xs text-gray-500">({holiday.note})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        holiday.type === 'Public Holiday' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : holiday.type === 'Government Holiday'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {holiday.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isToday ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Today</span>
                      ) : daysLeft > 0 ? (
                        <span className="text-emerald-600 font-medium">{daysLeft} days left</span>
                      ) : (
                        <span className="text-gray-400">Passed</span>
                      )}
                    </td>
                    {isHR?.() && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingHoliday(holiday)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingHoliday) && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editingHoliday?.date || formData.date}
                  onChange={(e) => editingHoliday 
                    ? setEditingHoliday({...editingHoliday, date: e.target.value})
                    : setFormData({...formData, date: e.target.value})
                  }
                  className="block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={editingHoliday?.name || formData.name}
                  onChange={(e) => editingHoliday
                    ? setEditingHoliday({...editingHoliday, name: e.target.value})
                    : setFormData({...formData, name: e.target.value})
                  }
                  className="block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="e.g., New Year's Day"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editingHoliday?.type || formData.type}
                  onChange={(e) => editingHoliday
                    ? setEditingHoliday({...editingHoliday, type: e.target.value})
                    : setFormData({...formData, type: e.target.value})
                  }
                  className="block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Government Holiday">Government Holiday</option>
                  <option value="Bank and Government Holiday">Bank and Government Holiday</option>
                  <option value="Season">Season</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={editingHoliday?.note || formData.note}
                  onChange={(e) => editingHoliday
                    ? setEditingHoliday({...editingHoliday, note: e.target.value})
                    : setFormData({...formData, note: e.target.value})
                  }
                  className="block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-2 focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="e.g., Tentative Date"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingHoliday(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 inline mr-1" />
                Cancel
              </button>
              <button
                onClick={editingHoliday ? handleUpdateHoliday : handleAddHoliday}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg transition-colors"
              >
                <Save className="h-4 w-4 inline mr-1" />
                {editingHoliday ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
