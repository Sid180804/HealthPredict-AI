import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
    const location = useLocation();

    // Map route to title
    const getTitle = (pathname) => {
        switch (pathname) {
            case '/dashboard': return 'Health Overview';
            case '/predict': return 'AI Disease Prediction';
            case '/ocr': return 'Prescription Digitizer';
            case '/orders': return 'Medicine Store';
            case '/chat': return 'Health Assistant';
            case '/profile': return 'My Profile';
            default: return 'Dashboard';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100 selection:bg-primary-200 transition-colors duration-300">
            <Sidebar />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header title={getTitle(location.pathname)} />

                <main className="flex-1 p-4 lg:p-8 animate-fade-in">
                    <div className="glass-panel min-h-[calc(100vh-8rem)] p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
