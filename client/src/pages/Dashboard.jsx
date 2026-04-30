import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import ChatWidget from '../components/ChatWidget';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { orderService, inventoryService, workerService } from '../services/services';
import {
  Package, AlertTriangle, Users, CheckCircle,
  Clock, TrendingUp, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];
const DASHBOARD_EVENTS = [
  'order:created', 'order:updated', 'order:deleted',
  'inventory:created', 'inventory:updated', 'inventory:deleted',
  'worker:created', 'worker:updated', 'worker:deleted',
];

export default function Dashboard() {
  const [orderStats, setOrderStats] = useState(null);
  const [invStats, setInvStats] = useState(null);
  const [workerStats, setWorkerStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [os, is, ws, ro] = await Promise.all([
        orderService.getStats(),
        inventoryService.getStats(),
        workerService.getStats(),
        orderService.getAll({ limit: 5 }),
      ]);
      setOrderStats(os.data);
      setInvStats(is.data);
      setWorkerStats(ws.data);
      setRecentOrders(ro.data.orders || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useRealtimeRefresh(DASHBOARD_EVENTS, fetchAll);

  // Build chart data from order stats
  const orderChartData = orderStats?.stats?.map(s => ({
    name: s._id,
    count: s.count,
  })) || [];

  const workerPieData = workerStats ? [
    { name: 'Available', value: workerStats.available },
    { name: 'Busy', value: workerStats.busy },
    { name: 'Others', value: workerStats.total - workerStats.available - workerStats.busy },
  ].filter(d => d.value > 0) : [];

  const getBadgeClass = (status) => {
    const map = {
      'Pending': 'badge-pending',
      'In Progress': 'badge-progress',
      'Quality Check': 'badge-quality',
      'Completed': 'badge-completed',
      'Cancelled': 'badge-cancelled',
    };
    return `badge ${map[status] || ''}`;
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
        <StatCard
          title="Total Orders"
          value={orderStats?.total ?? 0}
          subtitle={`${orderStats?.overdue ?? 0} overdue`}
          icon={Package}
          color="gold"
        />
        <StatCard
          title="Pending Orders"
          value={orderStats?.stats?.find(s => s._id === 'Pending')?.count ?? 0}
          subtitle="Awaiting processing"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Completed"
          value={orderStats?.stats?.find(s => s._id === 'Completed')?.count ?? 0}
          subtitle="Orders fulfilled"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Workers"
          value={workerStats?.total ?? 0}
          subtitle={`${workerStats?.available ?? 0} available`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Inventory Items"
          value={invStats?.total ?? 0}
          subtitle={`${invStats?.lowStockCount ?? 0} low stock`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Inventory Value"
          value={`₹${((invStats?.totalValue ?? 0) / 1000).toFixed(1)}K`}
          subtitle="Total stock value"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Low stock alert */}
      {(invStats?.lowStockCount || 0) > 0 && (
        <div className="low-stock-alert" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} />
          <strong>{invStats.lowStockCount} inventory items</strong> are running low on stock. Please restock soon.
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Orders by Status Bar Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <BarChart3 size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Orders by Status
            </h3>
          </div>
          {orderChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={orderChartData}>
                <XAxis dataKey="name" tick={{ fill: '#9099b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9099b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {orderChartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60, fontSize: 14 }}>
              No orders yet
            </div>
          )}
        </div>

        {/* Worker Status Pie Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Users size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Worker Availability
            </h3>
          </div>
          {workerPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={workerPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {workerPieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60, fontSize: 14 }}>
              No workers yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Orders</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 14 }}>
              No orders yet. Create your first order!
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Metal</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Worker</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.metalType}</td>
                    <td><span className={getBadgeClass(order.status)}>{order.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.dueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {order.assignedWorker?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating AI Chat */}
      <ChatWidget />
    </Layout>
  );
}
