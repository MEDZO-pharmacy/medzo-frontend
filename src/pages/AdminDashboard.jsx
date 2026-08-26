import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, LogOut, ShieldCheck, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  ApiError,
  approveStaffId,
  createUser,
  getDashboard,
  getStaffInvitations,
  setUserStatus,
} from '../services/authApi'

const emptyUser = {
  staffId: '', username: '', email: '', firstName: '', lastName: '',
  password: '', confirmPassword: '', role: 'Pharmacist', confirmPotentialDuplicate: false,
}
const emptyApproval = { staffId: '', role: 'Pharmacist' }
const rolePrefix = { Pharmacist: 'P', InventoryManager: 'I' }

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [dashboard, setDashboard] = useState({ users: [], modules: [], totalUsers: 0 })
  const [invitations, setInvitations] = useState([])
  const [userForm, setUserForm] = useState(emptyUser)
  const [approvalForm, setApprovalForm] = useState(emptyApproval)
  const [userMessage, setUserMessage] = useState({ type: '', text: '' })
  const [approvalMessage, setApprovalMessage] = useState({ type: '', text: '' })
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const [nextDashboard, nextInvitations] = await Promise.all([
      getDashboard('admin'), getStaffInvitations(),
    ])
    setDashboard(nextDashboard)
    setInvitations(nextInvitations)
  }, [])

  useEffect(() => { reload().catch(() => setUserMessage({ type: 'error', text: 'Admin data could not be loaded.' })) }, [reload])

  const changeUser = ({ target: { name, value } }) => {
    setUserForm((current) => ({ ...current, [name]: value, confirmPotentialDuplicate: false }))
    setDuplicateWarning(null)
    setUserMessage({ type: '', text: '' })
  }

  const submitUser = async (event, confirmDuplicate = false) => {
    event?.preventDefault()
    setBusy(true)
    setUserMessage({ type: '', text: '' })
    try {
      await createUser({ ...userForm, confirmPotentialDuplicate: confirmDuplicate })
      setUserMessage({ type: 'success', text: 'Staff account created successfully.' })
      setUserForm(emptyUser)
      setDuplicateWarning(null)
      await reload()
    } catch (error) {
      if (error instanceof ApiError && error.data?.code === 'potential_duplicate') {
        setDuplicateWarning(error.data)
        setUserMessage({ type: 'warning', text: error.data.message })
      } else {
        setUserMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Account could not be created.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const submitApproval = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await approveStaffId(approvalForm)
      setApprovalMessage({ type: 'success', text: 'Staff ID approved for signup.' })
      setApprovalForm(emptyApproval)
      await reload()
    } catch (error) {
      setApprovalMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Staff ID could not be approved.' })
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async (staff) => {
    setBusy(true)
    try {
      const updated = await setUserStatus(staff.id, !staff.isActive)
      setDashboard((current) => ({
        ...current,
        users: current.users.map((item) => item.id === updated.id ? updated : item),
      }))
    } finally {
      setBusy(false)
    }
  }

  const input = (name, label, type = 'text') => (
    <label className="text-sm font-semibold text-[#0a192f]">{label}
      <input required type={type} name={name} value={userForm[name]} onChange={changeUser} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal" />
    </label>
  )

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-[#0a192f] p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div><div className="mb-3 flex items-center gap-2 text-medzo-green"><ShieldCheck /> Secure staff administration</div><h1 className="text-3xl font-bold">Administrator Dashboard</h1><p className="mt-2 text-slate-300">Signed in as {user.firstName} · {user.staffId}</p></div>
          <button onClick={logout} className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-5 py-3 font-semibold"><LogOut size={18} /> Logout</button>
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <form onSubmit={submitUser} className="rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold"><UserPlus className="text-medzo-blue" /> Create staff account</h2>
            <p className="mt-2 text-sm text-slate-500">The selected role must match the Staff ID prefix.</p>
            {userMessage.text && <p role="alert" className={`mt-4 rounded-lg p-3 ${userMessage.type === 'success' ? 'bg-green-50 text-green-700' : userMessage.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>{userMessage.text}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {input('firstName', 'First name')}{input('lastName', 'Last name')}
              {input('username', 'Username')}{input('email', 'Email', 'email')}
              {input('staffId', `Staff ID (${rolePrefix[userForm.role]} prefix)`)}
              <label className="text-sm font-semibold">Role<select name="role" value={userForm.role} onChange={changeUser} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal"><option>Pharmacist</option><option value="InventoryManager">Inventory Manager</option></select></label>
              {input('password', 'Temporary password', 'password')}{input('confirmPassword', 'Confirm password', 'password')}
            </div>
            {duplicateWarning && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p>{duplicateWarning.duplicates?.map((item) => `${item.firstName} ${item.lastName} (${item.staffId || item.username})`).join(', ')}</p><button type="button" disabled={busy} onClick={() => submitUser(null, true)} className="mt-3 rounded-lg bg-amber-700 px-4 py-2 font-bold text-white">Create anyway</button></div>}
            <button disabled={busy} className="gradient-btn mt-5 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">Create account</button>
          </form>

          <form onSubmit={submitApproval} className="rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold">Pre-approve Staff ID for signup</h2>
            <p className="mt-2 text-sm text-slate-500">Only approved, unclaimed IDs can use public signup.</p>
            {approvalMessage.text && <p role="status" className={`mt-4 rounded-lg p-3 ${approvalMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{approvalMessage.text}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Staff ID<input required value={approvalForm.staffId} onChange={(e) => setApprovalForm((current) => ({ ...current, staffId: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal" placeholder={`${rolePrefix[approvalForm.role]}1001`} /></label>
              <label className="text-sm font-semibold">Role<select value={approvalForm.role} onChange={(e) => setApprovalForm((current) => ({ ...current, role: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-normal"><option>Pharmacist</option><option value="InventoryManager">Inventory Manager</option></select></label>
            </div>
            <button disabled={busy} className="gradient-btn mt-5 rounded-lg px-6 py-3 font-bold text-white disabled:opacity-60">Approve Staff ID</button>
            <div className="mt-6 max-h-52 overflow-auto space-y-2">{invitations.map((item) => <div key={item.id} className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm"><span className="font-bold">{item.staffId} · {item.role}</span><span className={item.isClaimed ? 'text-slate-500' : 'text-green-700'}>{item.isClaimed ? 'Claimed' : 'Available'}</span></div>)}</div>
          </form>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between p-6"><h2 className="text-xl font-bold">Staff accounts</h2><span className="rounded-full bg-blue-50 px-4 py-2 font-bold text-medzo-blue">{dashboard.totalUsers} users</span></div>
          <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="p-4">Staff ID</th><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{dashboard.users.map((staff) => <tr key={staff.id} className="border-t border-slate-100"><td className="p-4 font-semibold">{staff.staffId || 'Legacy user'}</td><td className="p-4">{staff.firstName} {staff.lastName}</td><td className="p-4">{staff.roles.join(', ')}</td><td className="p-4">{staff.isActive ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 size={16} /> Active</span> : <span className="text-red-700">Inactive</span>}</td><td className="p-4"><button disabled={busy || staff.id === user.id} onClick={() => toggleStatus(staff)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40">{staff.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard
