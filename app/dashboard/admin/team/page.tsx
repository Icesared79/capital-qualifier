'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'legal' | 'optma'
  created_at: string
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  legal: { label: 'Legal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  optma: { label: 'Funding Partner', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'legal' | 'optma'>('legal')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)

  // Edit modal state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  async function fetchTeamMembers() {
    try {
      const res = await fetch('/api/admin/team')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setTeamMembers(data.teamMembers || [])
      }
    } catch (err) {
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          fullName: inviteName,
          password: invitePassword || undefined
        })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteName('')
        setInvitePassword('')
        setInviteRole('legal')
        fetchTeamMembers()
      }
    } catch (err) {
      setError('Failed to invite team member')
    } finally {
      setInviting(false)
    }
  }

  async function handleUpdateRole() {
    if (!editingMember) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setEditingMember(null)
        fetchTeamMembers()
      }
    } catch (err) {
      setError('Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveMember(member: TeamMember, deleteCompletely: boolean) {
    if (!confirm(`Are you sure you want to ${deleteCompletely ? 'delete' : 'remove'} ${member.email}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/team/${member.id}?deleteUser=${deleteCompletely}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        fetchTeamMembers()
      }
    } catch (err) {
      setError('Failed to remove team member')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage admin, legal, and optma team members</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Team Member
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid gap-4">
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
          </div>
        ) : (
          teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-bold text-lg">
                  {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.full_name || member.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleLabels[member.role]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {roleLabels[member.role]?.label || member.role}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingMember(member)
                      setEditRole(member.role)
                    }}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Change role"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member, false)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Remove from team"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role Legend */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Role Permissions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleLabels.admin.color} mb-2`}>Admin</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Full access to all deals, team management, and settings</p>
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleLabels.legal.color} mb-2`}>Legal</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access to deals handed off for legal review</p>
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleLabels.optma.color} mb-2`}>Funding Partner</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access to deals handed off for funding partner review</p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Add Team Member</h2>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="team@bitcense.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Temporary password"
                />
                <p className="text-xs text-gray-500 mt-1">Share this with the team member so they can log in</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'legal' | 'optma')}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="legal">Legal - Legal review access</option>
                  <option value="optma">Funding Partner - Funding review access</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {inviting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Change Role</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{editingMember.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="legal">Legal - Legal review access</option>
                  <option value="optma">Funding Partner - Funding review access</option>
                  <option value="client">Client - Remove from team</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
