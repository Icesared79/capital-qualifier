'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  FileText,
  Building2,
  User,
  Briefcase,
  AlertCircle,
  FolderOpen,
  Scale,
  Home,
  FileSpreadsheet,
  Search
} from 'lucide-react'

interface ChecklistItem {
  id: string
  name: string
  description: string | null
  category: string
  is_required: boolean
  display_order: number
  is_active: boolean
  created_at: string
}

// Standardized categories with proper labels and icons
const CATEGORIES: Record<string, { label: string, icon: any, color: string }> = {
  'corporate': { label: 'Corporate', icon: Building2, color: 'blue' },
  'financials': { label: 'Financials', icon: Briefcase, color: 'green' },
  'legal': { label: 'Legal', icon: Scale, color: 'purple' },
  'due_diligence': { label: 'Due Diligence', icon: Search, color: 'amber' },
  'loan_tape': { label: 'Loan Tape', icon: FileSpreadsheet, color: 'indigo' },
  'property': { label: 'Property', icon: Home, color: 'rose' },
  'personal': { label: 'Personal', icon: User, color: 'cyan' },
  'other': { label: 'Other', icon: FolderOpen, color: 'gray' }
}

// Map old category names to standardized ones
const CATEGORY_MAPPING: Record<string, string> = {
  'Legal Documents': 'legal',
  'Business Documents': 'corporate',
  'Financial Documents': 'financials',
  'Personal Documents': 'personal',
  'Property Documents': 'property'
}

