import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import CustomerSupportWidget from './components/CustomerSupportWidget';

// Role-based auth pages (small — keep eager)
import RoleSelector  from './pages/RoleSelector';
import PatientLogin  from './pages/PatientLogin';
import PatientSignup from './pages/PatientSignup';
import DoctorLogin   from './pages/DoctorLogin';
import DoctorSignup  from './pages/DoctorSignup';
import AdminLogin    from './pages/AdminLogin';

// Patient pages — lazy loaded for bundle splitting
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Predict     = lazy(() => import('./pages/Predict'));
const Chat        = lazy(() => import('./pages/Chat'));
const OCR         = lazy(() => import('./pages/OCR'));
const HealthScore  = lazy(() => import('./pages/HealthScore'));
const Orders      = lazy(() => import('./pages/Orders'));
const Profile     = lazy(() => import('./pages/Profile'));
const WomensHealthDashboard = lazy(() => import('./pages/WomensHealthDashboard'));
const MentalWellness = lazy(() => import('./pages/MentalWellness'));
const MedicineInteractions = lazy(() => import('./pages/MedicineInteractions'));
const HealthTimeline = lazy(() => import('./pages/HealthTimeline'));
const Emergency = lazy(() => import('./pages/Emergency'));
const FamilyHealth = lazy(() => import('./pages/FamilyHealth'));
const ReportAnalyzer = lazy(() => import('./pages/ReportAnalyzer'));
const LifestyleCoach = lazy(() => import('./pages/LifestyleCoach'));
const BookDoctor = lazy(() => import('./pages/BookDoctor'));
const AppointmentHistory = lazy(() => import('./pages/AppointmentHistory'));
const DoctorList = lazy(() => import('./pages/DoctorList'));
const PrescriptionPage = lazy(() => import('./pages/PrescriptionPage'));

// Role dashboards — lazy loaded
const DoctorDashboard = lazy(() => import('./modules/doctor/DoctorDashboard'));
const DoctorOnboard   = lazy(() => import('./modules/doctor/DoctorOnboard'));
const AdminDashboard  = lazy(() => import('./modules/admin/AdminDashboard'));

// Auth guard
import ProtectedRoute from './components/ProtectedRoute';

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
    <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/** Redirects an already-authenticated user to their role's home. */
function PublicOnly({ children }) {
  const { isAuthenticated, loading, homePath } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={homePath} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <CustomerSupportWidget />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Default: role selector ── */}
          <Route path="/" element={<PublicOnly><RoleSelector /></PublicOnly>} />

          {/* ── Legacy auth ── */}
          <Route path="/login"    element={<Navigate to="/select-role" replace />} />
          <Route path="/register" element={<Navigate to="/select-role" replace />} />

          {/* ── Role-based auth ── */}
          <Route path="/select-role"   element={<PublicOnly><RoleSelector /></PublicOnly>} />
          <Route path="/login/patient" element={<PublicOnly><PatientLogin /></PublicOnly>} />
          <Route path="/signup/patient" element={<PublicOnly><PatientSignup /></PublicOnly>} />
          <Route path="/login/doctor"  element={<PublicOnly><DoctorLogin /></PublicOnly>} />
          <Route path="/signup/doctor" element={<PublicOnly><DoctorSignup /></PublicOnly>} />
          <Route path="/login/admin"   element={<PublicOnly><AdminLogin /></PublicOnly>} />

          {/* ── Patient ── */}
          <Route path="/dashboard"   element={<ProtectedRoute roles={['patient']}><Dashboard /></ProtectedRoute>} />
          <Route path="/predict"     element={<ProtectedRoute roles={['patient']}><Predict /></ProtectedRoute>} />
          <Route path="/chat"        element={<ProtectedRoute roles={['patient']}><Chat /></ProtectedRoute>} />
          <Route path="/ocr"         element={<ProtectedRoute roles={['patient']}><OCR /></ProtectedRoute>} />
          <Route path="/health-score" element={<ProtectedRoute roles={['patient']}><HealthScore /></ProtectedRoute>} />
          <Route path="/orders"      element={<ProtectedRoute roles={['patient']}><Orders /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/womens-health" element={<ProtectedRoute roles={['patient']}><WomensHealthDashboard /></ProtectedRoute>} />
          <Route path="/mental-wellness" element={<ProtectedRoute roles={['patient']}><MentalWellness /></ProtectedRoute>} />
          <Route path="/medicine-interactions" element={<ProtectedRoute roles={['patient']}><MedicineInteractions /></ProtectedRoute>} />
          <Route path="/health-timeline" element={<ProtectedRoute roles={['patient']}><HealthTimeline /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute roles={['patient']}><Emergency /></ProtectedRoute>} />
          <Route path="/family-health" element={<ProtectedRoute roles={['patient']}><FamilyHealth /></ProtectedRoute>} />
          <Route path="/report-analyzer" element={<ProtectedRoute roles={['patient']}><ReportAnalyzer /></ProtectedRoute>} />
          <Route path="/lifestyle-coach" element={<ProtectedRoute roles={['patient']}><LifestyleCoach /></ProtectedRoute>} />
          <Route path="/book-doctor" element={<ProtectedRoute roles={['patient']}><BookDoctor /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute roles={['patient']}><AppointmentHistory /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute roles={['patient']}><DoctorList /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute roles={['patient']}><PrescriptionPage /></ProtectedRoute>} />

          {/* ── Doctor ── */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/onboard"   element={<ProtectedRoute roles={['doctor']}><DoctorOnboard /></ProtectedRoute>} />

          {/* ── Admin ── */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
