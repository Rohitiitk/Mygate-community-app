import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Megaphone, AlertTriangle, Calendar, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BroadcastView() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Real-time listener for broadcasts
    const q = query(
      collection(db, 'broadcasts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`📡 Received ${snapshot.docs.length} broadcasts`);
        
        const broadcastsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().sentAt
        }));

        setBroadcasts(broadcastsData);
        setLoading(false);

        // Show toast for new broadcasts
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && !loading) {
            const broadcast = change.doc.data();
            
            if (broadcast.category === 'emergency' || broadcast.priority === 'critical') {
              toast.error(`🚨 ${broadcast.title}`, {
                duration: 10000,
                style: {
                  background: '#dc2626',
                  color: 'white',
                }
              });
            } else if (broadcast.priority === 'high') {
              toast((t) => (
                <div className="flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">{broadcast.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{broadcast.message}</p>
                  </div>
                </div>
              ), {
                duration: 5000,
                style: {
                  maxWidth: '500px',
                }
              });
            }
          }
        });

        // Calculate unread (broadcasts from last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const unread = broadcastsData.filter(b => {
          const createdDate = new Date(b.createdAt);
          return createdDate > sevenDaysAgo;
        }).length;
        setUnreadCount(unread);
      },
      (error) => {
        console.error('Broadcast listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'maintenance':
        return <Info className="w-5 h-5 text-orange-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'event':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hour${Math.floor(diffHours) !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Society Announcements</h2>
            <p className="text-sm text-gray-600">
              Stay updated with community news and alerts
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-900">
              {unreadCount} new this week
            </span>
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
      </div>

      {/* Broadcasts List */}
      {broadcasts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No announcements yet</p>
          <p className="text-gray-400 text-sm mt-1">
            You'll see society messages and alerts here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className={`rounded-lg p-6 shadow-sm transition-all hover:shadow-md ${getPriorityStyles(
                broadcast.priority
              )}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getCategoryIcon(broadcast.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title and badges */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {broadcast.title}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${getCategoryBadgeStyle(
                          broadcast.category
                        )}`}
                      >
                        {broadcast.category}
                      </span>
                      {(broadcast.priority === 'high' || broadcast.priority === 'critical') && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 border border-red-300">
                          {broadcast.priority === 'critical' ? 'URGENT' : 'Important'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {broadcast.message}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(broadcast.createdAt)}
                    </span>
                    {broadcast.priority && (
                      <span className="flex items-center gap-1">
                        Priority: {broadcast.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency styling */}
              {broadcast.category === 'emergency' && (
                <div className="mt-4 pt-4 border-t border-red-300">
                  <p className="text-red-700 font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Please take immediate action if required
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Announcements</p>
            <p className="text-blue-700">
              Society announcements are sent by the admin/committee to keep all residents informed. 
              You'll receive instant notifications for important updates and emergency alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}