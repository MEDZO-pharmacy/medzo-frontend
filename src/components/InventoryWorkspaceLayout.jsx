import { Outlet } from 'react-router-dom'
import { AlertTriangle, ClipboardList, PackagePlus, Pill, ShieldAlert, ShoppingBag } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import MinimalDashboardSidebar from './MinimalDashboardSidebar'

export default function InventoryWorkspaceLayout() {
  const { user } = useAuth()
  const canManage = user?.roles?.some((role) => ['Admin', 'InventoryManager'].includes(role))
  if (!canManage) return <Outlet />
  const items = [
    { to: '/inventory', label: 'Inventory overview', icon: ShoppingBag },
    { to: '/catalogue', label: 'Medicines', icon: Pill },
    { to: '/inventory/purchase-receipts', label: 'Purchase updates', icon: ClipboardList },
    { to: '/inventory/low-stock', label: 'Low stock', icon: AlertTriangle, tone: 'danger' },
    { to: '/inventory/near-expiry', label: 'Near expiry', icon: ShieldAlert, tone: 'warning' },
    { to: '/inventory/batch-removals', label: 'Remove stock', icon: AlertTriangle, tone: 'danger' },
    { to: '/inventory/batches/new', label: 'Record batch', icon: PackagePlus, primary: true },
  ]
  return <div className="grid min-h-screen bg-[#f7faff] lg:grid-cols-[17.5rem_minmax(0,1fr)]"><MinimalDashboardSidebar user={user} roleLabel="Inventory Manager" items={items} /><div className="min-w-0"><Outlet /></div></div>
}