import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import DropPin from "./DropPin";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function UserLocationMarker({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, []);

  if (!position) return null;

  const userIcon = L.divIcon({
    className: "user-marker",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(56,224,208,0.15);animation:radar-pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(56,224,208,0.2);animation:radar-pulse 2s ease-out infinite 0.5s;"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#38e0d0;border:3px solid #0d1526;box-shadow:0 0 12px rgba(56,224,208,0.6);position:relative;z-index:2;"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return <Marker position={[position.lat, position.lng]} icon={userIcon} />;
}

export default function MapView({ position, drops, onDropClick, userPosition }) {
  const center = position ? [position.lat, position.lng] : [40.7128, -74.006];

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      <UserLocationMarker position={position} />

      {drops.map((drop) => (
        <DropPin
          key={drop.id}
          drop={drop}
          userPosition={userPosition}
          onClick={() => onDropClick(drop)}
        />
      ))}
    </MapContainer>
  );
}