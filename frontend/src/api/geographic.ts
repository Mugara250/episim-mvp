import { geoArea, type GeoPermissibleObjects } from 'd3-geo';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { client, unwrap } from './client';
import type { Bands, Range } from './comparison';

// Geographic spread (docs Module 9): real district boundaries plus per-district results of a seihfr_geo run.
// Capacity is applied by the server at read time; the colour scale is fixed for the whole run.

export interface DistrictProps {
  code: string;
  name: string;
  province: string;
  /** Label position: polygon centroid, lon/lat. */
  cx: number;
  cy: number;
}

export type DistrictBoundaries = FeatureCollection<Polygon | MultiPolygon, DistrictProps> & {attribution: string;};

export type BedStatus = 'within' | 'tight' | 'short' | 'unknown';

export interface DistrictResult {
  code: string;
  name: string;
  province: string | null;
  population: number | null;
  /** Beds from the chosen capacity profile; null without one. */
  beds: number | null;
  /** Share of Monte Carlo runs in which the district gets at least one case. */
  pReached: number | null;
  firstCaseDay: Range;
  totalCases: Range;
  peakDay: Range;
  peakHospitalised: Range;
  pBedsExceeded: number | null;
  bedsRunOutDay: number | null;
  status: BedStatus;
  series: {cumulative: Bands;hospitalised: Bands;};
}

export interface MovementLink {
  from: string;
  to: string;
  tripsPerDay: number;
}

export interface BorderRisk {
  country: string;
  risk: 'High' | 'Medium' | 'Low';
  side: 'west' | 'north' | 'east' | 'south' | null;
  note: string | null;
}

export interface GeoResults {
  runId: string;
  days: number;
  seedDistrictCode: string | null;
  label: string;
  boundaryAttribution: string;
  illustrative: boolean;
  capacity: {profileId: string;profileName: string;placeholder: boolean;hasDistrictBeds: boolean;} | null;
  scale: {maxCumulativeCases: number;maxBedRatio: number;};
  districts: DistrictResult[];
  watchList: string[];
  movement: {method?: string;estimated?: boolean;label: string;note?: string;links?: MovementLink[];params?: {away_share?: number;};};
  borderRisks: BorderRisk[];
}

export interface WhatIfSide {
  totalCases: Range | null;
  peakDay: Range | null;
  peakHospitalised: Range | null;
  bedsRunOutDay: number | null;
  pBedsExceeded: number | null;
  beds: number | null;
  status: BedStatus | null;
}

export interface WhatIfResult {
  runId: string;
  districtCode: string;
  responseStartDay: number;
  preview: boolean;
  runs: number;
  before: WhatIfSide;
  after: WhatIfSide;
  nationalBefore: {finalCases: Range | null;};
  nationalAfter: {finalCases: Range | null;};
}

/**
 * The boundary file follows GeoJSON (RFC 7946): exterior rings run counter-clockwise. d3-geo works on
 * the sphere and reads that winding as "everything except this district", which fills the whole map.
 * Reverse the rings of any feature whose spherical area exceeds a hemisphere. Shapes are unchanged.
 */
function rewindForD3(fc: DistrictBoundaries): DistrictBoundaries {
  const features = fc.features.map((f) => {
    if (geoArea(f as GeoPermissibleObjects) <= 2 * Math.PI) return f;
    const g = f.geometry as {type: string;coordinates: number[][][] | number[][][][];};
    const coordinates =
    g.type === 'MultiPolygon' ?
    (g.coordinates as number[][][][]).map((poly) => poly.map((ring) => [...ring].reverse())) :
    (g.coordinates as number[][][]).map((ring) => [...ring].reverse());
    return { ...f, geometry: { ...g, coordinates } };
  });
  return { ...fc, features } as DistrictBoundaries;
}

export function useDistrictBoundaries() {
  return useQuery({
    queryKey: ['geographic', 'districts'],
    staleTime: Infinity,
    queryFn: async () =>
    rewindForD3(unwrap(await client.GET('/api/geographic/districts', {})) as unknown as DistrictBoundaries)
  });
}

export function useGeoResults(runId: string | null, capacityId: string | null) {
  return useQuery({
    queryKey: ['geographic', 'results', runId, capacityId],
    enabled: !!runId,
    queryFn: async () =>
    unwrap(
      await client.GET('/api/simulations/{run_id}/geographic', {
        params: { path: { run_id: runId as string }, query: { capacityProfileId: capacityId ?? undefined } }
      })
    ) as unknown as GeoResults
  });
}

export function useGeoWhatIf(runId: string | null, capacityId: string | null) {
  return useMutation({
    mutationFn: async (body: {districtCode: string;responseStartDay: number;}) =>
    unwrap(
      await client.POST('/api/simulations/{run_id}/geographic/what-if', {
        params: { path: { run_id: runId as string }, query: { capacityProfileId: capacityId ?? undefined } },
        body
      })
    ) as unknown as WhatIfResult
  });
}
