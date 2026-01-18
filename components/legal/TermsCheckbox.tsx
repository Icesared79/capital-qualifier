'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { TermsDocumentType, TermsContextType } from '@/lib/types'
import TermsModal from './TermsModal'

interface TermsCheckboxProps {
  documentType: TermsDocumentType
  contextType: TermsContextType
  contextEntityId?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  linkText?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

// Display names for document types
const documentTypeLabels: Record<TermsDocumentType, string> = {
  platform_tos: 'Terms of Service',
  originator_agreement: 'Originator Agreement',
  offering_certification: 'Offering Certification',
  partner_network_agreement: 'Partner Network Agreement',
  deal_confidentiality: 'Deal Confidentiality Agreement',
}

export default function TermsCheckbox({
  documentType,
  contextType,
  contextEntityId,
  checked,
  onChange,
  label,
  linkText,
  disabled = false,
  required = false,
  className = '',
}: TermsCheckboxProps) {
  const [showModal, setShowModal] = useState(false)

  const defaultLabel = `I agree to the`
  const defaultLinkText = documentTypeLabels[documentType]

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowModal(true)
  }

  const handleAccept = () => {
    onChange(true)
    setShowModal(false)
  }

  return (
    <>
      <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600
                   text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 focus:ring-offset-0
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label || defaultLabel}{' '}
          <button
            type="button"
            onClick={handleLinkClick}
            className="inline-flex items-center gap-1 text-gray-900 dark:text-white font-medium
                     hover:underline focus:outline-none focus:underline"
          >
            {linkText || defaultLinkText}
            <ExternalLink className="w-3 h-3" />
          </button>
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>

      <TermsModal
        documentType={documentType}
        contextType={contextType}
        contextEntityId={contextEntityId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={handleAccept}
        blocking={false}
      />
    </>
  )
}
