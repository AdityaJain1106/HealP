
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet'

import L from 'leaflet'

import {
  MapPin,
  Navigation,
  Search,
  RefreshCw,
  ExternalLink,
  Phone,
  Clock,
  AlertCircle,
  LoaderCircle,
  LocateFixed,
  ArrowLeft,
  Globe,
  Building2,
  MapPinned,
  CheckCircle2,
} from 'lucide-react'

import 'leaflet/dist/leaflet.css'

type ServiceCategory =
  | 'hospitals'
  | 'pharmacies'
  | 'bloodBanks'
  | 'diagnostics'

interface Coordinates {
  lat: number
  lon: number
}

interface HealthcareFacility {
  id: string
  name: string
  lat: number
  lon: number
  address: string
  phone?: string
  openingHours?: string
  website?: string
  distance: number
  tags: Record<string, string>
}

interface NearbyHealthcareDiscoveryProps {
  category: ServiceCategory
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const SEARCH_RADIUS = 5000

const categoryConfig: Record<
  ServiceCategory,
  {
    label: string
    query: string
  }
> = {
  hospitals: {
    label: 'Hospitals',
    query: `
      nwr["amenity"="hospital"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="hospital"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
    `,
  },

  pharmacies: {
    label: 'Pharmacies',
    query: `
      nwr["amenity"="pharmacy"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="pharmacy"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
    `,
  },

  bloodBanks: {
    label: 'Blood Banks',
    query: `
      nwr["amenity"="blood_bank"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="blood_bank"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="blood_donation"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
    `,
  },

  diagnostics: {
    label: 'Diagnostic Centers',
    query: `
      nwr["healthcare"="laboratory"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="diagnostic_center"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["amenity"="laboratory"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
      nwr["healthcare"="sample_collection"](around:${SEARCH_RADIUS},{{LAT}},{{LON}});
    `,
  },
}

const createUserIcon = () =>
  L.divIcon({
    className: 'healp-user-marker',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2563eb;
        border: 4px solid white;
        box-shadow: 0 0 0 5px rgba(37,99,235,0.2);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

const createFacilityIcon = (selected = false) =>
  L.divIcon({
    className: 'healp-facility-marker',
    html: `
      <div style="
        width: ${selected ? 36 : 30}px;
        height: ${selected ? 36 : 30}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${selected ? '#2563eb' : '#10b981'};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          text-align: center;
          line-height: ${selected ? 32 : 26}px;
          font-size: 15px;
          font-weight: bold;
        ">+</div>
      </div>
    `,
    iconSize: [selected ? 36 : 30, selected ? 36 : 30],
    iconAnchor: [selected ? 18 : 15, selected ? 36 : 30],
  })

const userIcon = createUserIcon()
const facilityIcon = createFacilityIcon()
const selectedFacilityIcon = createFacilityIcon(true)

function calculateDistance(
  first: Coordinates,
  second: Coordinates,
): number {
  const earthRadius = 6371

  const latDifference =
    ((second.lat - first.lat) * Math.PI) / 180

  const lonDifference =
    ((second.lon - first.lon) * Math.PI) / 180

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos((first.lat * Math.PI) / 180) *
      Math.cos((second.lat * Math.PI) / 180) *
      Math.sin(lonDifference / 2) ** 2

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  )
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  }

  return `${distance.toFixed(1)} km`
}

function getFacilityAddress(
  tags: Record<string, string>,
): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean)

  return parts.length
    ? parts.join(', ')
    : 'Address not available in OpenStreetMap'
}

function getMapsUrl(facility: HealthcareFacility): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lon}`
}

function getWebsiteUrl(website: string): string {
  return website.startsWith('http')
    ? website
    : `https://${website}`
}

function getOverpassQuery(
  category: ServiceCategory,
  coordinates: Coordinates,
): string {
  const query = categoryConfig[category].query
    .replaceAll('{{LAT}}', coordinates.lat.toString())
    .replaceAll('{{LON}}', coordinates.lon.toString())

  return `
    [out:json][timeout:25];
    (
      ${query}
    );
    out center tags;
  `
}

