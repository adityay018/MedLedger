import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  Building2, 
  Mail, 
  User, 
  FileText,
  CheckCircle2
} from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      await refreshProfile();
      setRefreshMsg('Profile refreshed. If your account was approved, your dashboard will load automatically.');
    } catch (err) {
      setRefreshMsg('Unable to refresh status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const statusConfig = {
    PENDING: {
      icon: Clock,
      title: 'Registration Pending Approval',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Your MedLedger account registration has been submitted and is awaiting verification by an authorized Administrator. In accordance with FDA 21 CFR Part 11 and DSCSA compliance standards, an administrator must verify your supply chain credentials and assign your organization party identifier before access is granted.',
      accentBorder: 'border-amber-300',
      badge: 'PENDING APPROVAL'
    },
    SUSPENDED: {
      icon: AlertTriangle,
      title: 'Account Temporarily Suspended',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      description: 'Your MedLedger supply-chain access has been suspended by a compliance administrator. Access to manufacturing records, shipments, and dispensing events is restricted pending regulatory review.',
      accentBorder: 'border-rose-300',
      badge: 'ACCOUNT SUSPENDED'
    },
    REJECTED: {
      icon: XCircle,
      title: 'Registration Declined',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Your registration request was reviewed and could not be approved with the provided supply chain credentials. Please contact the system administrator if you believe this was an error.',
      accentBorder: 'border-slate-300',
      badge: 'REGISTRATION REJECTED'
    }
  };

  const currentStatus = statusConfig[user?.status] || statusConfig.PENDING;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-md shadow-forest-900/10">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">MedLedger</span>
            <span className="text-xs text-slate-500 block font-medium">Enterprise Supply Chain Platform</span>
          </div>
        </div>

        {/* Card */}
        <div className={`bg-white rounded-2xl border ${currentStatus.accentBorder} shadow-lg p-6 sm:p-8 space-y-6`}>
          {/* Status Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border border-slate-200">
              <StatusIcon className={`w-8 h-8 ${user?.status === 'SUSPENDED' ? 'text-rose-600' : user?.status === 'REJECTED' ? 'text-slate-600' : 'text-amber-600'}`} />
            </div>
            
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${currentStatus.badgeColor}`}>
                {currentStatus.badge}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{currentStatus.title}</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              {currentStatus.description}
            </p>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Registration Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Full Name</span>
                  <span className="font-semibold text-slate-800">{user?.fullName || 'Not provided'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Email Address</span>
                  <span className="font-semibold text-slate-800">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Organization</span>
                  <span className="font-semibold text-slate-800">{user?.organizationNotes || user?.organizationName || 'Pending Assignment'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Requested Role</span>
                  <span className="font-semibold text-slate-800 uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {user?.requestedRole || user?.role || 'MANUFACTURER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Refresh feedback */}
          {refreshMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{refreshMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:flex-1 py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={logout}
              className="w-full sm:w-auto py-2.5 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Security note */}
          <p className="text-[11px] text-center text-slate-400">
            For urgent provisioning inquiries or verification assistance, contact the system administrator at <span className="font-mono text-slate-600">admin@medledger.io</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
