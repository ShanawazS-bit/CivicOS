
# CivicOS Architecture Extension: Geofencing Implementation Guide

This guide details the integration of spatial geofencing within CivicOS. It enhances **Layer 1 (Ingestion)**, **Layer 2 (The Trust Engine)**, and **Layer 5 (Government Accountability)** by enabling geographic restriction, automated municipal routing, and region-based risk assessment.

---

## 1. Architectural Overview & Workflow

Geofencing transforms static point data (`latitude`, `longitude`) into contextual municipal realities. The system parses spatial telemetry using the following funnel:

```text
Report Ingested (Point) 
  └── 1. Global Boundary Check (Within city limits? If no → Reject/Flag)
  └── 2. Ward Assignment (Which polygon contains this point? → Assign Dept)
  └── 3. Risk Multiplier Check (Is it a known flood/vulnerability zone? → Boost S_f)



  -- Enable PostGIS extension if not already done
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Geofences Reference Table
CREATE TABLE public.geofences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,                  -- e.g., "Ward 4 - Jamshedpur", "Bandra West Zone"
    fence_type TEXT NOT NULL,            -- 'boundary' (jurisdiction), 'ward' (routing), 'high_risk' (multiplier)
    metadata JSONB DEFAULT '{}'::jsonb,  -- Holds department contacts or vulnerability metrics
    polygon GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add spatial index for efficient geometric intersection lookups
CREATE INDEX IF NOT EXISTS geofences_geo_idx ON public.geofences USING gist(polygon);

-- Modify issues table to accommodate automated geofence assignment
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES public.geofences(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS inside_jurisdiction BOOLEAN DEFAULT true;


3.1 Global Boundary Validation RPC
Used by API edge functions to instantly reject inputs outside municipal operational boundaries.

CREATE OR REPLACE FUNCTION is_within_service_area(lat FLOAT, lng FLOAT)
RETURNS BOOLEAN AS $$
DECLARE
    point_geom GEOMETRY;
    inside BOOLEAN;
BEGIN
    point_geom := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
    
    -- Evaluates true if point intersects any polygon flagged as the city 'boundary'
    SELECT EXISTS (
        SELECT 1 FROM public.geofences 
        WHERE fence_type = 'boundary' 
        AND ST_Contains(polygon, point_geom)
    ) INTO inside;
    
    RETURN inside;
END;
$$ LANGUAGE plpgsql;



3.2 Automated Ward Assignment & Trust Multiplier Trigger
This trigger fires seamlessly on BEFORE INSERT to assign administrative responsibility and calculate spatial trust risk.
CREATE OR REPLACE FUNCTION process_spatial_metadata_on_issue()
RETURNS TRIGGER AS $$
DECLARE
    found_ward_id UUID;
    is_high_risk BOOLEAN;
BEGIN
    -- 1. Locate containing administrative ward boundary
    SELECT id INTO found_ward_id
    FROM public.geofences
    WHERE fence_type = 'ward'
      AND ST_Contains(polygon, NEW.location)
    LIMIT 1;
    
    NEW.ward_id := found_ward_id;

    -- 2. Check if the issue sits inside a flagged high-risk zone
    SELECT EXISTS (
        SELECT 1 FROM public.geofences
        WHERE fence_type = 'high_risk'
          AND ST_Contains(polygon, NEW.location)
    ) INTO is_high_risk;

    -- 3. Hackathon Trust Score Modifier (Boost trust score if in vulnerable areas)
    IF is_high_risk THEN
        NEW.trust_score := LEAST(100, NEW.trust_score + 15);
    END IF;

    -- 4. Set jurisdiction sanity flag
    IF found_ward_id IS NULL THEN
        NEW.inside_jurisdiction := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ts_process_spatial_metadata
    BEFORE INSERT ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION process_spatial_metadata_on_issue();


4.To display administrative zones on the Day 2 Municipal Admin Dashboard, load boundaries using standard GeoJSON primitives inside your Mapbox/MapLibre canvas layers.

4.1 Rendering Geofence Layers
import React from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import type { FillLayer } from 'react-map-gl';

// GeoJSON configuration defining ward boundaries
const wardLayerStyle: FillLayer = {
  id: 'ward-layer',
  type: 'fill',
  paint: {
    'fill-color': '#E11D2E',
    'fill-opacity': 0.1,
    'fill-outline-color': '#E11D2E',
  },
};

export function MunicipalAdminMap({ geoJsonWardData, issuesList }) {
  return (
    <Map
      initialViewState={{ longitude: 86.2049, latitude: 22.7934, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
    >
      {/* Geofence Overlay Layer */}
      {geoJsonWardData && (
        <Source type="geojson" data={geoJsonWardData}>
          <Layer {...wardLayerStyle} />
        </Source>
      )}
      
      {/* Existing Pin Rendering Code for Issues here... */}
    </Map>
  );
}


Client-Side Sanity Verification (Optimistic UI Validation)
Install @turf/boolean-point-in-polygon to intercept reports on the device before running network actions.
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';

export function verifyLocationLocally(userLat: number, userLng: number, cityBoundaryGeoJson: any): boolean {
  const userLocationPoint = point([userLng, userLat]);
  const boundaryPolygon = polygon(cityBoundaryGeoJson.geometry.coordinates);
  
  return booleanPointInPolygon(userLocationPoint, boundaryPolygon);
}


Hackathon Verification & Testing Script
Run this test script directly in your Supabase SQL editor to seed a test polygon and prove your ingestion pipeline automatically detects, processes, and flags incident spatial bounds:
-- 1. Insert a mock Ward boundary around Jamshedpur coordinates
INSERT INTO public.geofences (name, fence_type, polygon)
VALUES (
    'Ward Alpha Central', 
    'ward', 
    ST_Polygon(ST_GeomFromText('LINESTRING(86.19 22.78, 86.22 22.78, 86.22 22.81, 86.19 22.81, 86.19 22.78)'), 4326)
);

-- 2. Insert an issue inside the boundary box
INSERT INTO public.issues (issue_type, severity, description, location)
VALUES (
    'Pothole', 
    'High', 
    'Test incident within geofenced parameters.', 
    ST_SetSRID(ST_MakePoint(86.2049, 22.7934), 4326)
);

-- 3. Verify execution and auto-assignment pipeline
SELECT id, issue_type, ward_id, inside_jurisdiction 
FROM public.issues 
ORDER BY created_at DESC 
LIMIT 1;