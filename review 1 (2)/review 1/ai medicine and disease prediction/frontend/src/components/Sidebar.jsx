import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    HomeIcon,
    BeakerIcon,
    DocumentTextIcon,
    ShoppingBagIcon,
    ChatBubbleLeftRightIcon,
    UserIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { key: 'sidebar_dashboard', href: '/dashboard', icon: HomeIcon },
    { key: 'sidebar_disease_ai', href: '/predict', icon: BeakerIcon },
    { key: 'sidebar_prescriptions', href: '/ocr', icon: DocumentTextIcon },
    { key: 'sidebar_medicine_orders', href: '/orders', icon: ShoppingBagIcon },
    { key: 'sidebar_health_assistant', href: '/chat', icon: ChatBubbleLeftRightIcon },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 glass-panel m-4 border-r-0 dark:bg-slate-900/95 dark:border-slate-700/50 transition-colors duration-300">
            <div className="flex items-center justify-center h-20 border-b border-white/20 dark:border-slate-700/50">
                <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">
                    HealthPredict
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.key}
                            to={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/60 hover:text-primary-600 dark:hover:text-white'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-slate-200'}`}
                                aria-hidden="true"
                            />
                            {t(item.key)}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
                <Link
                    to="/profile"
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/60 transition-all mb-2"
                >
                    <UserIcon className="mr-3 h-6 w-6 text-slate-400 dark:text-slate-500" />
                    {t('common_profile')}
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all"
                >
                    <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-red-400" />
                    {t('common_logout')}
                </button>
            </div>
        </div>
    );
}
