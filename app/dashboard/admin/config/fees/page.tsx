'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LegalFeeCatalogItem, FeeCategory, FeeType } from '@/lib/types'
import { Plus, Edit2, Trash2, DollarSign, Clock, Percent, Calendar, Loader2, X, Check } from 'lucide-react'

const categoryConfig: Record<FeeCategory, { label: string; color: string; bgColor: string }> = {
  legal: { label: 'Legal', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  spv: { label: 'SPV', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  maintenance: { label: 'Maintenance', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  custom: { label: 'Custom', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
}

const feeTypeConfig: Record<FeeType, { label: string; icon: typeof DollarSign }> = {
  flat: { label: 'Flat Fee', icon: DollarSign },
  hourly: { label: 'Hourly', icon: Clock },
  percentage: { label: 'Percentage', icon: Percent },
  annual: { label: 'Annual', icon: Calendar },
}

export default function FeeCatalogPage() {
  const supabase = createClient()
  const [fees, setFees] = useState<LegalFeeCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<LegalFeeCatalogItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FeeCategory | 'all'>('all')

  useEffect(() => {
    loadFees()
  }, [])

  async function loadFees() {
    setLoading(true)
    const { data, error } = await supabase
      .from('legal_fee_catalog')
      .select('*')
      .order('category')
      .order('display_order')

    if (data) {
      setFees(data)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const feeData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      base_amount: parseFloat(formData.get('base_amount') as string),
      fee_type: formData.get('fee_type') as FeeType,
      category: formData.get('category') as FeeCategory,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    }

    if (editingFee) {
      const { error } = await supabase
        .from('legal_fee_catalog')
        .update({ ...feeData, updated_at: new Date().toISOString() })
        .eq('id', editingFee.id)

      if (!error) {
        setFees(fees.map(f => f.id === editingFee.id ? { ...f, ...feeData } : f))
      }
    } else {
      const { data, error } = await supabase
        .from('legal_fee_catalog')
        .insert(feeData)
        .select()
        .single()

      if (data) {
        setFees([...fees, data])
      }
    }

    setSaving(false)
    setShowModal(false)
    setEditingFee(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this fee? This cannot be undone.')) return

    const { error } = await supabase
      .from('legal_fee_catalog')
      .delete()
      .eq('id', id)

    if (!error) {
      setFees(fees.filter(f => f.id !== id))
    }
  }

  async function toggleActive(fee: LegalFeeCatalogItem) {
    const { error } = await supabase
      .from('legal_fee_catalog')
      .update({ is_active: !fee.is_active, updated_at: new Date().toISOString() })
      .eq('id', fee.id)

    if (!error) {
      setFees(fees.map(f => f.id === fee.id ? { ...f, is_active: !f.is_active } : f))
    }
  }

  const filteredFees = activeCategory === 'all'
    ? fees
    : fees.filter(f => f.category === activeCategory)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Catalog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage predefined legal and SPV services
          </p>
        </div>
        <button
          onClick={() => { setEditingFee(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Fee
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({fees.length})
        </button>
        {(['legal', 'spv', 'maintenance', 'custom'] as FeeCategory[]).map(cat => {
          const config = categoryConfig[cat]
          const count = fees.filter(f => f.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Fees List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <DollarSign className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No fees in this category</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFees.map((fee) => {
                const catConfig = categoryConfig[fee.category as FeeCategory]
                const typeConfig = feeTypeConfig[fee.fee_type as FeeType]
                const TypeIcon = typeConfig?.icon || DollarSign

                return (
                  <tr key={fee.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${!fee.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{fee.name}</p>
                      {fee.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{fee.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${catConfig?.bgColor} ${catConfig?.color}`}>
                        {catConfig?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <TypeIcon className="w-4 h-4" />
                        {typeConfig?.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(fee.base_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(fee)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          fee.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {fee.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingFee(fee); setShowModal(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fee.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowModal(false); setEditingFee(null) }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingFee ? 'Edit Fee' : 'Add Fee'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditingFee(null) }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingFee?.name}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingFee?.description || ''}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="base_amount"
                      required
                      min="0"
                      step="0.01"
                      defaultValue={editingFee?.base_amount || ''}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingFee?.display_order || 0}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
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
                    defaultValue={editingFee?.category || 'legal'}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
                  >
                    <option value="legal">Legal</option>
                    <option value="spv">SPV</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Type
                  </label>
                  <select
                    name="fee_type"
                    defaultValue={editingFee?.fee_type || 'flat'}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0"
                  >
                    <option value="flat">Flat Fee</option>
                    <option value="hourly">Hourly</option>
                    <option value="percentage">Percentage</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  defaultChecked={editingFee?.is_active ?? true}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  Active (available for selection)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingFee(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingFee ? 'Save Changes' : 'Add Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
