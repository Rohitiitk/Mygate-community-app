import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../shared/Navbar';

import Broadcast from '../admin/Broadcast';
import Analytics from '../admin/Analytics';
import { Megaphone, BarChart3 } from 'lucide-react';
import VisitorForm from './VisitorForm';
import VisitorList from './VisitorList';
import BroadcastView from './BroadcastView';
import AICopilot from '../chat/AICopilot';
import AuditLog from '../admin/AuditLog';
import { Users, MessageSquare, FileText } from 'lucide-react';

export default function Dashboard() {
  const { isResident, isGuard, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('visitors');
  const [refreshKey, setRefreshKey] = useState(0);

   const tabs = [
  { id: 'visitors', label: 'Visitors', icon: Users, roles: ['resident', 'guard', 'admin'] },
  { id: 'chat', label: 'AI Copilot', icon: MessageSquare, roles: ['resident', 'guard', 'admin'] },
  { id: 'audit', label: 'Audit Log', icon: FileText, roles: ['admin', 'guard'] },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone, roles: ['admin'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, roles: ['resident', 'guard'] },

];


  const visibleTabs = tabs.filter(tab => 
    tab.roles.some(role => 
      (role === 'resident' && isResident()) ||
      (role === 'guard' && isGuard()) ||
      (role === 'admin' && isAdmin())
    )
  );


 
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'visitors' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {isResident() && (
                <div className="lg:col-span-1">
                  <VisitorForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
                </div>
              )}
              <div className={isResident() ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <VisitorList key={refreshKey} />
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && isAdmin() && (
  <div>
    <Broadcast />
  </div>
)}

{activeTab === 'analytics' && isAdmin() && (
  <div>
    <Analytics />
  </div>
)}

{activeTab === 'announcements' && (isResident() || isGuard()) && (
  <div>
    <BroadcastView />
  </div>
)}

{activeTab === 'broadcast' && isAdmin() && (
  <div>
    <Broadcast />
  </div>
)}

          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto">
              <AICopilot />
            </div>
          )}

          {activeTab === 'audit' && (isAdmin() || isGuard()) && (
            <div>
              <AuditLog />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}