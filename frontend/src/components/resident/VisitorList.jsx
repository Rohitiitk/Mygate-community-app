// import { useState, useEffect } from 'react';
// import { visitorsAPI } from '../../services/api';
// import { useAuth } from '../../context/AuthContext';
// import toast from 'react-hot-toast';
// import { CheckCircle, XCircle, Clock, UserCheck, UserX } from 'lucide-react';

// export default function VisitorList() {
//   const [visitors, setVisitors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all');
//   const { isGuard, isAdmin } = useAuth();

//   useEffect(() => {
//     fetchVisitors();
//   }, [filter]);

//   const fetchVisitors = async () => {
//     try {
//       setLoading(true);
//       const status = filter === 'all' ? undefined : filter;
//       const response = await visitorsAPI.getAll(status);
//       setVisitors(response.data.visitors);
//     } catch (error) {
//       toast.error('Failed to load visitors');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApprove = async (visitorId) => {
//     try {
//       await visitorsAPI.approve(visitorId);
//       toast.success('Visitor approved');
//       fetchVisitors();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to approve visitor');
//     }
//   };

//   const handleDeny = async (visitorId) => {
//     const reason = prompt('Reason for denial (optional):');
//     try {
//       await visitorsAPI.deny(visitorId, reason);
//       toast.success('Visitor denied');
//       fetchVisitors();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to deny visitor');
//     }
//   };

//   const handleCheckIn = async (visitorId) => {
//     try {
//       await visitorsAPI.checkIn(visitorId);
//       toast.success('Visitor checked in');
//       fetchVisitors();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to check in visitor');
//     }
//   };

//   const handleCheckOut = async (visitorId) => {
//     try {
//       await visitorsAPI.checkOut(visitorId);
//       toast.success('Visitor checked out');
//       fetchVisitors();
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Failed to check out visitor');
//     }
//   };

//   const getStatusBadge = (status) => {
//     const styles = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       approved: 'bg-green-100 text-green-800',
//       denied: 'bg-red-100 text-red-800',
//       checked_in: 'bg-blue-100 text-blue-800',
//       checked_out: 'bg-gray-100 text-gray-800'
//     };
//     return styles[status] || 'bg-gray-100 text-gray-800';
//   };

//   const getStatusIcon = (status) => {
//     const icons = {
//       pending: <Clock className="w-4 h-4" />,
//       approved: <CheckCircle className="w-4 h-4" />,
//       denied: <XCircle className="w-4 h-4" />,
//       checked_in: <UserCheck className="w-4 h-4" />,
//       checked_out: <UserX className="w-4 h-4" />
//     };
//     return icons[status];
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Filters */}
//       <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
//         {['all', 'pending', 'approved', 'checked_in', 'checked_out'].map((status) => (
//           <button
//             key={status}
//             onClick={() => setFilter(status)}
//             className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
//               filter === status
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             {status.replace('_', ' ').toUpperCase()}
//           </button>
//         ))}
//       </div>

//       {/* Visitors List */}
//       {visitors.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-lg">
//           <p className="text-gray-500">No visitors found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {visitors.map((visitor) => (
//             <div
//               key={visitor.id}
//               className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//             >
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       {visitor.name}
//                     </h3>
//                     <span
//                       className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
//                         visitor.status
//                       )}`}
//                     >
//                       {getStatusIcon(visitor.status)}
//                       {visitor.status.replace('_', ' ')}
//                     </span>
//                   </div>
//                   <div className="text-sm text-gray-600 space-y-1">
//                     <p>📞 {visitor.phone}</p>
//                     <p>📝 {visitor.purpose}</p>
//                     {visitor.scheduledTime && (
//                       <p>🕒 {new Date(visitor.scheduledTime).toLocaleString()}</p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 ml-4">
//                   {visitor.status === 'pending' && !isGuard() && (
//                     <>
//                       <button
//                         onClick={() => handleApprove(visitor.id)}
//                         className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
//                       >
//                         Approve
//                       </button>
//                       <button
//                         onClick={() => handleDeny(visitor.id)}
//                         className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
//                       >
//                         Deny
//                       </button>
//                     </>
//                   )}