/**
 * Original working discovery implementation.
 *
 * Important:
 * - Uses the original POST request.
 * - Uses the original parent AbortSignal directly.
 * - Does not introduce a forced request timeout.
 * - Tries the next endpoint when the current endpoint fails.
 */
async function fetchFacilities(
  category: ServiceCategory,
  coordinates: Coordinates,
  signal: AbortSignal,
): Promise<HealthcareFacility[]> {
  const query = getOverpassQuery(category, coordinates)

  let lastError: Error | null = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ data: query }),
        signal,
      })

      if (!response.ok) {
        throw new Error(
          `OpenStreetMap returned status ${response.status}.`,
        )
      }

      const data = (await response.json()) as OverpassResponse

      const facilities = data.elements.reduce<HealthcareFacility[]>(
        (results, element) => {
          const tags = element.tags ?? {}

          const lat = element.lat ?? element.center?.lat
          const lon = element.lon ?? element.center?.lon

          if (
            typeof lat !== 'number' ||
            typeof lon !== 'number'
          ) {
            return results
          }

          const distance = calculateDistance(
            coordinates,
            { lat, lon },
          )

          const facility: HealthcareFacility = {
            id: `${element.type}-${element.id}`,
            name:
              tags.name ||
              tags['name:en'] ||
              'Unnamed facility',
            lat,
            lon,
            address: getFacilityAddress(tags),
            phone:
              tags.phone ||
              tags['contact:phone'] ||
              undefined,
            openingHours: tags.opening_hours || undefined,
            website:
              tags.website ||
              tags['contact:website'] ||
              undefined,
            distance,
            tags,
          }

          results.push(facility)

          return results
        },
        [],
      )

      return facilities.sort(
        (a, b) => a.distance - b.distance,
      )
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      lastError =
        error instanceof Error
          ? error
          : new Error(
              'Unable to fetch healthcare facilities.',
            )
    }
  }

  throw (
    lastError ??
    new Error(
      'All healthcare discovery services are unavailable.',
    )
  )
}

function MapViewport({
  coordinates,
}: {
  coordinates: Coordinates
}) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(
      [coordinates.lat, coordinates.lon],
      16,
      {
        animate: true,
        duration: 0.8,
      },
    )
  }, [coordinates, map])

  return null
}

