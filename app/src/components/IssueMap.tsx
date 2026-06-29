import { useCallback, useMemo, useRef } from 'react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Issue } from '@/types'
import { getClusterCenter } from '@/lib/clusterDetection'
import { geofencesToFeatureCollection } from '@/lib/geofencing'
import { severityColor } from '@/lib/severityColor'

const DEFAULT_CENTER = { lat: 22.7934, lng: 86.2049 }
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright'
const GEOFENCE_DATA = geofencesToFeatureCollection()

// Start zoomed way out — India from space level
const INTRO_VIEW = { latitude: 22.0, longitude: 80.0, zoom: 2 }

const geofenceFillLayer: FillLayerSpecification = {
  id: 'civicos-geofence-fill',
  type: 'fill',
  source: 'civicos-geofences',
  paint: {
    'fill-color': [
      'match',
      ['get', 'fence_type'],
      'high_risk',
      '#E11D2E',
      'ward',
      '#111111',
      '#E11D2E',
    ],
    'fill-opacity': [
      'match',
      ['get', 'fence_type'],
      'high_risk',
      0.16,
      'ward',
      0.06,
      0.04,
    ],
  },
}

const geofenceLineLayer: LineLayerSpecification = {
  id: 'civicos-geofence-line',
  type: 'line',
  source: 'civicos-geofences',
  paint: {
    'line-color': [
      'match',
      ['get', 'fence_type'],
      'high_risk',
      '#E11D2E',
      'ward',
      '#111111',
      '#E11D2E',
    ],
    'line-width': ['match', ['get', 'fence_type'], 'boundary', 2, 1],
    'line-dasharray': ['match', ['get', 'fence_type'], 'high_risk', ['literal', [2, 1]], ['literal', [1, 0]]],
  },
}

interface IssueMapProps {
  issues: Issue[]
  selectedId?: string | null
  onSelectIssue?: (id: string) => void
  showCluster?: boolean
  showGeofences?: boolean
  height?: string
}

export function IssueMap({
  issues,
  selectedId,
  onSelectIssue,
  showCluster = true,
  showGeofences = true,
  height = '500px',
}: IssueMapProps) {
  const mapRef = useRef<MapRef>(null)
  const withCoords = issues.filter((i) => i.lat != null && i.lng != null)
  const clusterCenter = showCluster ? getClusterCenter(withCoords) : null

  const targetView = useMemo(() => {
    if (withCoords.length === 0) {
      return { latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng, zoom: 14 }
    }
    const lats = withCoords.map((i) => i.lat!)
    const lngs = withCoords.map((i) => i.lng!)
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      zoom: withCoords.length === 1 ? 15 : 13,
    }
  }, [withCoords])

  // On map load, fly from world-level zoom into the target location
  const handleMapLoad = useCallback(() => {
    mapRef.current?.flyTo({
      center: [targetView.longitude, targetView.latitude],
      zoom: targetView.zoom,
      duration: 6000,
      essential: true,
      curve: 1.2,   // gentler arc — slower, more cinematic pull-down
      speed: 0.4,
    })
  }, [targetView])

  return (
    <div className="overflow-hidden rounded-xl border border-brand-hairline" style={{ height }}>
      <Map
        ref={mapRef}
        initialViewState={INTRO_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {showGeofences && (
          <Source id="civicos-geofences" type="geojson" data={GEOFENCE_DATA}>
            <Layer {...geofenceFillLayer} />
            <Layer {...geofenceLineLayer} />
          </Source>
        )}

        {withCoords.map((issue) => (
          <Marker
            key={issue.id}
            latitude={issue.lat!}
            longitude={issue.lng!}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSelectIssue?.(issue.id)
            }}
          >
            <div
              className="cursor-pointer rounded-full border-2 border-white transition-transform hover:scale-110"
              style={{
                width: selectedId === issue.id ? 18 : 14,
                height: selectedId === issue.id ? 18 : 14,
                backgroundColor: severityColor(issue.severity),
                boxShadow:
                  selectedId === issue.id
                    ? `0 0 0 3px ${severityColor(issue.severity)}55`
                    : undefined,
              }}
              title={`${issue.issue_type} — trust ${issue.trust_score}`}
            />
          </Marker>
        ))}

        {clusterCenter && (
          <Marker latitude={clusterCenter.lat} longitude={clusterCenter.lng} anchor="center">
            <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full border-2 border-brand-red bg-brand-red/20">
              <span className="text-xs font-bold text-brand-red">!</span>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  )
}
