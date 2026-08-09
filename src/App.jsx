import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  customer: '',
  origin: '',
  destination: '',
  status: 'Pending',
  vehicle: '',
  eta: ''
};

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function badgeClass(status) {
  if (status === 'Delivered') return 'green';
  if (status === 'In Transit') return 'blue';
  return 'yellow';
}

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0
  });
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [health, setHealth] = useState('checking');

  const statusOptions = useMemo(
    () => ['Pending', 'In Transit', 'Delivered'],
    []
  );

  async function loadAll() {
    try {
      setLoading(true);

      const [shipmentsRes, statsRes, healthRes] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/stats'),
        fetch('/api/health')
      ]);

      const shipmentsData = await shipmentsRes.json();
      const statsData = await statsRes.json();
      const healthData = await healthRes.json();

      if (!shipmentsRes.ok) throw new Error(shipmentsData.error || 'โหลด shipments ไม่สำเร็จ');
      if (!statsRes.ok) throw new Error(statsData.error || 'โหลด stats ไม่สำเร็จ');

      setShipments(shipmentsData);
      setStats(statsData);
      setHealth(healthData.ok ? 'ok' : 'error');
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'ไม่สามารถโหลดข้อมูลได้');
      setHealth('error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const refreshStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (res.ok) setStats(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เพิ่ม shipment ไม่สำเร็จ');
      }

      setShipments((prev) => [data, ...prev]);
      setForm(initialForm);
      await refreshStats();
      setMessage(`เพิ่ม shipment ${data.trackingNo} สำเร็จ`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setMessage('');

      const res = await fetch(`/api/shipments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'อัปเดตสถานะไม่สำเร็จ');
      }

      setShipments((prev) => prev.map((item) => (item.id === id ? data : item)));
      await refreshStats();
      setMessage(`อัปเดตสถานะ ${data.trackingNo} เป็น ${data.status} แล้ว`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Railway + PostgreSQL + Prisma</p>
          <h1>Logistics Management Dashboard</h1>
          <p className="subtitle">
            ระบบจัดการขนส่งแบบ Full Stack พร้อมใช้งานจริงและพร้อม Deploy ขึ้น Railway
          </p>
        </div>
        <div className={`health-indicator ${health}`}>
          {health === 'ok' ? 'Database Connected' : health === 'error' ? 'Database Error' : 'Checking...'}
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Shipments</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="stat-card">
          <span>In Transit</span>
          <strong>{stats.inTransit}</strong>
        </div>
        <div className="stat-card">
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>เพิ่มรายการขนส่ง</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              name="customer"
              type="text"
              placeholder="ชื่อลูกค้า / บริษัท"
              value={form.customer}
              onChange={handleChange}
              required
            />
            <input
              name="origin"
              type="text"
              placeholder="ต้นทาง"
              value={form.origin}
              onChange={handleChange}
              required
            />
            <input
              name="destination"
              type="text"
              placeholder="ปลายทาง"
              value={form.destination}
              onChange={handleChange}
              required
            />
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              name="vehicle"
              type="text"
              placeholder="รหัสรถ / พาหนะ"
              value={form.vehicle}
              onChange={handleChange}
              required
            />
            <input
              name="eta"
              type="date"
              value={form.eta}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'เพิ่ม Shipment'}
            </button>
          </form>

          {message && <div className="message-box">{message}</div>}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>รายการ Shipment</h2>
            <button className="secondary-btn" onClick={loadAll}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>กำลังโหลดข้อมูล...</p>
          ) : shipments.length === 0 ? (
            <p>ยังไม่มีข้อมูล shipment</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tracking No</th>
                    <th>Customer</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Vehicle</th>
                    <th>ETA</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td>{shipment.trackingNo}</td>
                      <td>{shipment.customer}</td>
                      <td>{shipment.origin}</td>
                      <td>{shipment.destination}</td>
                      <td>
                        <span className={`badge ${badgeClass(shipment.status)}`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td>{shipment.vehicle}</td>
                      <td>{formatDate(shipment.eta)}</td>
                      <td>{formatDate(shipment.createdAt)}</td>
                      <td>
                        <div className="actions">
                          <button onClick={() => updateStatus(shipment.id, 'Pending')}>
                            Pending
                          </button>
                          <button onClick={() => updateStatus(shipment.id, 'In Transit')}>
                            In Transit
                          </button>
                          <button onClick={() => updateStatus(shipment.id, 'Delivered')}>
                            Delivered
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
