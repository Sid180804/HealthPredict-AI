const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path     = require('path');
const fs       = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const adapter = (name) => new FileSync(path.join(dataDir, `${name}.json`));

const db = {
  users:           low(adapter('users')),
  orders:          low(adapter('orders')),
  doctor_profiles: low(adapter('doctor_profiles')),
  appointments:    low(adapter('appointments')),
};

// Set defaults (safe on existing files)
db.users.defaults({ users: [] }).write();
db.orders.defaults({ orders: [] }).write();
db.doctor_profiles.defaults({ profiles: [] }).write();
db.appointments.defaults({ appointments: [] }).write();

module.exports = db;
