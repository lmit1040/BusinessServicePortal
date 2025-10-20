import { LogOut, Building2, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Business Services Portal</h1>
              {profile.is_admin && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Shield className="w-3 h-3" />
                  <span>Admin Access</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <User className="w-4 h-4" />
                {profile.full_name || profile.email}
              </div>
              {profile.company_name && (
                <p className="text-xs text-slate-500">{profile.company_name}</p>
              )}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
