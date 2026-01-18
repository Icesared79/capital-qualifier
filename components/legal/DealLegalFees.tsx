'use client'

import { useState, useEffect } from 'react'
import { DealLegalFee, LegalFeeCatalogItem, FeeCategory, FeeStatus, DealFeeSummary } from '@/lib/types'
import { Plus, Trash2, DollarSign, Clock, Percent, Calendar, FileText, Check, X, Loader2 } from 'lucide-react'

interface DealLegalFeesProps {
  dealId: string
  isEditable?: boolean // Only true for admin/legal users
  showSummaryOnly?: boolean // For client view
}

const categoryLabels: Record<FeeCategory, { label: string; color: string; bgColor: string }> = {
  legal: { label: 'Legal', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  spv: { label: 'SPV', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  maintenance: { label: 'Maintenance', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  custom: { label: 'Custom', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
}

const statusLabels: Record<FeeStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  invoiced: { label: 'Invoiced', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/30' },
  paid: { label: 'Paid', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  waived: { label: 'Waived', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
}

const feeTypeIcons: Record<string, typeof DollarSign> = {
  flat: DollarSign,
  hourly: Clock,
  percentage: Percent,
  annual: Calendar,
}

export default function DealLegalFees({ dealId, isEditable = false, showSummaryOnly = false }: DealLegalFeesProps) {
  const [fees, setFees] = useState<DealLegalFee[]>([])
  const [catalog, setCatalog] = useState<LegalFeeCatalogItem[]>([])
  const [summary, setSummary] = useState<DealFeeSummary>({ total_amount: 0, pending_amount: 0, paid_amount: 0, fee_count: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<LegalFeeCatalogItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch fees and catalog
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [feesRes, catalogRes] = await Promise.all([
          fetch(`/api/legal/deals/${dealId}/fees`),
          isEditable ? fetch('/api/legal/fee-catalog') : Promise.resolve(null)
        ])

        if (feesRes.ok) {
          const feesData = await feesRes.json()
          setFees(feesData.fees || [])
          setSummary(feesData.summary || { total_amount: 0, pending_amount: 0, paid_amount: 0, fee_count: 0 })
        }

        if (catalogRes?.ok) {
          const catalogData = await catalogRes.json()
          setCatalog(catalogData.catalog || [])
        }
      } catch (err) {
        console.error('Error fetching fees:', err)
        setError('Failed to load fees')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dealId, isEditable])

  // Add fee from catalog
  const handleAddFromCatalog = async (item: LegalFeeCatalogItem) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/legal/deals/${dealId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee_catalog_id: item.id,
          name: item.name,
          description: item.description,
          amount: item.base_amount,
          fee_type: item.fee_type,
          category: item.category,
        })
      })

      if (res.ok) {
        const { fee } = await res.json()
        setFees([...fees, fee])
        setSummary({
          ...summary,
          total_amount: summary.total_amount + fee.amount,
          pending_amount: summary.pending_amount + fee.amount,
          fee_count: summary.fee_count + 1,
        })
        setShowAddModal(false)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add fee')
      }
    } catch (err) {
      setError('Failed to add fee')
    } finally {
      setSaving(false)
    }
  }

  // Add custom fee
  const handleAddCustomFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      setSaving(true)
      const res = await fetch(`/api/legal/deals/${dealId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          amount: parseFloat(formData.get('amount') as string),
          fee_type: formData.get('fee_type') || 'flat',
          category: formData.get('category') || 'custom',
          notes: formData.get('notes'),
        })
      })

      if (res.ok) {
        const { fee } = await res.json()
        setFees([...fees, fee])
        setSummary({
          ...summary,
          total_amount: summary.total_amount + fee.amount,
          pending_amount: summary.pending_amount + fee.amount,
          fee_count: summary.fee_count + 1,
        })
        setShowCustomModal(false)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add fee')
      }
    } catch (err) {
      setError('Failed to add fee')
    } finally {
      setSaving(false)
    }
  }

  // Update fee status
  const handleUpdateStatus = async (feeId: string, newStatus: FeeStatus) => {
    try {
      const res = await fetch(`/api/legal/deals/${dealId}/fees/${feeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        const { fee } = await res.json()
        setFees(fees.map(f => f.id === feeId ? fee : f))
        // Recalculate summary
        const updatedFees = fees.map(f => f.id === feeId ? fee : f)
        const newSummary = {
          total_amount: updatedFees.filter(f => f.status !== 'waived').reduce((sum, f) => sum + f.amount, 0),
          pending_amount: updatedFees.filter(f => ['pending', 'invoiced'].includes(f.status)).reduce((sum, f) => sum + f.amount, 0),
          paid_amount: updatedFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
          fee_count: updatedFees.length,
        }
        setSummary(newSummary)
      }
    } catch (err) {
      setError('Failed to update fee')
    }
  }

  // Delete fee
  const handleDelete = async (feeId: string) => {
    if (!confirm('Are you sure you want to remove this fee?')) return

    try {
      const res = await fetch(`/api/legal/deals/${dealId}/fees/${feeId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        const deletedFee = fees.find(f => f.id === feeId)
        setFees(fees.filter(f => f.id !== feeId))
        if (deletedFee && deletedFee.status !== 'waived') {
          setSummary({
            ...summary,
            total_amount: summary.total_amount - deletedFee.amount,
            pending_amount: ['pending', 'invoiced'].includes(deletedFee.status)
              ? summary.pending_amount - deletedFee.amount
              : summary.pending_amount,
            paid_amount: deletedFee.status === 'paid' ? summary.paid_amount - deletedFee.amount : summary.paid_amount,
            fee_count: summary.fee_count - 1,
          })
        }
      }
    } catch (err) {
      setError('Failed to delete fee')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading fees...</span>
        </div>
      </div>
    )
  }

  // Summary only view for clients
  if (showSummaryOnly && fees.length === 0) {
    return null // Don't show anything if no fees
  }

  return (
    <div className="space-y-4">
      {/* Fee Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Legal & SPV Fees</h3>
          </div>
          {isEditable && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Fee
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_amount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatCurrency(summary.pending_amount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{formatCurrency(summary.paid_amount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
          </div>
        </div>

        {/* Fee List */}
        {fees.length > 0 ? (
          <div className="space-y-2">
            {fees.map((fee) => {
              const catStyle = categoryLabels[fee.category as FeeCategory] || categoryLabels.custom
              const statusStyle = statusLabels[fee.status as FeeStatus] || statusLabels.pending
              const FeeIcon = feeTypeIcons[fee.fee_type] || DollarSign

              return (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${catStyle.bgColor} flex items-center justify-center`}>
                      <FeeIcon className={`w-4 h-4 ${catStyle.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{fee.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${catStyle.bgColor} ${catStyle.color}`}>
                          {catStyle.label}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusStyle.bgColor} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(fee.amount)}
                    </span>
                    {isEditable && fee.status !== 'paid' && (
                      <div className="flex items-center gap-1">
                        {fee.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(fee.id, 'invoiced')}
                            title="Mark as Invoiced"
                            className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {(fee.status === 'pending' || fee.status === 'invoiced') && (
                          <button
                            onClick={() => handleUpdateStatus(fee.id, 'paid')}
                            title="Mark as Paid"
                            className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {fee.status !== 'waived' && (
                          <button
                            onClick={() => handleUpdateStatus(fee.id, 'waived')}
                            title="Waive Fee"
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(fee.id)}
                          title="Remove Fee"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {isEditable ? 'No fees added yet. Click "Add Fee" to get started.' : 'No fees have been assigned to this deal yet.'}
          </p>
        )}
      </div>

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Fee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['legal', 'spv', 'maintenance'] as FeeCategory[]).map(cat => {
                const catStyle = categoryLabels[cat]
                const count = catalog.filter(item => item.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCatalogItem(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${catStyle.bgColor} ${catStyle.color}`}
                  >
                    {catStyle.label} ({count})
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowCustomModal(true)
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                + Custom Fee
              </button>
            </div>

            {/* Catalog Items */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(['legal', 'spv', 'maintenance'] as FeeCategory[]).map(cat => (
                <div key={cat}>
                  <h4 className={`text-sm font-semibold mb-2 ${categoryLabels[cat].color}`}>
                    {categoryLabels[cat].label} Services
                  </h4>
                  {catalog.filter(item => item.category === cat).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 capitalize">{item.fee_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.base_amount)}
                        </span>
                        <button
                          onClick={() => handleAddFromCatalog(item)}
                          disabled={saving}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Fee Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCustomModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Custom Fee</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  placeholder="e.g., Additional Legal Review"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  >
                    <option value="custom">Custom</option>
                    <option value="legal">Legal</option>
                    <option value="spv">SPV</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Type
                  </label>
                  <select
                    name="fee_type"
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  >
                    <option value="flat">Flat Fee</option>
                    <option value="hourly">Hourly</option>
                    <option value="percentage">Percentage</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-gray-500 focus:ring-0"
                  placeholder="Internal notes..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Add Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