function FacilityDetails({
  facility,
  category,
  onBack,
}: {
  facility: HealthcareFacility
  category: ServiceCategory
  onBack: () => void
}) {
  const details = [
    {
      label: 'Address',
      value: facility.address,
      icon: MapPin,
    },
    {
      label: 'Distance from you',
      value: formatDistance(facility.distance),
      icon: Navigation,
    },
    {
      label: 'Phone number',
      value: facility.phone || 'Not available',
      icon: Phone,
    },
    {
      label: 'Opening hours',
      value: facility.openingHours || 'Not available',
      icon: Clock,
    },
    {
      label: 'Website',
      value: facility.website || 'Not available',
      icon: Globe,
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Building2 size={24} />
          </div>

          <div>
            <span className="text-xs font-medium text-primary-600">
              {categoryConfig[category].label}
            </span>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {facility.name}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to results
        </button>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-center gap-2">
          <CheckCircle2
            size={17}
            className="text-emerald-600"
          />

          <span className="text-xs font-medium text-slate-500">
            Facility information from OpenStreetMap
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  {label}
                </p>

                {label === 'Phone number' && facility.phone ? (
                  <a
                    href={`tel:${facility.phone}`}
                    className="mt-1 block break-words text-sm font-medium text-primary-600 hover:underline"
                  >
                    {value}
                  </a>
                ) : label === 'Website' && facility.website ? (
                  <a
                    href={getWebsiteUrl(facility.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm font-medium text-primary-600 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 break-words text-sm font-medium text-slate-700">
                    {value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <MapPinned
              size={18}
              className="text-primary-600"
            />
            Facility Location
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Latitude: {facility.lat.toFixed(6)}
            <br />
            Longitude: {facility.lon.toFixed(6)}
          </p>

          <a
            href={getMapsUrl(facility)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Navigation size={16} />
            Get Directions
            <ExternalLink size={14} />
          </a>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Information may be incomplete or outdated. Please
          contact the facility directly to verify its services,
          availability and opening hours before visiting.
        </p>
      </div>
    </div>
  )
}

function NearbyHealthcareDiscovery({
  category,
}: NearbyHealthcareDiscoveryProps) {
  const config = categoryConfig[category]

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null)

  const [facilities, setFacilities] =
    useState<HealthcareFacility[]>([])

  const [selectedFacility, setSelectedFacility] =
    useState<HealthcareFacility | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return facilities
    }

    return facilities.filter((facility) => {
      return (
        facility.name.toLowerCase().includes(normalizedSearch) ||
        facility.address.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [facilities, searchTerm])

  const loadFacilities = useCallback(
    async (position: Coordinates) => {
      const controller = new AbortController()

      setLoading(true)
      setError('')
      setFacilities([])
      setSelectedFacility(null)
      setHasSearched(true)

      try {
        const results = await fetchFacilities(
          category,
          position,
          controller.signal,
        )

        setFacilities(results)
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Something went wrong while finding facilities.',
        )
      } finally {
        setLoading(false)
      }
    },
    [category],
  )

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        'Your browser does not support location services.',
      )
      return
    }

    setLocationLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentCoordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }

        setCoordinates(currentCoordinates)
        setLocationLoading(false)

        void loadFacilities(currentCoordinates)
      },
      (locationError) => {
        setLocationLoading(false)

        if (
          locationError.code ===
          locationError.PERMISSION_DENIED
        ) {
          setError(
            'Location permission was denied. Allow location access in your browser settings and try again.',
          )
        } else if (
          locationError.code ===
          locationError.POSITION_UNAVAILABLE
        ) {
          setError(
            'Your current location is unavailable. Please try again.',
          )
        } else {
          setError(
            'Location request timed out. Please try again.',
          )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    )
  }, [loadFacilities])

  useEffect(() => {
    setFacilities([])
    setCoordinates(null)
    setSelectedFacility(null)
    setSearchTerm('')
    setHasSearched(false)
    setError('')
    setLoading(false)
  }, [category])

  const mapCenter: [number, number] = coordinates
    ? [coordinates.lat, coordinates.lon]
    : [20.5937, 78.9629]

  const mapFocus: Coordinates | null = selectedFacility
    ? {
        lat: selectedFacility.lat,
        lon: selectedFacility.lon,
      }
    : null

  return (
    <div className="space-y-6">
      {/* SEARCH HEADER */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MapPin
                size={18}
                className="text-primary-600"
              />
              Discover nearby {config.label.toLowerCase()}
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Find facilities within 5 km of your current location.
            </p>
          </div>

          <button
            type="button"
            onClick={requestLocation}
            disabled={locationLoading || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locationLoading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <LocateFixed size={17} />
            )}

            {locationLoading
              ? 'Getting location...'
              : 'Use my location'}
          </button>
        </div>

        {coordinates && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <Navigation size={15} />
            Location detected successfully.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* MAP */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Healthcare Map
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {selectedFacility
                ? `Viewing ${selectedFacility.name}`
                : coordinates
                  ? 'Showing your location and discovered facilities.'
                  : 'Enable location to explore nearby facilities.'}
            </p>
          </div>

          {coordinates && (
            <button
              type="button"
              onClick={() => void loadFacilities(coordinates)}
              disabled={loading}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary-600 disabled:opacity-50"
              title="Refresh facilities"
              aria-label="Refresh facilities"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          )}
        </div>

        <div className="relative h-[320px] w-full sm:h-[420px]">
          <MapContainer
            key={
              coordinates
                ? `${coordinates.lat}-${coordinates.lon}`
                : 'default-map'
            }
            center={mapCenter}
            zoom={coordinates ? 14 : 5}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {coordinates && (
              <>
                <MapViewport
                  coordinates={mapFocus ?? coordinates}
                />

                <Marker
                  position={[
                    coordinates.lat,
                    coordinates.lon,
                  ]}
                  icon={userIcon}
                >
                  <Popup>Your current location</Popup>
                </Marker>

                <Circle
                  center={[
                    coordinates.lat,
                    coordinates.lon,
                  ]}
                  radius={SEARCH_RADIUS}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.04,
                    weight: 1,
                  }}
                />

                {filteredFacilities.map((facility) => (
                  <Marker
                    key={facility.id}
                    position={[facility.lat, facility.lon]}
                    icon={
                      selectedFacility?.id === facility.id
                        ? selectedFacilityIcon
                        : facilityIcon
                    }
                    eventHandlers={{
                      click: () => setSelectedFacility(facility),
                    }}
                  >
                    <Popup>
                      <div className="min-w-40">
                        <strong>{facility.name}</strong>

                        <p className="mt-1 text-xs">
                          {formatDistance(facility.distance)} away
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFacility(facility)
                          }
                          className="mt-2 text-xs font-semibold text-blue-600"
                        >
                          View details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>

          {!coordinates && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl bg-white/95 px-5 py-4 text-center shadow-lg">
                <MapPin
                  size={24}
                  className="mx-auto text-primary-600"
                />

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  Your map starts here
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Enable your location to discover nearby facilities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELECTED FACILITY DETAILS */}

      {selectedFacility && (
        <FacilityDetails
          facility={selectedFacility}
          category={category}
          onBack={() => setSelectedFacility(null)}
        />
      )}

      {/* RESULTS */}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Nearby {config.label}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? 'Searching OpenStreetMap...'
                : hasSearched
                  ? `${filteredFacilities.length} facilities found`
                  : 'Discover facilities around your location.'}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setSelectedFacility(null)
              }}
              placeholder="Search by facility name..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            <LoaderCircle
              size={20}
              className="animate-spin text-primary-600"
            />
            Finding nearby facilities...
          </div>
        )}

        {!loading &&
          hasSearched &&
          !error &&
          filteredFacilities.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <MapPin
                size={30}
                className="mx-auto text-slate-300"
              />

              <h4 className="mt-3 text-sm font-semibold text-slate-800">
                No matching facilities found
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {facilities.length === 0
                  ? 'No mapped facilities were returned within 5 km. This does not necessarily mean there are no facilities nearby.'
                  : 'Try a different search term.'}
              </p>
            </div>
          )}

        {!loading &&
          filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className={`rounded-xl border bg-white p-4 transition sm:p-5 ${
                selectedFacility?.id === facility.id
                  ? 'border-primary-400 shadow-sm'
                  : 'border-slate-200 hover:border-primary-200 hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedFacility(facility)}
                  className="flex min-w-0 flex-1 gap-3 text-left"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MapPin size={21} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-semibold text-slate-900">
                      {facility.name}
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {facility.address}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <Navigation size={13} />
                        {formatDistance(facility.distance)}
                      </span>

                      {facility.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={13} />
                          {facility.phone}
                        </span>
                      )}

                      {facility.openingHours && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={13} />
                          {facility.openingHours}
                        </span>
                      )}
                    </div>

                    <span className="mt-3 inline-flex text-xs font-semibold text-primary-600">
                      View facility details
                      <ExternalLink
                        size={13}
                        className="ml-1"
                      />
                    </span>
                  </div>
                </button>

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                  <a
                    href={getMapsUrl(facility)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                  >
                    <Navigation size={14} />
                    Directions
                  </a>

                  {facility.website && (
                    <a
                      href={getWebsiteUrl(facility.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <ExternalLink size={13} />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* DATA DISCLAIMER */}

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Facility information is sourced from OpenStreetMap.
          Listings may be incomplete or outdated. Always verify
          availability, operating hours and medical services
          directly with the facility before visiting.
        </p>
      </div>
    </div>
  )
}

export default NearbyHealthcareDiscovery
