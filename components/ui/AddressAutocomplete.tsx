'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Type declaration for Google Maps
declare namespace google {
  namespace maps {
    namespace places {
      interface PlaceResult {
        address_components?: AddressComponent[]
        formatted_address?: string
      }
      interface AddressComponent {
        long_name: string
        short_name: string
        types: string[]
      }
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: any)
        addListener(event: string, handler: () => void): void
        getPlace(): PlaceResult
      }
    }
  }
}

declare global {
  interface Window {
    google?: typeof google
  }
}

interface AddressComponents {
  street: string
  city: string
  state: string
  zip: string
  fullAddress: string
}

interface AddressAutocompleteProps {
  label: string
  value: AddressComponents
  onChange: (address: AddressComponents) => void
  placeholder?: string
  error?: string
}

// Check if Google Places API is loaded
const isGoogleLoaded = () => {
  return typeof window !== 'undefined' &&
         window.google &&
         window.google.maps &&
         window.google.maps.places
}

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Start typing your address...',
  error,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [inputValue, setInputValue] = useState(value.fullAddress || '')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [googleAvailable, setGoogleAvailable] = useState(false)

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isGoogleLoaded() && inputRef.current && !autocompleteRef.current) {
      setGoogleAvailable(true)

      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        types: ['address'],
        fields: ['address_components', 'formatted_address'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place && place.address_components) {
          const addressData = parseGooglePlace(place)
          onChange(addressData)
          setInputValue(addressData.fullAddress)
        }
      })
    }
  }, [onChange])

  // Update input when value changes externally
  useEffect(() => {
    if (value.fullAddress && value.fullAddress !== inputValue) {
      setInputValue(value.fullAddress)
    }
  }, [value.fullAddress])

  const parseGooglePlace = (place: google.maps.places.PlaceResult): AddressComponents => {
    const components = place.address_components || []

    const getComponent = (types: string[]) => {
      const comp = components.find(c => types.some(t => c.types.includes(t)))
      return comp?.long_name || ''
    }

    const streetNumber = getComponent(['street_number'])
    const route = getComponent(['route'])
    const city = getComponent(['locality', 'sublocality', 'administrative_area_level_3'])
    const state = getComponent(['administrative_area_level_1'])
    const zip = getComponent(['postal_code'])

    return {
      street: `${streetNumber} ${route}`.trim(),
      city,
      state,
      zip,
      fullAddress: place.formatted_address || '',
    }
  }

  const handleManualChange = useCallback((field: keyof AddressComponents, fieldValue: string) => {
    const newAddress = { ...value, [field]: fieldValue }
    // Update full address when manual fields change
    if (field !== 'fullAddress') {
      newAddress.fullAddress = [newAddress.street, newAddress.city, newAddress.state, newAddress.zip]
        .filter(Boolean)
        .join(', ')
    }
    onChange(newAddress)
  }, [value, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // If not using Google, update the full address directly
    if (!googleAvailable) {
      onChange({ ...value, fullAddress: e.target.value })
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {!googleAvailable && (
            <button
              type="button"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="text-xs text-accent hover:text-accent-hover"
            >
              {showManualEntry ? 'Use single field' : 'Enter manually'}
            </button>
          )}
        </div>

        {/* Main address input */}
        {!showManualEntry && (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Manual entry fields */}
        {showManualEntry && (
          <div className="space-y-3">
            <input
              type="text"
              value={value.street}
              onChange={(e) => handleManualChange('street', e.target.value)}
              placeholder="Street address"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <div className="grid grid-cols-6 gap-3">
              <input
                type="text"
                value={value.city}
                onChange={(e) => handleManualChange('city', e.target.value)}
                placeholder="City"
                className="col-span-3 px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <input
                type="text"
                value={value.state}
                onChange={(e) => handleManualChange('state', e.target.value)}
                placeholder="State"
                className="col-span-1 px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <input
                type="text"
                value={value.zip}
                onChange={(e) => handleManualChange('zip', e.target.value)}
                placeholder="ZIP"
                className="col-span-2 px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}