//                   {visitor.status === 'approved' && (isGuard() || isAdmin()) && (
//                     <button
//                       onClick={() => handleCheckIn(visitor.id)}
//                       className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
//                     >
//                       Check In
//                     </button>
//                   )}

//                   {visitor.status === 'checked_in' && (isGuard() || isAdmin()) && (
//                     <button
//                       onClick={() => handleCheckOut(visitor.id)}
//                       className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
//                     >
//                       Check Out
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { visitorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, UserCheck, UserX, RefreshCw } from 'lucide-react';

export default function VisitorList() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { isGuard, isAdmin, userClaims } = useAuth();

  // Real-time listener for visitors
  useEffect(() => {
    let unsubscribe = () => {};

    const setupRealtimeListener = () => {
      try {
        let q = collection(db, 'visitors');

        // Build query based on user role
        const constraints = [];

        // Residents only see their household's visitors
        if (userClaims?.roles?.includes('resident') && !userClaims?.roles?.includes('admin')) {
          if (!userClaims.householdId) {
            console.error('No household ID for resident');
            setLoading(false);
            return;
          }
          constraints.push(where('hostHouseholdId', '==', userClaims.householdId));
        }

        // Filter by status
        if (filter !== 'all') {
          constraints.push(where('status', '==', filter));
        }

        // Order and limit
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(100));

        q = query(collection(db, 'visitors'), ...constraints);

        console.log('Setting up real-time listener for visitors...');

        // Setup real-time listener
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log(`📡 Received ${snapshot.docs.length} visitors in real-time`);
            
            const visitorsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Convert Firestore timestamps to ISO strings
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
              approvedAt: doc.data().approvedAt?.toDate?.()?.toISOString() || doc.data().approvedAt,
              checkedInAt: doc.data().checkedInAt?.toDate?.()?.toISOString() || doc.data().checkedInAt,
              checkedOutAt: doc.data().checkedOutAt?.toDate?.()?.toISOString() || doc.data().checkedOutAt
            }));

            setVisitors(visitorsData);
            setLoading(false);

            // Show toast for status changes (only for non-initial loads)
            if (!loading) {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                  const visitor = change.doc.data();
                  const statusChanged = change.doc.data().status;
                  
                  // Show notification based on status
                  if (statusChanged === 'approved') {
                    toast.success(`✅ ${visitor.name} was approved`, { duration: 3000 });
                  } else if (statusChanged === 'denied') {
                    toast.error(`❌ ${visitor.name} was denied`, { duration: 3000 });
                  } else if (statusChanged === 'checked_in') {
                    toast.success(`🚪 ${visitor.name} checked in`, { duration: 3000 });
                  } else if (statusChanged === 'checked_out') {
                    toast.success(`👋 ${visitor.name} checked out`, { duration: 3000 });
                  }
                }
                
                if (change.type === 'added' && !loading) {
                  const visitor = change.doc.data();
                  toast(`🚶 New visitor: ${visitor.name}`, { duration: 3000 });
                }
              });
            }
          },
          (error) => {
            console.error('Firestore listener error:', error);
            toast.error('Failed to load visitors in real-time');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up listener:', error);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up visitor listener');
      unsubscribe();
    };
  }, [filter, userClaims, loading]);

  const handleApprove = async (visitorId) => {
    try {
      await visitorsAPI.approve(visitorId);
      // Real-time listener will update the UI automatically
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve visitor');
    }
  };

  const handleDeny = async (visitorId) => {
    const reason = prompt('Reason for denial (optional):');
    try {
      await visitorsAPI.deny(visitorId, reason);
      // Real-time listener will update the UI automatically
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to deny visitor');
    }
  };

  const handleCheckIn = async (visitorId) => {
    try {
      await visitorsAPI.checkIn(visitorId);
      // Real-time listener will update the UI automatically
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to check in visitor');
    }
  };

  const handleCheckOut = async (visitorId) => {
    try {
      await visitorsAPI.checkOut(visitorId);
      // Real-time listener will update the UI automatically
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
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading visitors...</p>
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

      {/* Real-time indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live updates enabled</span>
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