import { useState, useEffect } from 'react';
import { BarChart3, Users, Home, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchAlerts();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/dashboard');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/analytics/alerts');
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12">Failed to load analytics</div>;
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.summary.totalUsers, color: 'blue' },
    { icon: Home, label: 'Households', value: stats.summary.totalHouseholds, color: 'green' },
    { icon: Activity, label: 'Total Visitors', value: stats.summary.totalVisitors, color: 'purple' },
    { icon: TrendingUp, label: 'Recent (7 days)', value: stats.summary.recentVisitors, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600">System overview and performance metrics</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                <span className="text-sm text-gray-700">{alert.message}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visitors by Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Visitors by Status</h3>
        <div className="space-y-3">
          {Object.entries(stats.visitorsByStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'approved' ? 'bg-green-500' :
                      status === 'denied' ? 'bg-red-500' :
                      status === 'checked_in' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}
                    style={{
                      width: `${(count / stats.summary.totalVisitors) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Average Approval Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.metrics.avgApprovalTimeMinutes} <span className="text-sm font-normal">minutes</span>
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">SLA Status</p>
            <p className={`text-2xl font-bold ${
              stats.metrics.approvalSLA === 'Good' ? 'text-green-600' :
              stats.metrics.approvalSLA === 'Fair' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.metrics.approvalSLA}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}