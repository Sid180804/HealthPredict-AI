const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db     = require('../db');
const { ROLES, VERIFICATION_STATUS, JWT_SECRET, JWT_EXPIRY } = require('../config/constants');

const genId    = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const genToken = (u) => jwt.sign({ id: u.id, role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
const safe     = (u)  => { const { password, ...rest } = u; return rest; };

// ── POST /api/auth/register ─────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { email, password, name, role,
            age, gender, height, weight, blood_group,
            is_smoker, is_alcohol, physical_activity, sleep_hours,
            existing_conditions,
            country, state, city, pincode } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase().trim();
    if (db.users.get('users').find({ email: emailLower }).value()) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const validRoles = [ROLES.PATIENT, ROLES.DOCTOR];
    const userRole   = validRoles.includes(role) ? role : ROLES.PATIENT;

    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = {
      id:        genId(),
      name:      name.trim(),
      email:     emailLower,
      password:  hashed,
      role:      userRole,
      createdAt: new Date().toISOString(),
    };

    // Attach optional health/lifestyle/location fields (patient signup)
    if (age !== undefined)                 newUser.age                 = Number(age);
    if (gender)                            newUser.gender              = gender;
    if (height !== undefined)              newUser.height              = Number(height);
    if (weight !== undefined)              newUser.weight              = Number(weight);
    if (blood_group)                       newUser.blood_group         = blood_group;
    if (is_smoker !== undefined)           newUser.is_smoker           = !!is_smoker;
    if (is_alcohol !== undefined)          newUser.is_alcohol          = !!is_alcohol;
    if (physical_activity)                 newUser.physical_activity   = physical_activity;
    if (sleep_hours !== undefined)         newUser.sleep_hours         = Number(sleep_hours);
    if (Array.isArray(existing_conditions)) newUser.existing_conditions = existing_conditions;
    if (country)                           newUser.country             = country;
    if (state)                             newUser.state               = state;
    if (city)                              newUser.city                = city.trim();
    if (pincode)                           newUser.pincode             = pincode;

    db.users.get('users').push(newUser).write();

    // Create empty doctor profile if registering as doctor
    if (userRole === ROLES.DOCTOR) {
      db.doctor_profiles.get('profiles').push({
        userId:             newUser.id,
        specialization:     '',
        experience_years:   0,
        fees:               0,
        clinic_name:        '',
        clinic_address:     '',
        city:               '',
        bio:                '',
        availability:       {},
        is_online:          false,
        is_verified:        false,
        verification_status: VERIFICATION_STATUS.PENDING,
        rating:             0,
        total_reviews:      0,
        languages:          ['English'],
        consultation_types: ['in_person'],
        rejection_reason:   '',
      }).write();
    }

    const token = genToken(newUser);
    res.status(201).json({ message: 'Registration successful', token, user: safe(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// ── POST /api/auth/login ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // expectedRole is required — every login portal must identify itself.
    // This prevents issuing tokens through un-gated API calls.
    const validLoginRoles = [ROLES.PATIENT, ROLES.DOCTOR];
    if (!expectedRole || !validLoginRoles.includes(expectedRole)) {
      return res.status(400).json({ error: 'Login portal must specify a valid role (patient or doctor).' });
    }

    const user = db.users.get('users').find({ email: email.toLowerCase().trim() }).value();
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    // Strict role gate — the user's role MUST match the portal they used.
    // Tell them exactly which portal to use so they aren't stuck.
    if (user.role !== expectedRole) {
      const roleLabels = { patient: 'Patient', doctor: 'Doctor', admin: 'Admin' };
      const actualLabel   = roleLabels[user.role] || user.role;
      const expectedLabel = roleLabels[expectedRole] || expectedRole;
      const portalHints   = { patient: '/login/patient', doctor: '/login/doctor', admin: '/login/admin' };
      return res.status(403).json({
        error: `This email is registered as ${actualLabel}, not ${expectedLabel}. Please login from the ${actualLabel} portal.`,
        actualRole: user.role,
        correctPortal: portalHints[user.role] || '/select-role',
      });
    }

    const token = genToken(user);
    res.json({ message: 'Login successful', token, user: safe(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// ── GET /api/auth/me ────────────────────────────────────────────────────────
exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

// ── POST /api/auth/logout ───────────────────────────────────────────────────
exports.logout = (_req, res) => {
  // JWT is stateless — client drops the token; server just confirms.
  res.json({ message: 'Logged out successfully' });
};

// ── PUT /api/auth/profile ───────────────────────────────────────────────────
exports.updateProfile = (req, res) => {
  const allowed = [
    'name', 'age', 'gender', 'height', 'weight', 'blood_group',
    'allergies', 'existing_conditions', 'is_smoker', 'is_alcohol',
    'physical_activity', 'sleep_hours',
    'country', 'state', 'city', 'pincode',
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  db.users.get('users').find({ id: req.user.id }).assign(updates).write();
  const updated = db.users.get('users').find({ id: req.user.id }).value();
  res.json({ user: safe(updated), message: 'Profile updated' });
};
