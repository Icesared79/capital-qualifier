'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  Building2,
  CreditCard,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Lightbulb,
  ArrowRight
} from 'lucide-react'

interface DealFlowExample {
  id: string
  title: string
  deal_type: string
  description: string | null
  timeline_days: number | null
  stages: Stage[]
  lessons_learned: string[] | null
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

interface Stage {
  stage: string
  day: number
  duration_days: number
  notes: string
  actions: string[]
}

const DEAL_TYPE_ICONS: Record<string, React.ReactNode> = {
  'Real Estate': <Building2 className="w-5 h-5" />,
  'Consumer Lending': <CreditCard className="w-5 h-5" />,
  'Equipment Finance': <Briefcase className="w-5 h-5" />,
  'Mixed Asset': <FileText className="w-5 h-5" />,
}

const DEAL_TYPE_COLORS: Record<string, string> = {
  'Real Estate': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Consumer Lending': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'Equipment Finance': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Mixed Asset': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
}

const STAGE_LABELS: Record<string, string> = {
  qualified: 'Qualified',
  documents_requested: 'Documents Requested',
  under_review: 'Under Review',
  term_sheet: 'Term Sheet',
  closing: 'Closing',
  funded: 'Funded',
  declined: 'Declined',
}

const STAGE_COLORS: Record<string, string> = {
  qualified: 'bg-blue-500',
  documents_requested: 'bg-indigo-500',
  under_review: 'bg-purple-500',
  term_sheet: 'bg-pink-500',
  closing: 'bg-amber-500',
  funded: 'bg-green-500',
  declined: 'bg-red-500',
}

export default function GuidesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [examples, setExamples] = useState<DealFlowExample[]>([])
  const [selectedExample, setSelectedExample] = useState<DealFlowExample | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExample, setEditingExample] = useState<Partial<DealFlowExample> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAccessAndLoad()
  }, [])

  const checkAccessAndLoad = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Auth error:', authError)
        router.push('/login')
        return
      }

      // Check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        setLoading(false)
        return
      }

      const allowedRoles = ['admin', 'legal', 'optma', 'investor']
      if (!profile || !allowedRoles.includes(profile.role)) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(profile.role === 'admin')
      await loadExamples()
    } catch (err) {
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadExamples = async () => {
    const { data, error } = await supabase
      .from('deal_flow_examples')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error loading examples:', error)
      return
    }

    if (data) {
      setExamples(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this example?')) return

    const { error } = await supabase
      .from('deal_flow_examples')
      .delete()
      .eq('id', id)

    if (!error) {
      setExamples(examples.filter(e => e.id !== id))
      if (selectedExample?.id === id) {
        setSelectedExample(null)
      }
    }
  }

  const handleSave = async () => {
    if (!editingExample) return

    setSaving(true)

    const exampleData = {
      title: editingExample.title,
      deal_type: editingExample.deal_type,
      description: editingExample.description,
      timeline_days: editingExample.timeline_days,
      stages: editingExample.stages || [],
      lessons_learned: editingExample.lessons_learned || [],
      is_published: editingExample.is_published ?? true,
      display_order: editingExample.display_order || 0,
    }

    if (editingExample.id) {
      // Update existing
      const { error } = await supabase
        .from('deal_flow_examples')
        .update({ ...exampleData, updated_at: new Date().toISOString() })
        .eq('id', editingExample.id)

      if (!error) {
        await loadExamples()
        setShowEditModal(false)
        setEditingExample(null)
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('deal_flow_examples')
        .insert(exampleData)

      if (!error) {
        await loadExamples()
        setShowEditModal(false)
        setEditingExample(null)
      }
    }

    setSaving(false)
  }

  const openCreateModal = () => {
    setEditingExample({
      title: '',
      deal_type: 'Real Estate',
      description: '',
      timeline_days: 30,
      stages: [],
      lessons_learned: [],
      is_published: true,
      display_order: examples.length * 10,
    })
    setShowEditModal(true)
  }

  const openEditModal = (example: DealFlowExample) => {
    setEditingExample({ ...example })
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-8 h-8 text-purple-600 animate-pulse mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading guides...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-purple-600" />
              Deal Flow Examples
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Learn how deals progress through our platform with these real-world scenarios
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Example
            </button>
          )}
        </div>

        {/* Examples Grid */}
        {examples.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No examples yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isAdmin ? 'Click "Add Example" to create your first deal flow example.' : 'Deal flow examples will appear here once added.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {examples.map((example) => (
              <div
                key={example.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
                  selectedExample?.id === example.id
                    ? 'border-purple-500 dark:border-purple-400 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        DEAL_TYPE_COLORS[example.deal_type] || 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {DEAL_TYPE_ICONS[example.deal_type] || <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {example.title}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                          DEAL_TYPE_COLORS[example.deal_type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {example.deal_type}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(example)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(example.id)
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {example.description}
                  </p>

                  {/* Timeline Badge */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        {example.timeline_days ? `${example.timeline_days} days to ${
                          example.stages[example.stages.length - 1]?.stage === 'declined' ? 'decision' : 'funding'
                        }` : 'Timeline varies'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>{example.stages.length} stages</span>
                    </div>
                  </div>

                  {/* Final Stage Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {example.stages[example.stages.length - 1]?.stage === 'funded' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : example.stages[example.stages.length - 1]?.stage === 'declined' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        example.stages[example.stages.length - 1]?.stage === 'funded'
                          ? 'text-green-600 dark:text-green-400'
                          : example.stages[example.stages.length - 1]?.stage === 'declined'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {STAGE_LABELS[example.stages[example.stages.length - 1]?.stage] || 'In Progress'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedExample(selectedExample?.id === example.id ? null : example)}
                      className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      {selectedExample?.id === example.id ? 'Hide Details' : 'View Timeline'}
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        selectedExample?.id === example.id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Detail View */}
                {selectedExample?.id === example.id && (
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                    {/* Timeline */}
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Deal Timeline
                    </h4>
                    <div className="relative mb-6">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                      <div className="space-y-4">
                        {example.stages.map((stage, idx) => (
                          <div key={idx} className="relative pl-10">
                            {/* Timeline dot */}
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full ${STAGE_COLORS[stage.stage] || 'bg-gray-400'} ring-4 ring-white dark:ring-gray-800`} />

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  stage.stage === 'funded' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                  stage.stage === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}>
                                  {STAGE_LABELS[stage.stage] || stage.stage}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Day {stage.day} {stage.duration_days > 0 ? `(${stage.duration_days} days)` : ''}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {stage.notes}
                              </p>
                              {stage.actions && stage.actions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {stage.actions.map((action, actionIdx) => (
                                    <span
                                      key={actionIdx}
                                      className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                    >
                                      {action}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lessons Learned */}
                    {example.lessons_learned && example.lessons_learned.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Key Takeaways
                        </h4>
                        <ul className="space-y-2">
                          {example.lessons_learned.map((lesson, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              {lesson}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Edit/Create Modal */}
      {showEditModal && editingExample && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingExample.id ? 'Edit Example' : 'Create New Example'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingExample(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editingExample.title || ''}
                  onChange={(e) => setEditingExample({ ...editingExample, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Fast Track Real Estate Portfolio"
                />
              </div>

              {/* Deal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deal Type
                </label>
                <select
                  value={editingExample.deal_type || 'Real Estate'}
                  onChange={(e) => setEditingExample({ ...editingExample, deal_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Real Estate">Real Estate</option>
                  <option value="Consumer Lending">Consumer Lending</option>
                  <option value="Equipment Finance">Equipment Finance</option>
                  <option value="Mixed Asset">Mixed Asset</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingExample.description || ''}
                  onChange={(e) => setEditingExample({ ...editingExample, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief overview of this deal scenario..."
                />
              </div>

              {/* Timeline Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Timeline (Days)
                </label>
                <input
                  type="number"
                  value={editingExample.timeline_days || ''}
                  onChange={(e) => setEditingExample({ ...editingExample, timeline_days: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 30"
                />
              </div>

              {/* Stages JSON */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stages (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editingExample.stages || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const stages = JSON.parse(e.target.value)
                      setEditingExample({ ...editingExample, stages })
                    } catch {
                      // Invalid JSON, keep the text but don't update stages
                    }
                  }}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder='[{"stage": "qualified", "day": 1, "duration_days": 2, "notes": "...", "actions": ["..."]}]'
                />
              </div>

              {/* Lessons Learned */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lessons Learned (one per line)
                </label>
                <textarea
                  value={(editingExample.lessons_learned || []).join('\n')}
                  onChange={(e) => setEditingExample({
                    ...editingExample,
                    lessons_learned: e.target.value.split('\n').filter(l => l.trim())
                  })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter each key takeaway on a new line..."
                />
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editingExample.is_published ?? true}
                  onChange={(e) => setEditingExample({ ...editingExample, is_published: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300">
                  Published (visible to partners)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingExample(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingExample.title}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Example'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
