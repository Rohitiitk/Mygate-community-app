import { useState, useEffect } from 'react';
import { visitorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, UserCheck, UserX } from 'lucide-react';

export default function VisitorList() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { isGuard, isAdmin } = useAuth();

  useEffect(() => {
    fetchVisitors();
  }, [filter]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await visitorsAPI.getAll(status);
      setVisitors(response.data.visitors);
    } catch (error) {
      toast.error('Failed to load visitors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (visitorId) => {
    try {
      await visitorsAPI.approve(visitorId);
      toast.success('Visitor approved');
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve visitor');
    }
  };

  const handleDeny = async (visitorId) => {
    const reason = prompt('Reason for denial (optional):');
    try {
      await visitorsAPI.deny(visitorId, reason);
      toast.success('Visitor denied');
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to deny visitor');
    }
  };

  const handleCheckIn = async (visitorId) => {
    try {
      await visitorsAPI.checkIn(visitorId);
      toast.success('Visitor checked in');
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to check in visitor');
    }
  };

  const handleCheckOut = async (visitorId) => {
    try {
      await visitorsAPI.checkOut(visitorId);
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to check out visitor');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      checked_in: 'bg-blue-100 text-blue-800',
      checked_out: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      denied: <XCircle className="w-4 h-4" />,
      checked_in: <UserCheck className="w-4 h-4" />,
      checked_out: <UserX className="w-4 h-4" />
    };
    return icons[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'checked_in', 'checked_out'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Visitors List */}
      {visitors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No visitors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visitors.map((visitor) => (
            <div
              key={visitor.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {visitor.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        visitor.status
                      )}`}
                    >
                      {getStatusIcon(visitor.status)}
                      {visitor.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📞 {visitor.phone}</p>
                    <p>📝 {visitor.purpose}</p>
                    {visitor.scheduledTime && (
                      <p>🕒 {new Date(visitor.scheduledTime).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {visitor.status === 'pending' && !isGuard() && (
                    <>
                      <button
                        onClick={() => handleApprove(visitor.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(visitor.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Deny
                      </button>
                    </>
                  )}

                  {visitor.status === 'approved' && (isGuard() || isAdmin()) && (
                    <button
                      onClick={() => handleCheckIn(visitor.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}

                  {visitor.status === 'checked_in' && (isGuard() || isAdmin()) && (
                    <button
                      onClick={() => handleCheckOut(visitor.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}