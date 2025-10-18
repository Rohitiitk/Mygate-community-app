import { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Broadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const response = await api.get('/api/broadcast');
      setBroadcasts(response.data.broadcasts);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/broadcast', formData);
      toast.success('Broadcast sent to all residents!');
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        category: 'general'
      });
      fetchBroadcasts();
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = async () => {
    const message = prompt('Emergency message:');
    if (!message) return;

    try {
      await api.post('/api/broadcast/emergency', { message });
      toast.success('🚨 Emergency alert sent!');
      fetchBroadcasts();
    } catch (error) {
      toast.error('Failed to send emergency alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Society Broadcast</h2>
            <p className="text-sm text-gray-600">Send messages to all residents</p>
          </div>
        </div>

        <button
          onClick={handleEmergency}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
          Emergency Alert
        </button>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">New Broadcast</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Society Maintenance Notice"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="maintenance">Maintenance</option>
                <option value="event">Event</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      {/* Recent Broadcasts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Broadcasts</h3>
        
        {broadcasts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No broadcasts yet</p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{broadcast.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{broadcast.message}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        broadcast.priority === 'high' ? 'bg-red-100 text-red-700' :
                        broadcast.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {broadcast.priority}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {broadcast.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(broadcast.createdAt || broadcast.sentAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}