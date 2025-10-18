// // import React from "react";

// // const Navbar = () => {
// //   return (
// //     <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
// //       <h1 className="text-xl font-semibold">MyGate Dashboard</h1>
// //       <ul className="flex gap-4">
// //         <li className="hover:text-gray-200 cursor-pointer">Home</li>
// //         <li className="hover:text-gray-200 cursor-pointer">Profile</li>
// //         <li className="hover:text-gray-200 cursor-pointer">Logout</li>
// //       </ul>
// //     </nav>
// //   );
// // };

// // export default Navbar;

// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { LogOut, Shield, Bell, User } from 'lucide-react';
// import toast from 'react-hot-toast';

// export default function Navbar() {
//   const { user, userClaims, signOut } = useAuth();
//   const navigate = useNavigate();

//   const handleSignOut = async () => {
//     try {
//       await signOut();
//       toast.success('Signed out successfully');
//       navigate('/login');
//     } catch (error) {
//       console.error('Signout error:', error);
//       toast.error('Failed to sign out');
//     }
//   };

//   const getRoleBadgeColor = (role) => {
//     const colors = {
//       admin: 'bg-purple-100 text-purple-700 border-purple-300',
//       guard: 'bg-green-100 text-green-700 border-green-300',
//       resident: 'bg-blue-100 text-blue-700 border-blue-300'
//     };
//     return colors[role] || 'bg-gray-100 text-gray-700 border-gray-300';
//   };

//   const getRoleIcon = (role) => {
//     if (role === 'admin') return '👑';
//     if (role === 'guard') return '🛡️';
//     if (role === 'resident') return '🏠';
//     return '👤';
//   };

//   return (
//     <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo & Brand */}
//           <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <span className="text-xl font-bold text-gray-900">MyGate</span>
//               <p className="text-xs text-gray-500 hidden sm:block">Community Manager</p>
//             </div>
//           </Link>

//           {/* Right side */}
//           <div className="flex items-center space-x-4">
//             {/* Notification Bell */}
//             <button 
//               className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
//               title="Notifications"
//             >
//               <Bell className="w-5 h-5 text-gray-600" />
//               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//             </button>

//             {/* User Info */}
//             <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
//               {/* Avatar */}
//               <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
//                 {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
//               </div>

//               {/* User Details */}
//               <div className="hidden md:block text-right">
//                 <p className="text-sm font-medium text-gray-900 leading-tight">
//                   {user?.displayName || user?.email?.split('@')[0] || 'User'}
//                 </p>
//                 <div className="flex gap-1 justify-end mt-1">
//                   {userClaims?.roles?.map((role) => (
//                     <span
//                       key={role}
//                       className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeColor(role)}`}
//                     >
//                       <span>{getRoleIcon(role)}</span>
//                       {role}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               {/* Logout Button */}
//               <button
//                 onClick={handleSignOut}
//                 className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors group"
//                 title="Sign Out"
//               >
//                 <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Role Display */}
//         <div className="md:hidden pb-3 flex gap-2">
//           {userClaims?.roles?.map((role) => (
//             <span
//               key={role}
//               className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border ${getRoleBadgeColor(role)}`}
//             >
//               <span>{getRoleIcon(role)}</span>
//               {role}
//             </span>
//           ))}
//         </div>
//       </div>
//     </nav>
//   );
// }

// // import { useState, useEffect } from 'react';
// // import { Bell, BellOff } from 'lucide-react';
// // import { toast } from 'react-toastify';
// // import { getNotificationPermission, requestNotificationPermission } from '../../services/fcm';

// // export default function Navbar() {
// //   const [notificationEnabled, setNotificationEnabled] = useState(false);

// //   useEffect(() => {
// //     const permission = getNotificationPermission();
// //     setNotificationEnabled(permission === 'granted');
// //   }, []);

// //   const handleNotificationToggle = async () => {
// //     if (notificationEnabled) {
// //       toast.info('To disable notifications, please use your browser settings.', {
// //         position: 'bottom-right',
// //       });
// //     } else {
// //       const token = await requestNotificationPermission();
// //       if (token) {
// //         setNotificationEnabled(true);
// //         toast.success('Notifications enabled successfully!', {
// //           position: 'bottom-right',
// //         });
// //       } else {
// //         toast.error('Notification permission denied.', {
// //           position: 'bottom-right',
// //         });
// //       }
// //     }
// //   };

// //   return (
// //     <nav className="flex items-center justify-between px-4 py-2 bg-white shadow-sm">
// //       <div className="text-xl font-semibold">MyGate Community</div>

// //       {/* 🔔 Notification Toggle Button */}
// //       <button
// //         onClick={handleNotificationToggle}
// //         className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${
// //           notificationEnabled ? 'text-blue-600' : 'text-gray-400'
// //         }`}
// //         title={notificationEnabled ? 'Notifications enabled' : 'Enable notifications'}
// //       >
// //         {notificationEnabled ? (
// //           <>
// //             <Bell className="w-5 h-5" />
// //             <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
// //           </>
// //         ) : (
// //           <BellOff className="w-5 h-5" />
// //         )}
// //       </button>
// //     </nav>
// //   );
// // }


import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, Bell, BellOff, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotificationPermission, requestNotificationPermission } from '../../services/fcm';

export default function Navbar() {
  const { user, userClaims, signOut } = useAuth();
  const navigate = useNavigate();

  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // ✅ Check notification permission on mount
  useEffect(() => {
    const permission = getNotificationPermission();
    setNotificationEnabled(permission === 'granted');
  }, []);

  // ✅ Handle toggling notifications
  const handleNotificationToggle = async () => {
    if (notificationEnabled) {
      toast.success('To disable notifications, please use your browser settings.');
    } else {
      const token = await requestNotificationPermission();
      if (token) {
        setNotificationEnabled(true);
        toast.success('Notifications enabled successfully');
      } else {
        toast.error('Failed to enable notifications');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Signout error:', error);
      toast.error('Failed to sign out');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-300',
      guard: 'bg-green-100 text-green-700 border-green-300',
      resident: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return '👑';
    if (role === 'guard') return '🛡️';
    if (role === 'resident') return '🏠';
    return '👤';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">MyGate</span>
              <p className="text-xs text-gray-500 hidden sm:block">
                Community Manager
              </p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* ✅ Notification Button */}
            <button
              onClick={handleNotificationToggle}
              className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                notificationEnabled ? 'text-blue-600' : 'text-gray-400'
              }`}
              title={
                notificationEnabled
                  ? 'Notifications enabled'
                  : 'Enable notifications'
              }
            >
              {notificationEnabled ? (
                <>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </>
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </button>

            {/* User Info */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              {/* Avatar */}
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.displayName?.charAt(0) ||
                  user?.email?.charAt(0).toUpperCase() || (
                    <User className="w-5 h-5" />
                  )}
              </div>

              {/* User Details */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.displayName ||
                    user?.email?.split('@')[0] ||
                    'User'}
                </p>
                <div className="flex gap-1 justify-end mt-1">
                  {userClaims?.roles?.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeColor(
                        role
                      )}`}
                    >
                      <span>{getRoleIcon(role)}</span>
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Role Display */}
        <div className="md:hidden pb-3 flex gap-2">
          {userClaims?.roles?.map((role) => (
            <span
              key={role}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border ${getRoleBadgeColor(
                role
              )}`}
            >
              <span>{getRoleIcon(role)}</span>
              {role}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}
