const ROLES = {
  PATIENT: 'patient',
  DOCTOR:  'doctor',
  ADMIN:   'admin',
};

const VERIFICATION_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const JWT_SECRET = process.env.JWT_SECRET || 'health-predict-secret-key-change-in-prod';
const JWT_EXPIRY = process.env.JWT_EXPIRY  || '24h';

module.exports = { ROLES, VERIFICATION_STATUS, JWT_SECRET, JWT_EXPIRY };
