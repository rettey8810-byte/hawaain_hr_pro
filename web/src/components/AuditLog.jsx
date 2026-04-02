import { useState, useEffect } from 'react';
import { ClipboardList, Download, Filter, Calendar, User, FileText } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate } from '../utils/helpers';

export default function AuditLog() {
  const { companyId } = useCompany();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [loading, setLoading] = useState(true);

  // Simulated audit logs - in production, this would be a separate collection
  useEffect(() => {
    // Generate sample audit logs for demonstration
    const sampleLogs = [
      { id: '1', action: 'CREATE', entity: 'Employee', entityId: 'emp123', user: 'John Doe', userId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), details: 'Created new employee: Jane Smith' },
      { id: '2', action: 'UPDATE', entity: 'Passport', entityId: 'pass456', user: 'Jane Doe', userId: 'user2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), details: 'Updated expiry date for passport' },
      { id: '3', action: 'DELETE', entity: 'Visa', entityId: 'visa789', user: 'Admin User', userId: 'user3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), details: 'Deleted expired visa record' },
      { id: '4', action: 'LOGIN', entity: 'User', entityId: 'user1', user: 'John Doe', userId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), details: 'User logged in' },
      { id: '5', action: 'EXPORT', entity: 'Report', entityId: 'report001', user: 'HR Manager', userId: 'user4', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), details: 'Exported employee report' },
      { id: '6', action: 'UPDATE', entity: 'Work Permit', entityId: 'permit321', user: 'Jane Doe', userId: 'user2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), details: 'Renewed work permit' },
      { id: '7', action: 'CREATE', entity: 'Medical', entityId: 'med654', user: 'John Doe', userId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), details: 'Added medical test record' },
    ];
    
    setLogs(sampleLogs);
    setLoading(false);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.action !== filter) return false;
    const logDate = new Date(log.timestamp);
    const cutoffDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    return logDate >= cutoffDate;
  });

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      EXPORT: 'bg-yellow-100 text-yellow-800',
      VIEW: 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Details'].join(','),
      ...filteredLogs.map(log => [
        formatDate(log.timestamp),
        log.user,
        log.action,
        log.entity,
        log.entityId,
        log.details
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${formatDate(new Date())}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">Audit Log</h2>
          <p className="mt-1 text-sm text-gray-500">Track all system activities and changes</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Action Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 border px-3 py-2"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="EXPORT">Export</option>
            </select>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-md border-gray-300 border px-3 py-2"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                    <div className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{log.user}</div>
                        <div className="text-xs text-gray-500">ID: {log.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FileText className="h-4 w-4 mr-1 text-gray-400" />
                      {log.entity}
                    </div>
                    <div className="text-xs text-gray-500">{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No audit logs found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
