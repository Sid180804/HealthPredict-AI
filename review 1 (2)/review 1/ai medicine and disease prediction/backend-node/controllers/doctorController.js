const db = require('../db');

const safe = (u) => { const { password, ...rest } = u; return rest; };

// ── GET /api/doctor/profile ─────────────────────────────────────────────────
exports.getProfile = (req, res) => {
  const profile = db.doctor_profiles.get('profiles').find({ userId: req.user.id }).value();
  if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });
  res.json({ profile: { ...profile, user: req.user } });
};

// ── PUT /api/doctor/profile ─────────────────────────────────────────────────
exports.updateProfile = (req, res) => {
  const allowed = [
    'specialization', 'experience_years', 'fees', 'clinic_name',
    'clinic_address', 'city', 'bio', 'languages', 'consultation_types',
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const exists = db.doctor_profiles.get('profiles').find({ userId: req.user.id }).value();
  if (!exists) return res.status(404).json({ error: 'Doctor profile not found' });

  db.doctor_profiles.get('profiles').find({ userId: req.user.id }).assign(updates).write();
  const updated = db.doctor_profiles.get('profiles').find({ userId: req.user.id }).value();
  res.json({ profile: updated, message: 'Profile updated' });
};

// ── PUT /api/doctor/availability ────────────────────────────────────────────
exports.updateAvailability = (req, res) => {
  const { availability } = req.body;
  if (!availability || typeof availability !== 'object') {
    return res.status(400).json({ error: 'Availability object required' });
  }
  db.doctor_profiles.get('profiles').find({ userId: req.user.id }).assign({ availability }).write();
  res.json({ message: 'Availability updated', availability });
};

// ── PUT /api/doctor/toggle-online ───────────────────────────────────────────
exports.toggleOnline = (req, res) => {
  const profile = db.doctor_profiles.get('profiles').find({ userId: req.user.id }).value();
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const is_online = !profile.is_online;
  db.doctor_profiles.get('profiles').find({ userId: req.user.id }).assign({ is_online }).write();
  res.json({ is_online, message: `Status set to ${is_online ? 'Online' : 'Offline'}` });
};

// ── GET /api/doctor/appointments ────────────────────────────────────────────
exports.getAppointments = (req, res) => {
  const { date } = req.query;
  const doctorName = req.user.name || '';

  // Match by doctorId (legacy Node bookings) OR doctor_name (ML service bookings)
  let appts = db.appointments.get('appointments').value().filter(a =>
    a.doctorId === req.user.id || (doctorName && (a.doctor_name || '').toLowerCase() === doctorName.toLowerCase())
  );

  if (date) {
    appts = appts.filter(a => (a.appointment_date || a.date || '').startsWith(date));
  }

  // Attach patient info — try from users DB, fall back to booking data
  const enriched = appts.map(a => {
    const patient = db.users.get('users').find({ id: a.patientId }).value()
      || db.users.get('users').find({ email: a.user_email }).value();
    return {
      ...a,
      patient: patient ? safe(patient) : {
        name: a.user_name || 'Patient',
        email: a.user_email || '',
      },
    };
  });

  res.json({ appointments: enriched, count: enriched.length });
};
