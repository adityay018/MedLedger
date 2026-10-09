import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function UserManagementPage({ onToast }) {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Approval modal state
  const [selectedPendingUser, setSelectedPendingUser] = useState(null);
  const [approvalRole, setApprovalRole] = useState('MANUFACTURER');
  const [approvalPartyId, setApprovalPartyId] = useState('');
  const [approving, setApproving] = useState(false);

  // Role edit modal state
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [newRole, setNewRole] = useState('MANUFACTURER');
  const [savingRole, setSavingRole] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, partiesRes] = await Promise.all([
        api.getUsers(),
        api.getPendingRegistrations(),
        api.getParties()
      ]);

      setUsers(usersRes.data || []);
      setPendingUsers(pendingRes.data || []);
      setParties(partiesRes.data || []);
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || 'Failed to load user records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openApproveModal = (u) => {
    setSelectedPendingUser(u);
    setApprovalRole(u.requestedRole || 'MANUFACTURER');
    // Pre-select party if matching party found
    if (u.partyId) {
      setApprovalPartyId(String(u.partyId));
    } else {
      setApprovalPartyId('');
    }
  };

  const handleApprove = async () => {
    if (!selectedPendingUser) return;
    setApproving(true);
    try {
      await api.approveUser(selectedPendingUser.id, {
        role: approvalRole,
        partyId: approvalPartyId ? Number(approvalPartyId) : null
      });

      if (onToast) {
        onToast({ 
          type: 'success', 
          message: `Approved ${selectedPendingUser.fullName || selectedPendingUser.email} as ${approvalRole}` 
        });
      }
      setSelectedPendingUser(null);
      await loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || 'Failed to approve user' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (u) => {
    if (!window.confirm(`Are you sure you want to decline registration for ${u.fullName || u.email}?`)) {
      return;
    }
    try {
      await api.rejectUser(u.id, { reason: 'Credentials could not be verified' });
      if (onToast) onToast({ type: 'success', message: `Rejected registration for ${u.email}` });
      await loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || 'Failed to reject registration' });
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    const actionName = nextStatus === 'SUSPENDED' ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionName} account for ${u.fullName || u.email}?`)) {
      return;
    }

    try {
      await api.updateUserStatus(u.id, nextStatus);
      if (onToast) {
        onToast({ 
          type: 'success', 
          message: `Account ${actionName === 'suspend' ? 'suspended' : 'reactivated'} successfully` 
        });
      }
      await loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || `Failed to ${actionName} account` });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUserRole) return;
    setSavingRole(true);
    try {
      await api.updateUserRole(editingUserRole.id, newRole);
      if (onToast) onToast({ type: 'success', message: `Role updated to ${newRole}` });
      setEditingUserRole(null);
      await loadData();
    } catch (err) {
      if (onToast) onToast({ type: 'error', message: err.message || 'Failed to update user role' });
    } finally {
      setSavingRole(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesQuery = 
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANUFACTURER': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DISTRIBUTOR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PHARMACY': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REGULATOR': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUSPENDED': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'REJECTED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity & Access Control (RBAC)</h1>
              <p className="text-xs text-slate-500">
                User lifecycle management, registration approval queue, role delegation, and organization party assignment
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors bg-white shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${loading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{users.length}</p>
          <span className="text-[11px] text-slate-400">Registered users in database</span>
        </div>

        <div 
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
            pendingUsers.length > 0 
              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50' 
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-amber-700">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{pendingUsers.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Requires administrator action</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Active Approved</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {users.filter(u => u.status === 'APPROVED').length}
          </p>
          <span className="text-[11px] text-slate-400">Authorized supply-chain actors</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Suspended Accounts</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {users.filter(u => u.status === 'SUSPENDED').length}
          </p>
          <span className="text-[11px] text-slate-400">Access disabled for compliance</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-forest-800 text-forest-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals Queue</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'all'
              ? 'border-forest-800 text-forest-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All User Accounts ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Approval Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No pending registration requests. When new supply chain participants submit public registrations, they will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((u) => (
                <div 
                  key={u.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{u.fullName || 'Anonymous Applicant'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-800 border-amber-200">
                      PENDING
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested Role:</span>
                      <span className="font-bold text-slate-800 uppercase">{u.requestedRole || 'MANUFACTURER'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Organization / Notes:</span>
                      <span className="font-medium text-slate-800 text-right">{u.organizationNotes || 'None specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted:</span>
                      <span className="text-slate-600">{new Date(u.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => openApproveModal(u)}
                      className="flex-1 py-2 px-3 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review & Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(u)}
                      className="py-2 px-3 border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL USERS DIRECTORY */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts by name, email, or organization..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="REGULATOR">Regulator</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Account / User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Organization Party</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                        No user accounts match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{u.fullName || u.username}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold border text-[11px] ${getRoleBadgeStyle(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {u.organizationName ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.organizationName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{u.partyId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold border text-[10px] ${getStatusBadgeStyle(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {/* Role Change */}
                          <button
                            onClick={() => {
                              setEditingUserRole(u);
                              setNewRole(u.role);
                            }}
                            title="Change Role"
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Reactivate */}
                          {u.status === 'APPROVED' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title="Suspend Account"
                              className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title="Reactivate Account"
                              className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700 transition-colors"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {selectedPendingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Approve Registration Request</h3>
              </div>
              <button 
                onClick={() => setSelectedPendingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <p className="font-bold text-slate-800 text-sm">{selectedPendingUser.fullName || selectedPendingUser.email}</p>
                <p className="text-slate-500 font-mono">{selectedPendingUser.email}</p>
                <p className="text-slate-600 pt-1">
                  Applicant Notes: <span className="font-medium text-slate-800">{selectedPendingUser.organizationNotes || 'None'}</span>
                </p>
              </div>

              {/* Assign Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Assign Final Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approvalRole}
                  onChange={(e) => setApprovalRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
                >
                  <option value="MANUFACTURER">Manufacturer (Create batches, run QA tests)</option>
                  <option value="DISTRIBUTOR">Distributor (Manage custody & shipments)</option>
                  <option value="PHARMACY">Pharmacy (Verify packages & dispense to patients)</option>
                  <option value="REGULATOR">Regulator (Recall enforcement & compliance intelligence)</option>
                  <option value="ADMINISTRATOR">Administrator (Full administrative privileges)</option>
                </select>
              </div>

              {/* Assign Organization Party */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Assign Organization / Party Identifier
                </label>
                <select
                  value={approvalPartyId}
                  onChange={(e) => setApprovalPartyId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
                >
                  <option value="">No Organization Binding (e.g., Regulator / Admin)</option>
                  {parties.map((p) => (
                    <option key={p.party_id} value={p.party_id}>
                      #{p.party_id} — {p.party_name} ({p.party_type})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Enforces multi-organization scoping. The user will only be permitted to edit records owned by this party.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-2.5 px-4 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{approving ? 'Confirming Approval...' : 'Confirm Approval & Authorize'}</span>
              </button>
              <button
                onClick={() => setSelectedPendingUser(null)}
                className="py-2.5 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingUserRole && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Modify User Role</h3>
            <p className="text-xs text-slate-500">
              Update authorized role for <span className="font-semibold text-slate-800">{editingUserRole.fullName || editingUserRole.email}</span>.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Select Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
              >
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="REGULATOR">Regulator</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleUpdateRole}
                disabled={savingRole}
                className="flex-1 py-2 px-4 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {savingRole ? 'Saving...' : 'Update Role'}
              </button>
              <button
                onClick={() => setEditingUserRole(null)}
                className="py-2 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
