import React, { useEffect, Fragment } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
  Circle,
  useMap } from
'react-leaflet';
import 'leaflet/dist/leaflet.css';
interface Region {
  name: string;
  risk: string;
  cases: number;
  r0: number;
  color: string;
  lat: number;
  lng: number;
}
interface RwandaMapProps {
  regions: Region[];
  activeLayer: 'heatmap' | 'mobility';
  selectedRegion: Region | null;
  onRegionClick?: (region: Region) => void;
}
const MOBILITY_ROUTES: Array<{
  from: string;
  to: string;
  weight: number;
}> = [
{
  from: 'Kigali City',
  to: 'Eastern Province',
  weight: 4
},
{
  from: 'Kigali City',
  to: 'Southern Province',
  weight: 3
},
{
  from: 'Kigali City',
  to: 'Western Province',
  weight: 5
},
{
  from: 'Kigali City',
  to: 'Northern Province',
  weight: 3
},
{
  from: 'Western Province',
  to: 'Southern Province',
  weight: 2
}];

function FlyToRegion({ region }: {region: Region | null;}) {
  const map = useMap();
  useEffect(() => {
    if (region) {
      map.flyTo([region.lat, region.lng], 10, {
        duration: 1.2
      });
    } else {
      map.flyTo([-1.9403, 29.8739], 8, {
        duration: 1.2
      });
    }
  }, [region, map]);
  return null;
}
export function RwandaMap({
  regions,
  activeLayer,
  selectedRegion,
  onRegionClick
}: RwandaMapProps) {
  const findRegion = (name: string) => regions.find((r) => r.name === name);
  return (
    <MapContainer
      center={[-1.9403, 29.8739]}
      zoom={8}
      scrollWheelZoom={true}
      style={{
        height: '100%',
        width: '100%'
      }}
      className="bg-background rounded-xl">
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <FlyToRegion region={selectedRegion} />

      {/* Heatmap layer — soft halo circles sized by cases */}
      {activeLayer === 'heatmap' &&
      regions.map((region) => {
        const radius = Math.sqrt(region.cases) * 100;
        return (
          <Circle
            key={`halo-${region.name}`}
            center={[region.lat, region.lng]}
            radius={radius}
            pathOptions={{
              color: region.color,
              fillColor: region.color,
              fillOpacity: 0.2,
              weight: 1,
              opacity: 0.5
            }} />);


      })}

      {/* Mobility layer — dashed lines */}
      {activeLayer === 'mobility' &&
      MOBILITY_ROUTES.map((route, i) => {
        const from = findRegion(route.from);
        const to = findRegion(route.to);
        if (!from || !to) return null;
        return (
          <Polyline
            key={`route-${i}`}
            positions={[
            [from.lat, from.lng],
            [to.lat, to.lng]]
            }
            pathOptions={{
              color: '#3B82F6',
              weight: route.weight,
              opacity: 0.7,
              dashArray: '8 8'
            }} />);


      })}

      {/* Region markers */}
      {regions.map((region) => {
        const isSelected = selectedRegion?.name === region.name;
        const baseRadius = region.name === 'Kigali City' ? 12 : 10;
        return (
          <Fragment key={region.name}>
            {isSelected &&
            <Circle
              center={[region.lat, region.lng]}
              radius={8000}
              pathOptions={{
                color: region.color,
                fillColor: region.color,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '6 6'
              }} />

            }
            <CircleMarker
              center={[region.lat, region.lng]}
              radius={isSelected ? baseRadius + 4 : baseRadius}
              pathOptions={{
                color: isSelected ? region.color : '#FFFFFF',
                weight: isSelected ? 3 : 2,
                fillColor: region.color,
                fillOpacity: 0.95
              }}
              eventHandlers={{
                click: () => onRegionClick?.(region)
              }}>
              
              <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent>
                <div className="text-[11px]">
                  <div className="font-bold">{region.name}</div>
                  <div>
                    {region.cases.toLocaleString()} cases · R₀ {region.r0}
                  </div>
                  <div
                    style={{
                      color: region.color
                    }}
                    className="font-semibold">
                    
                    {region.risk}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          </Fragment>);

      })}
    </MapContainer>);

}