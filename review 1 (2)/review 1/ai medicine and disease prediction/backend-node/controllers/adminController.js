const db = require('../db');
const { ROLES, VERIFICATION_STATUS } = require('../config/constants');

const safe = (u) => { const { password, ...rest } = u; return rest; };

// ── GET /api/admin/stats ────────────────────────────────────────────────────
exports.getStats = (_req, res) => {
  const users    = db.users.get('users').value();
  const profiles = db.doctor_profiles.get('profiles').value();
  const appts    = db.appointments.get('appointments').value();
  const orders   = db.orders.get('orders').value();

  res.json({
    totalUsers:          users.length,
    totalDoctors:        users.filter(u => u.role === ROLES.DOCTOR).length,
    totalPatients:       users.filter(u => u.role === ROLES.PATIENT).length,
    pendingVerification: profiles.filter(p => p.verification_status === VERIFICATION_STATUS.PENDING).length,
    verifiedDoctors:     profiles.filter(p => p.verification_status === VERIFICATION_STATUS.APPROVED).length,
    totalAppointments:   appts.length,
    totalOrders:         orders.length,
  });
};

// ── GET /api/admin/doctors ──────────────────────────────────────────────────
exports.getDoctors = (req, res) => {
  const { status } = req.query;
  const doctorUsers = db.users.get('users').filter({ role: ROLES.DOCTOR }).value();
  const profiles    = db.doctor_profiles.get('profiles').value();

  let result = doctorUsers.map(u => {
    const profile = profiles.find(p => p.userId === u.id) || {};
    return { ...safe(u), profile };
  });

  if (status) result = result.filter(d => d.profile.verification_status === status);

  // Most recent first
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ doctors: result, count: result.length });
};

// ── PUT /api/admin/doctors/:id/verify ──────────────────────────────────────
exports.verifyDoctor = (req, res) => {
  const { id } = req.params;
  const profile = db.doctor_profiles.get('profiles').find({ userId: id }).value();
  if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

  db.doctor_profiles.get('profiles').find({ userId: id })
    .assign({
      verification_status: VERIFICATION_STATUS.APPROVED,
      is_verified: true,
      rejection_reason: '',
      verified_at: new Date().toISOString(),
    }).write();

  res.json({ message: 'Doctor verified successfully' });
};

// ── PUT /api/admin/doctors/:id/reject ──────────────────────────────────────
exports.rejectDoctor = (req, res) => {
  const { id }    = req.params;
  const { reason } = req.body;
  const profile   = db.doctor_profiles.get('profiles').find({ userId: id }).value();
  if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

  db.doctor_profiles.get('profiles').find({ userId: id })
    .assign({
      verification_status: VERIFICATION_STATUS.REJECTED,
      is_verified: false,
      rejection_reason: reason || 'Rejected by admin',
    }).write();

  res.json({ message: 'Doctor application rejected' });
};

// ── GET /api/admin/appointments ─────────────────────────────────────────────
exports.getAppointments = (_req, res) => {
  const appts = db.appointments.get('appointments').value();
  const completed = appts.filter(a => a.status === 'completed');
  const totalRevenue = completed.reduce((sum, a) => sum + (a.consultation_fee || 0), 0);

  // Compute per-doctor earnings
  const doctorEarnings = {};
  completed.forEach(a => {
    const doc = a.doctor_name || 'Unknown';
    if (!doctorEarnings[doc]) doctorEarnings[doc] = { name: doc, total: 0, count: 0 };
    doctorEarnings[doc].total += (a.consultation_fee || 0);
    doctorEarnings[doc].count += 1;
  });

  res.json({
    appointments: appts,
    stats: {
      total: appts.length,
      completed: completed.length,
      cancelled: appts.filter(a => a.status === 'cancelled').length,
      confirmed: appts.filter(a => a.status === 'confirmed').length,
      totalRevenue,
      doctorEarnings: Object.values(doctorEarnings).sort((a, b) => b.total - a.total),
    },
  });
};

// ── GET /api/admin/users ────────────────────────────────────────────────────
exports.getUsers = (req, res) => {
  const { role } = req.query;
  let users = db.users.get('users').value().map(safe);
  if (role) users = users.filter(u => u.role === role);
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ users, count: users.length });
};
