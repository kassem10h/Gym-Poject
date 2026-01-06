import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Home, BarChart3, Users, Settings, Package, Menu, X, User, Warehouse, Dumbbell,
  Search, ChevronDown, LogOut, Bell, FileText, ShoppingCart, Receipt, Calendar, Wrench
} from 'lucide-react';
import AdminProductsPage from './admin/ProductManager'; 
import AdminEquipmentPage from './admin/EquipmentManager';
import AdminUsersPage from './admin/UserManagment';
import AdminOrdersPage from './admin/OrderManagment';
import AdminBookingsPage from './admin/AdminBookings';
import AdminTrainerManagement from './admin/AdminTrainers';
import AdminDashboard from './admin/AdminDashboard';
import ProductShopPage from './member/Products';
import EquipmentPage from './member/Equipments';
import SessionBookingPage from './member/SessionBooking';
import BookingsPage from './member/Bookings';
import TrainerSessionsPage from './trainer/SessionMangament';
import TrainerSchedulePage from './trainer/TrainerSchedule';
import TrainerProfile from './trainer/TrainerProfile';
import TrainerDashboard from './trainer/Dashboard';
import MembershipPage from './member/Membership';
import BMICalculator from './member/BMICalculator';
import MemberDashboard from './member/Dashboard';
import MemberProfilePage from './member/MemberProfile';
import NotificationBell from '../components/Notification';
import AdminCommandCenter from './admin/AdminAnalytics';

const Dashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropDownRef = useRef(null);
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  // Determine active tab from URL or default to 'dashboard'
  const activeTab = tab || 'dashboard';

  // Role-based navigation configuration
  const getNavItems = (role) => {
    const navigationByRole = {
      Admin: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'product-manager', label: 'Product Manager', icon: Package },
        { id: 'equipment-manager', label: 'Equipment Manager', icon: Warehouse },
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'trainer-management', label: 'Trainer Management', icon: Wrench },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'booking-management', label: 'Booking Manager', icon: Calendar },
      ],
      Member: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'products', label: 'Products', icon: ShoppingCart },
        { id: 'equipment', label: 'Equipment', icon: Dumbbell },
        { id: 'classes', label: 'Classes', icon: Users },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'my-membership', label: 'My Membership', icon: Receipt },
        { id: 'profile', label: 'Profile', icon: User },
      ],
      Trainer: [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'my-classes', label: 'My Classes', icon: Users },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'products', label: 'Products', icon: ShoppingCart },
        { id: 'equipment', label: 'Equipment', icon: Dumbbell },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    };

    return navigationByRole[role] || navigationByRole.Member;
  };

  const navItems = getNavItems(user.role);

  // Get the base path based on user role
  const getBasePath = () => {
    return `/${user.role.toLowerCase()}/dashboard`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    }
    window.location.href = '/login';
  }

  const handleTabChange = (tabId) => {
    const basePath = getBasePath();
    if (tabId === 'dashboard') {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${tabId}`);
    }
    setMobileMenuOpen(false);
  };

  const PlaceholderContent = ({ title }) => (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{title}</h1>
      <div className="bg-white border border-gray-200 p-8 rounded-xl text-center shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">Coming Soon</p>
          <p className="text-gray-500 text-sm mt-2">This section is under development.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Admin Pages
    if (user.role === 'Admin') {
      switch(activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'product-manager':
          return <AdminProductsPage />;
        case 'equipment-manager':
          return <AdminEquipmentPage />;
        case 'user-management':
          return <AdminUsersPage />;
        case 'orders':
          return <AdminOrdersPage />;
        case 'analytics':
          return <AdminCommandCenter />;
        case 'booking-management':
          return <AdminBookingsPage />;
        case 'trainer-management':
          return <AdminTrainerManagement />;
        default:
          return <PlaceholderContent title="Admin Dashboard" />;
      }
    }
    
    // Member Pages
    if (user.role === 'Member') {
      switch(activeTab) {
        case 'dashboard':
          return <MemberDashboard />;
        case 'products':
          return <ProductShopPage />;
        case 'equipment':
          return <EquipmentPage />;
        case 'classes':
          return <SessionBookingPage />;
        case 'bookings':
          return <BookingsPage />;
        case 'my-membership':
          return <MembershipPage />;
        case 'profile':
          return <MemberProfilePage />;
        default:
          return <PlaceholderContent title="Member Dashboard" />;
      }
    }
    
    // Trainer Pages
    if (user.role === 'Trainer') {
      switch(activeTab) {
        case 'dashboard':
          return <TrainerDashboard />;
        case 'my-classes':
          return <TrainerSessionsPage />;
        case 'schedule':
          return <TrainerSchedulePage />;
        case 'products':
          return <ProductShopPage />;
        case 'equipment':
          return <EquipmentPage />;
        case 'profile':
          return <TrainerProfile />;
        default:
          return <PlaceholderContent title="Trainer Dashboard" />;
      }
    }
    
    return <PlaceholderContent title="Dashboard" />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {(user.role === "Member" || user.role === "Trainer") && (
        <div className="fixed z-[100]">
          <BMICalculator />
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Kefah
              </h2>
              <p className="text-xs text-gray-500">{user.role} Portal</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.first_name?.charAt(0)?.toUpperCase()}{user.last_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <div className="relative" ref={dropDownRef}>
                <button
                  className="hidden sm:flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-200"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.first_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-800">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;