export default function DocumentChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'corporate',
    is_required: false
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('document_checklist_items')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error loading checklist items:', error)
      setItems([])
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  // Normalize category for display
  const normalizeCategory = (cat: string): string => {
    if (CATEGORY_MAPPING[cat]) return CATEGORY_MAPPING[cat]
    const lower = cat.toLowerCase()
    if (CATEGORIES[lower]) return lower
    return 'other'
  }

  // Get unique categories from data
  const getUniqueCategories = () => {
    const cats = new Set<string>()
    items.forEach(item => cats.add(normalizeCategory(item.category)))
    return Array.from(cats).sort()
  }

  const getCategoryConfig = (cat: string) => {
    const normalized = normalizeCategory(cat)
    return CATEGORIES[normalized] || CATEGORIES['other']
  }

  const filteredItems = items.filter(item =>
    activeCategory === 'all' || normalizeCategory(item.category) === activeCategory
  )

  // Group items by category for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = normalizeCategory(item.category)
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (editingItem) {
      const { error } = await supabase
        .from('document_checklist_items')
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          is_required: formData.is_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)

      if (!error) {
        loadItems()
        closeModal()
      }
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0
      const { error } = await supabase
        .from('document_checklist_items')
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          is_required: formData.is_required,
          display_order: maxOrder + 10
        })

      if (!error) {
        loadItems()
        closeModal()
      }
    }
    setSaving(false)
  }

  const toggleRequired = async (item: ChecklistItem) => {
    const { error } = await supabase
      .from('document_checklist_items')
      .update({ is_required: !item.is_required })
      .eq('id', item.id)

    if (!error) {
      setItems(items.map(i =>
        i.id === item.id ? { ...i, is_required: !i.is_required } : i
      ))
    }
  }

  const toggleActive = async (item: ChecklistItem) => {
    const { error } = await supabase
      .from('document_checklist_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)

    if (!error) {
      setItems(items.map(i =>
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ))
    }
  }

  const updateCategory = async (item: ChecklistItem, newCategory: string) => {
    const { error } = await supabase
      .from('document_checklist_items')
      .update({ category: newCategory })
      .eq('id', item.id)

    if (!error) {
      setItems(items.map(i =>
        i.id === item.id ? { ...i, category: newCategory } : i
      ))
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) return

    const { error } = await supabase
      .from('document_checklist_items')
      .delete()
      .eq('id', id)

    if (!error) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const openAddModal = () => {
    setFormData({ name: '', description: '', category: 'corporate', is_required: false })
    setEditingItem(null)
    setShowAddModal(true)
  }

  const openEditModal = (item: ChecklistItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: normalizeCategory(item.category),
      is_required: item.is_required
    })
    setEditingItem(item)
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', category: 'corporate', is_required: false })
  }

  // Bulk update to fix all categories
  const fixAllCategories = async () => {
    if (!confirm('This will standardize all category names. Continue?')) return

    const updates = items
      .filter(item => CATEGORY_MAPPING[item.category])
      .map(item => ({
        id: item.id,
        category: CATEGORY_MAPPING[item.category]
      }))

    for (const update of updates) {
      await supabase
        .from('document_checklist_items')
        .update({ category: update.category })
        .eq('id', update.id)
    }

    loadItems()
  }

  // Reset all items to optional
  const resetAllToOptional = async () => {
    if (!confirm('This will set ALL documents to Optional. You can then mark specific ones as Required. Continue?')) return

    const { error } = await supabase
      .from('document_checklist_items')
      .update({ is_required: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows

    if (!error) {
      setItems(items.map(i => ({ ...i, is_required: false })))
    }
  }

  // Check if there are items with old category names
  const hasLegacyCategories = items.some(item => CATEGORY_MAPPING[item.category])

  const uniqueCategories = getUniqueCategories()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-purple-600" />
            Document Checklist
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage required documents for deal applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasLegacyCategories && (
            <button
              onClick={fixAllCategories}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl font-medium transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/50"
            >
              Fix Categories
            </button>
          )}
          {items.filter(i => i.is_required).length > 5 && (
            <button
              onClick={resetAllToOptional}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl font-medium transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/50"
            >
              Reset All to Optional
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All ({items.length})
        </button>
        {Object.entries(CATEGORIES).map(([key, config]) => {
          const count = items.filter(i => normalizeCategory(i.category) === key).length
          if (count === 0 && !uniqueCategories.includes(key)) return null
          const Icon = config.icon
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Documents</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {items.filter(i => i.is_required).length}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Required</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {items.filter(i => i.is_active).length}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Active</div>
        </div>
      </div>

      {/* Items List - Grouped by Category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-3">Loading checklist...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Checklist Items Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Click "Add Item" to create your first document checklist item.
          </p>
        </div>
      ) : activeCategory === 'all' ? (
        // Show grouped by category when "All" is selected
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const config = CATEGORIES[category] || CATEGORIES['other']
            const Icon = config.icon
            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-3 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{config.label}</h3>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">({categoryItems.length})</span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggleRequired={() => toggleRequired(item)}
                      onToggleActive={() => toggleActive(item)}
                      onEdit={() => openEditModal(item)}
                      onDelete={() => deleteItem(item.id)}
                      onUpdateCategory={(cat) => updateCategory(item, cat)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Show flat list when specific category is selected
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onToggleRequired={() => toggleRequired(item)}
                onToggleActive={() => toggleActive(item)}
                onEdit={() => openEditModal(item)}
                onDelete={() => deleteItem(item.id)}
                onUpdateCategory={(cat) => updateCategory(item, cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={e => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Required document</span>
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                  Required documents must be submitted for all deals
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Item Row Component
function ItemRow({
  item,
  onToggleRequired,
  onToggleActive,
  onEdit,
  onDelete,
  onUpdateCategory
}: {
  item: ChecklistItem
  onToggleRequired: () => void
  onToggleActive: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateCategory: (category: string) => void
}) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)

  return (
    <div className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!item.is_active ? 'opacity-60' : ''}`}>
      <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-grab flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: '#111827' }}>
          {item.name}
        </div>
        {item.description && (
          <div className="text-sm" style={{ color: '#374151' }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Category dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowCategoryMenu(!showCategoryMenu)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500"
          style={{ color: '#1e293b' }}
        >
          {item.category}
        </button>
        {showCategoryMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
              {Object.entries(CATEGORIES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    onUpdateCategory(key)
                    setShowCategoryMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <config.icon className="w-4 h-4" />
                  {config.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Required toggle */}
      <button
        onClick={onToggleRequired}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          item.is_required
            ? 'bg-amber-300 dark:bg-amber-700'
            : 'bg-slate-200 dark:bg-slate-600'
        }`}
        style={{ color: item.is_required ? '#451a03' : '#1e293b' }}
      >
        {item.is_required ? 'Required' : 'Optional'}
      </button>

      {/* Active toggle */}
      <button
        onClick={onToggleActive}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          item.is_active
            ? 'bg-green-300 dark:bg-green-700'
            : 'bg-slate-200 dark:bg-slate-600'
        }`}
        style={{ color: item.is_active ? '#052e16' : '#1e293b' }}
      >
        {item.is_active ? 'Active' : 'Inactive'}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
