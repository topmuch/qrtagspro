'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  MessageCircle,
  Search,
  User,
  AlertTriangle,
  Home,
  CheckCircle,
  Moon,
  Sun,
  HelpCircle,
  LogIn,
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Demo agency data - used as fallback
export const DEMO_AGENCY = {
  id: 'demo-agency-1',
  name: 'FRANCINE MAKELA',
  slug: 'diop',
  email: 'contact@francine-makela.com',
  phone: '+221 77 123 45 67',
  address: 'Dakar, Sénégal',
  agencyType: 'generic' as string | null,
  contactPhone: null as string | null,
};

// Agency Context for sharing agency data across pages
interface AgencyContextType {
  agencyId: string;
  agencyName: string;
  agencyType: string | null;
  contactPhone: string | null;
  agencyData: typeof DEMO_AGENCY | null;
  userName: string;
  userEmail: string;
}

export const AgencyContext = createContext<AgencyContextType>({
  agencyId: DEMO_AGENCY.id,
  agencyName: DEMO_AGENCY.name,
  agencyType: DEMO_AGENCY.agencyType,
  contactPhone: DEMO_AGENCY.contactPhone,
  agencyData: null,
  userName: '',
  userEmail: ''
});

export const useAgency = () => useContext(AgencyContext);

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

// QRTagsPro V1 — Sidebar
function Sidebar({
  isOpen,
  setIsOpen,
  unreadMessages,
  onLogout,
  userName,
  agencySlug,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadMessages?: number;
  onLogout: () => void;
  userName: string;
  agencySlug: string;
}) {
  const pathname = usePathname();

  // QRTagsPro V1 — menu réduit (hôtel)
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <Home className="w-5 h-5" />,          href: "/agence/tableau-de-bord" },
    { label: "Check-in",        icon: <LogIn className="w-5 h-5" />,          href: "/agence/check-in" },
    { label: "QR actifs",       icon: <QrCode className="w-5 h-5" />,         href: "/agence/baggages" },
    { label: "Objets perdus",   icon: <AlertTriangle className="w-5 h-5" />,  href: "/agence/perdus" },
    { label: "Trouvailles",     icon: <CheckCircle className="w-5 h-5" />,    href: "/agence/trouvailles" },
    { label: "Assistance",      icon: <MessageCircle className="w-5 h-5" />,  href: "/agence/assistance", badge: unreadMessages },
    { label: "Profil",          icon: <User className="w-5 h-5" />,           href: "/agence/profil" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar — QRTagsPro black background */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-[#111111]
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-2xl
      `}>
        {/* Close button (mobile) */}
        <div className="p-4 lg:hidden flex justify-end">
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agency Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
            <div className="w-10 h-10 rounded-full bg-[#E3B23C] flex items-center justify-center">
              <span className="text-black font-semibold text-sm">
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Agence'}</p>
              <p className="text-xs text-white/60">@{agencySlug || 'agence'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href ||
                (item.href !== '/agence/tableau-de-bord' && pathname.startsWith(item.href));

              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isActive
                        ? 'bg-[#E3B23C] text-black shadow-lg'
                        : 'bg-black/40 text-white hover:bg-black/60 hover:text-[#E3B23C]'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Separator */}
            <li className="my-3 border-t border-white/20" />

            {/* Contacter (shortcut to assistance) */}
            <li>
              <Link
                href="/agence/assistance"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/30 text-white hover:bg-black/40 hover:text-[#E3B23C] transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Contacter</span>
              </Link>
            </li>

            {/* Déconnexion */}
            <li>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-rose-500/20 text-white hover:bg-rose-500/30 transition-all duration-200 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Déconnexion</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

// Header Component
function Header({
  unreadMessages,
  onMenuClick,
  userName,
}: {
  unreadMessages?: number;
  onMenuClick: () => void;
  userName: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un QR…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Quick links (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/agence/perdus"
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium transition-colors border border-rose-200 dark:border-rose-800"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden xl:inline">Perdus</span>
            </Link>
            <Link
              href="/agence/trouvailles"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#111111]/10 hover:bg-[#111111]/20 text-[#111111] dark:text-[#111111] rounded-xl text-sm font-medium transition-colors border border-[#111111]/20 dark:border-[#111111]/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden xl:inline">Trouvailles</span>
            </Link>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#E3B23C]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <Link
            href="/agence/assistance"
            className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {(unreadMessages ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {(unreadMessages ?? 0) > 9 ? '9+' : (unreadMessages ?? 0)}
              </span>
            )}
          </Link>

          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-[#111111] flex items-center justify-center">
              <span className="text-[#E3B23C] font-semibold text-sm">
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || 'Agence'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agence partenaire</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AgencyRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, loading, logout, isAgency } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not agency
  useEffect(() => {
    if (loading) return;

    // Skip redirect for login page
    if (pathname === '/agence/connexion') return;

    if (!user) {
      router.replace('/agence/connexion');
      return;
    }

    if (!isAgency) {
      // User is authenticated but not agency - redirect to admin area
      router.replace('/admin/tableau-de-bord');
    }
  }, [user, loading, isAgency, router, pathname]);

  // Fetch unread messages count
  useEffect(() => {
    if (!user || !isAgency || pathname === '/agence/connexion') return;

    const fetchUnreadCount = async () => {
      try {
        const currentAgencyId = user?.agencyId || user?.agency?.id;
        if (!currentAgencyId) return; // Skip if no agency ID
        const res = await fetch(`/api/agency/messages?agencyId=${currentAgencyId}&count=true`);
        if (!res.ok) return; // Don't crash on API error
        const data = await res.json();
        if (data.unreadCount !== undefined) {
          setUnreadMessages(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, isAgency, pathname]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.replace('/agence/connexion');
  };

  // Get the actual agency ID from user data — no hardcoded fallback
  const agencyId = user?.agencyId || user?.agency?.id || '';
  const agencyName = user?.agency?.name || user?.name || DEMO_AGENCY.name;
  const agencySlug = user?.agency?.slug || DEMO_AGENCY.slug;
  const agencyType = user?.agency?.agencyType || null;
  const contactPhone = user?.agency?.contactPhone || user?.agency?.phone || null;
  const agencyData = user?.agency ? {
    id: user.agency.id,
    name: user.agency.name,
    slug: user.agency.slug,
    email: user.agency.email || DEMO_AGENCY.email,
    phone: user.agency.phone || DEMO_AGENCY.phone,
    address: user.agency.address || DEMO_AGENCY.address,
    agencyType: user.agency.agencyType || null,
    contactPhone: user.agency.contactPhone || null,
  } : null;

  // Don't wrap login page with sidebar
  if (pathname === '/agence/connexion') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAgency) {
    return null;
  }

  return (
    <AgencyContext.Provider value={{
      agencyId,
      agencyName,
      agencyType,
      contactPhone,
      agencyData: agencyData || DEMO_AGENCY,
      userName: user.name || 'Agence',
      userEmail: user.email
    }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          unreadMessages={unreadMessages}
          onLogout={handleLogout}
          userName={user.name || 'Agence'}
          agencySlug={agencySlug}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            unreadMessages={unreadMessages}
            onMenuClick={() => setSidebarOpen(true)}
            userName={user.name || 'Agence'}
          />

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AgencyContext.Provider>
  );
}
