import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Search,
  Shield,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react'

import {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUserAccount,
  type ManagedUser,
  type UserDetailsResponse,
} from '../../services/adminService'
import { ROUTES } from '../../routes/routePaths'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function AdminUserManagementPage() {
  usePageTitle('Account Directory')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [inspectUserId, setInspectUserId] = useState<string | null>(null)
  const [inspectData, setInspectData] = useState<UserDetailsResponse | null>(null)
  const [inspectLoading, setInspectLoading] = useState(false)

  const [statusModalUser, setStatusModalUser] = useState<ManagedUser | null>(null)
  const [newStatus, setNewStatus] = useState<ManagedUser['accountStatus']>('active')
  const [statusReason, setStatusReason] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  const [roleModalUser, setRoleModalUser] = useState<ManagedUser | null>(null)
  const [newRole, setNewRole] = useState<ManagedUser['role']>('patient')
  const [roleUpdating, setRoleUpdating] = useState(false)

  const [deleteModalUser, setDeleteModalUser] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')

      const list = await getAllUsers({
        role: roleFilter,
        status: statusFilter,
        search,
      })
      setUsers(list)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve user directory. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [roleFilter, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
  usePageTitle('Account Directory')
    e.preventDefault()
    void loadUsers()
  }

  // Open user details drawer
  const handleInspectUser = async (userId: string) => {
    setInspectUserId(userId)
    setInspectLoading(true)
    try {
      const details = await getUserDetails(userId)
      setInspectData(details)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not fetch user profile details.'
      )
    } finally {
      setInspectLoading(false)
    }
  }

  // Confirm status update
  const handleSaveStatus = async () => {
    if (!statusModalUser) return
    try {
      setStatusUpdating(true)
      setError('')
      setSuccess('')

      const message = await updateUserStatus(
        statusModalUser.uid,
        newStatus,
        statusReason
      )
      setSuccess(message)
      setStatusModalUser(null)
      await loadUsers(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setStatusUpdating(false)
    }
  }

  // Confirm role update
  const handleSaveRole = async () => {
    if (!roleModalUser) return
    try {
      setRoleUpdating(true)
      setError('')
      setSuccess('')

      const message = await updateUserRole(roleModalUser.uid, newRole)
      setSuccess(message)
      setRoleModalUser(null)
      await loadUsers(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role update failed.')
    } finally {
      setRoleUpdating(false)
    }
  }

  // Confirm account deletion
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return
    try {
      setDeleting(true)
      setError('')
      setSuccess('')

      const message = await deleteUserAccount(deleteModalUser.uid)
      setSuccess(message)
      setDeleteModalUser(null)
      await loadUsers(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account deletion failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to={ROUTES.ADMIN_DASHBOARD} className="hover:text-indigo-600 transition">
          Admin Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-800">Account Governance Directory</span>
      </div>

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account Governance Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Browse all platform accounts, audit permissions, manage active/suspended states, and inspect health vaults.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}

      {/* FILTERS & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, specialization, or council reg no..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Role:</span>
            {['all', 'patient', 'doctor', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                  roleFilter === r
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="font-semibold text-slate-500">Status:</span>
            {['all', 'active', 'pending', 'rejected', 'suspended'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* USER DIRECTORY TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 size={36} className="mx-auto animate-spin text-indigo-600" />
            <p className="mt-4 text-xs font-medium text-slate-600">
              Loading user directory...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={36} className="mx-auto text-slate-300" />
            <p className="mt-4 font-semibold text-slate-800">No users found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">User</th>
                  <th className="px-6 py-3.5 font-semibold">Role</th>
                  <th className="px-6 py-3.5 font-semibold">Account Status</th>
                  <th className="px-6 py-3.5 font-semibold">Registration Info</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              u.role === 'doctor'
                                ? 'bg-indigo-100 text-indigo-700'
                                : u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.role === 'doctor' ? `Dr. ${u.name}` : u.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            u.role === 'doctor'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.role === 'doctor' && <Stethoscope size={11} />}
                          {u.role === 'admin' && <Shield size={11} />}
                          {u.role === 'patient' && <Activity size={11} />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            u.accountStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.accountStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : u.accountStatus === 'suspended'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.accountStatus === 'active'
                                ? 'bg-emerald-500'
                                : u.accountStatus === 'pending'
                                ? 'bg-amber-500'
                                : u.accountStatus === 'suspended'
                                ? 'bg-slate-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {u.role === 'doctor' ? (
                          <div className="space-y-0.5">
                            <p className="font-mono font-medium text-slate-800">
                              {u.registrationNumber || 'No reg number'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {u.specialization || 'General practice'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-slate-700">{u.phone || 'Phone not set'}</p>
                            <p className="text-[11px] text-slate-400">
                              Auth: {u.authProvider || 'password'}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInspectUser(u.uid)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Inspect Profile"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalUser(u)
                              setNewStatus(u.accountStatus)
                              setStatusReason('')
                            }}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            title="Manage Account Status"
                          >
                            Status
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(u)
                              setNewRole(u.role)
                            }}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            title="Manage Role"
                          >
                            Role
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalUser(u)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT USER MODAL DRAWER */}
      {inspectUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-7 space-y-5 animate-in fade-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">User Profile Audit</h3>
                  <p className="text-xs text-slate-500">UID: {inspectUserId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUserId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-12 text-center">
                <Loader2 size={32} className="mx-auto animate-spin text-indigo-600" />
                <p className="mt-3 text-xs text-slate-500">Querying user records...</p>
              </div>
            ) : inspectData ? (
              <div className="space-y-4 text-xs text-slate-700">
                {/* BASIC INFO */}
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1.5">
                  <p className="font-semibold text-slate-900">
                    {String(inspectData.user.name || 'Unnamed')} ({String(inspectData.user.email)})
                  </p>
                  <p>
                    <span className="text-slate-400">Role:</span>{' '}
                    <span className="font-semibold capitalize">{String(inspectData.user.role)}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Status:</span>{' '}
                    <span className="font-semibold capitalize">{String(inspectData.user.accountStatus)}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Created:</span>{' '}
                    {String(inspectData.user.createdAt || 'N/A')}
                  </p>
                </div>

                {/* PATIENT DETAILS */}
                {inspectData.user.role === 'patient' && (
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <p className="font-bold text-slate-900">Patient Health Vault</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                        <p className="text-slate-500">Medical Records</p>
                        <p className="text-lg font-bold text-emerald-800">
                          {inspectData.medicalHistoryCount ?? 0} entries
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                        <p className="text-slate-500">Uploaded Documents</p>
                        <p className="text-lg font-bold text-blue-800">
                          {inspectData.documentsCount ?? 0} files
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DOCTOR DETAILS */}
                {inspectData.user.role === 'doctor' && (
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <p className="font-bold text-slate-900">Doctor Licensing & Practice</p>
                    <div className="space-y-1.5 pt-1">
                      <p>
                        <span className="text-slate-400">Reg No:</span>{' '}
                        <span className="font-mono font-bold">{String(inspectData.user.registrationNumber || 'None')}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Council:</span>{' '}
                        {String(inspectData.user.issuingCouncil || 'Not provided')}
                      </p>
                      <p>
                        <span className="text-slate-400">Specialization:</span>{' '}
                        {String(inspectData.user.specialization || 'Not provided')}
                      </p>
                      <p>
                        <span className="text-slate-400">Workplace:</span>{' '}
                        {String(inspectData.user.workplaceName || 'Private Practice')}
                      </p>
                      <p>
                        <span className="text-slate-400">Approved Patients:</span>{' '}
                        <span className="font-bold text-indigo-700">{inspectData.approvedPatientsCount ?? 0}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectUserId(null)}
                className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Update Account Status
            </h3>
            <p className="text-xs text-slate-500">
              User: <span className="font-semibold text-slate-800">{statusModalUser.name}</span> ({statusModalUser.email})
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Select Account Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as ManagedUser['accountStatus'])
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-indigo-500"
              >
                <option value="active">Active (Full system access)</option>
                <option value="pending">Pending (Awaiting review / registration)</option>
                <option value="suspended">Suspended (Access immediately revoked)</option>
                <option value="rejected">Rejected (Application declined)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Reason / Audit Remark (optional):
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Audit explanation for this status change..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={statusUpdating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {statusUpdating && <Loader2 size={14} className="animate-spin" />}
                Apply Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE CHANGE MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Change User Role
            </h3>
            <p className="text-xs text-slate-500">
              User: <span className="font-semibold text-slate-800">{roleModalUser.name}</span> ({roleModalUser.email})
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Select Platform Role:
              </label>
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as ManagedUser['role'])
                }
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-indigo-500"
              >
                <option value="patient">Patient (Health Vault & AI Assistant)</option>
                <option value="doctor">Doctor (Clinical Portal & Prescription)</option>
                <option value="admin">Administrator (Governance & Verification)</option>
              </select>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Warning: Modifying a user's role alters their access permissions across RBAC boundaries immediately.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={roleUpdating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {roleUpdating && <Loader2 size={14} className="animate-spin" />}
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Delete Account Safeguard
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove this user record.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteModalUser.name}</span> ({deleteModalUser.email})? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
