import { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Clock, User, Activity } from 'lucide-react';

export default function AuditLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const type = filter === 'all' ? undefined : filter;
      const response = await auditAPI.getEvents({ type, limit: 50 });
      setEvents(response.data.events);
    } catch (error) {
      toast.error('Failed to load audit events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    'all',
    'visitor_created',
    'visitor_approved',
    'visitor_denied',
    'visitor_checked_in',
    'visitor_checked_out',
    'ai_action_executed'
  ];

  const getEventIcon = (type) => {
    if (type.includes('created')) return '➕';
    if (type.includes('approved')) return '✅';
    if (type.includes('denied')) return '❌';
    if (type.includes('checked_in')) return '🚪';
    if (type.includes('checked_out')) return '👋';
    if (type.includes('ai_action')) return '🤖';
    return '📝';
  };

  const getEventColor = (type) => {
    if (type.includes('created')) return 'bg-blue-50 border-blue-200';
    if (type.includes('approved')) return 'bg-green-50 border-green-200';
    if (type.includes('denied')) return 'bg-red-50 border-red-200';
    if (type.includes('checked_in')) return 'bg-purple-50 border-purple-200';
    if (type.includes('checked_out')) return 'bg-gray-50 border-gray-200';
    if (type.includes('ai_action')) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
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
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-600">Immutable record of all system events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No audit events found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 ${getEventColor(event.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getEventIcon(event.type)}</span>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {event.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(event.timestamp || event.createdAt)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Actor:</span>
                      <span className="font-mono text-xs bg-white px-2 py-0.5 rounded">
                        {event.actorUserId?.substring(0, 8)}...
                      </span>
                    </p>

                    {event.subjectId && event.subjectId !== 'N/A' && (
                      <p className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Subject:</span>
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded">
                          {event.subjectId.substring(0, 8)}...
                        </span>
                      </p>
                    )}

                    {event.payload && Object.keys(event.payload).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}