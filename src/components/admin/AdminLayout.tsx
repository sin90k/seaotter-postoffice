import { ArrowLeft, LayoutDashboard, Users, CreditCard, ImageIcon, Settings, FileText, Palette, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AdminPage = 'dashboard' | 'users' | 'credits' | 'postcards' | 'prompts' | 'brand' | 'filters' | 'settings';

const nav: { id: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'credits', label: 'Credits Ledger', icon: CreditCard },
  { id: 'postcards', label: 'Postcards', icon: ImageIcon },
  { id: 'prompts', label: 'AI Prompts', icon: FileText },
  { id: 'brand', label: 'Brand Settings', icon: Palette },
   { id: 'filters', label: 'Photo Filters', icon: SlidersHorizontal },
  { id: 'settings', label: 'System Config', icon: Settings },
];

export default function AdminLayout({
  currentPage,
  onPageChange,
  onBack,
  children,
}: {
  currentPage: AdminPage;
  onPageChange: (p: AdminPage) => void;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto flex gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 animate-in fade-in duration-300 bg-stone-50 min-h-screen">
      <aside className="w-48 sm:w-52 shrink-0 flex flex-col gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-white text-stone-600 hover:text-stone-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to App</span>
        </button>
        <nav className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onPageChange(id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-stone-100 last:border-b-0',
                currentPage === id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
