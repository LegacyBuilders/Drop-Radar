import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { haversineDistance } from "@/lib/geo";

export default function DropPin({ drop, userPosition, onClick }) {
  const distance = userPosition
    ? haversineDistance(userPosition.lat, userPosition.lng, drop.latitude, drop.longitude)
    : Infinity;

  const isUnlocked = distance <= drop.radius_meters;
  const isNearby = distance <= drop.radius_meters * 2;

  const color = isUnlocked ? "#38e0d0" : isNearby ? "#a855f7" : "#64748b";
  const opacity = isUnlocked ? 0.8 : 0.4;

  const pinIcon = L.divIcon({
    className: "drop-pin",
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        ${isUnlocked ? `<div style="position:absolute;width:32px;height:32px;border-radius:50%;background:${color}20;animation:radar-pulse 2.5s ease-out infinite;"></div>` : ""}
        <div style="width:${isUnlocked ? 14 : 10}px;height:${isUnlocked ? 14 : 10}px;border-radius:50%;background:${color};border:2px solid ${isUnlocked ? '#fff' : color}40;box-shadow:0 0 ${isUnlocked ? 16 : 6}px ${color}80;position:relative;z-index:2;transition:all 0.3s;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <>
      <Circle
        center={[drop.latitude, drop.longitude]}
        radius={drop.radius_meters}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.06,
          weight: 1,
          opacity: opacity * 0.5,
          dashArray: isUnlocked ? null : "6 4",
        }}
      />
      <Marker
        position={[drop.latitude, drop.longitude]}
        icon={pinIcon}
        eventHandlers={{ click: onClick }}
      />
    </>
  );
}