import { useEffect } from 'react';
import L from 'leaflet';

// This component fixes Leaflet's marker icon issues
export const LeafletIconFix = () => {
  useEffect(() => {
    // Fix default icon paths - this uses direct URLs to ensure icons appear
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Apply the fixed icon to all markers by default
    L.Marker.prototype.options.icon = DefaultIcon;
    
    // Add CSS styles for additional safety
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-marker-icon {
        display: block !important;
      }
      .leaflet-container .leaflet-marker-pane img, 
      .leaflet-container .leaflet-shadow-pane img {
        max-width: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};
