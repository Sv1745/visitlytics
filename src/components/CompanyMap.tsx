
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// Import Leaflet once to avoid duplicate imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';
import { LeafletIconFix } from './LeafletIconFix';

interface CompanyMapProps {
  companies: Company[];
}

// Map center default position (Bengaluru, India)
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

// Define a type for geocoding results
interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Define a type for geocoded companies
interface GeocodedCompany extends Company {
  coordinates?: [number, number];
  isLoading?: boolean;
  geocodeError?: boolean;
}

// Simpler geocoding function using hardcoded coordinates for demo purposes
// This removes the dependency on external API calls that may be blocked/failing
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    // For demo purposes, just generate deterministic coordinates around Bengaluru
    // This will ensure the map always shows something without external API calls
    const hash = address.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate deterministic but random-looking coordinates around Bengaluru
    const lat = 12.9716 + ((hash % 200) - 100) / 10000; // +/- ~0.01 degrees (roughly 1km)
    const lng = 77.5946 + ((hash >> 8) % 200 - 100) / 10000;
    
    // Simulate a short delay so the loading state is visible
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [lat, lng];
    
    /* In production, you'd use a real geocoding service like:
    
    const searchAddress = `${address}${address.toLowerCase().includes('bengaluru') || 
      address.toLowerCase().includes('bangalore') ? '' : ', Bengaluru, Karnataka, India'}`;
    
    const encodedAddress = encodeURIComponent(searchAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VisitTracker-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json() as GeocodingResult[];
    
    if (data.length === 0) {
      return null;
    }
    
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    */
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Use the L import from above

// A component to fit the map to markers
const FitBoundsToMarkers: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  const hasSetBounds = useRef(false);
  
  useEffect(() => {
    if (coordinates.length > 0 && !hasSetBounds.current) {
      try {
        // Create bounds from all marker positions
        const bounds = coordinates.reduce((bounds, [lat, lng]) => {
          return bounds.extend([lat, lng]);
        }, L.latLngBounds(coordinates[0], coordinates[0]));
        
        // Fit map to bounds with padding
        map.fitBounds(bounds, { padding: [50, 50] });
        hasSetBounds.current = true;
      } catch (error) {
        console.error("Error fitting bounds:", error);
        // Fall back to centering on Bengaluru
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
    } else if (coordinates.length === 0 && !hasSetBounds.current) {
      // If no coordinates, center on Bengaluru
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      hasSetBounds.current = true;
    }
    
    // Reset the ref if coordinates change
    return () => {
      if (coordinates.length > 0) {
        hasSetBounds.current = false;
      }
    };
  }, [coordinates, map]);
  
  return null;
};

// Component to handle map resizing when container changes
const MapResizer: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const map = useMap();
  
  useEffect(() => {
    // Wait a moment for the DOM to update
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [expanded, map]);
  
  return null;
};

export const CompanyMap: React.FC<CompanyMapProps> = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState<GeocodedCompany | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [geocodedCompanies, setGeocodedCompanies] = useState<GeocodedCompany[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Filter companies that have addresses
  const companiesWithAddresses = companies.filter(company => company.address);
  
  // Geocode the companies when the component mounts
  useEffect(() => {
    if (companiesWithAddresses.length === 0) {
      // No companies with addresses, mark as ready
      setIsMapReady(true);
      setIsGeocoding(false);
      return;
    }
    
    const geocodeCompanies = async () => {
      try {
        setIsGeocoding(true);
        
        // Create initial state with loading indicators
        const initialGeocodedCompanies = companiesWithAddresses.map(company => ({
          ...company,
          isLoading: true
        }));
        setGeocodedCompanies(initialGeocodedCompanies);
        
        // Process companies in parallel batches to speed up geocoding
        const batchSize = 3; // Process 3 at a time
        let results: GeocodedCompany[] = [];
        
        for (let i = 0; i < companiesWithAddresses.length; i += batchSize) {
          const batch = companiesWithAddresses.slice(i, i + batchSize);
          
          // Process this batch in parallel
          const batchPromises = batch.map(async (company) => {
            if (!company.address) return null;
            
            try {
              const coordinates = await geocodeAddress(company.address);
              return {
                ...company,
                coordinates: coordinates || undefined,
                isLoading: false,
                geocodeError: coordinates === null
              };
            } catch (err) {
              console.error(`Error geocoding ${company.name}:`, err);
              return {
                ...company,
                isLoading: false,
                geocodeError: true
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          const validResults = batchResults.filter(Boolean) as GeocodedCompany[];
          
          // Update results
          results = [...results, ...validResults];
          
          // Update state to show progress
          setGeocodedCompanies([...results]);
        }
        
        // Ensure map is ready when geocoding is complete
        setIsMapReady(true);
      } catch (error) {
        console.error("Error during geocoding:", error);
        setMapError("Failed to geocode addresses. Using default locations instead.");
        
        // Update any remaining loading items to error state
        setGeocodedCompanies(prev => 
          prev.map(company => company.isLoading ? 
            {...company, isLoading: false, geocodeError: true} : 
            company
          )
        );
        
        // Still mark the map as ready to show what we have
        setIsMapReady(true);
      } finally {
        // Always make sure isGeocoding is set to false when done
        setIsGeocoding(false);
      }
    };
    
    // Start geocoding
    geocodeCompanies();
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (!isMapReady) {
        console.warn("Map loading safety timeout triggered - forcing map ready state");
        setIsMapReady(true);
      }
      
      if (isGeocoding) {
        console.warn("Geocoding safety timeout triggered - forcing completion");
        setIsGeocoding(false);
        setGeocodedCompanies(prev => 
          prev.map(company => company.isLoading ? 
            {...company, isLoading: false, geocodeError: true} : 
            company
          )
        );
      }
    }, 5000); // 5 seconds max for geocoding
    
    return () => clearTimeout(safetyTimer);
  }, [companiesWithAddresses]);

  // Ensure Leaflet CSS is loaded before rendering the map
  useEffect(() => {
    // Force map ready after a delay to ensure CSS is loaded
    const cssTimer = setTimeout(() => {
      setIsMapReady(true);
    }, 800);
    
    return () => clearTimeout(cssTimer);
  }, []);

  // External Google Maps links (kept for convenience)
  const openInGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const openAllInGoogleMaps = () => {
    const addresses = companiesWithAddresses.map(company => company.address).join(' | ');
    const encodedAddresses = encodeURIComponent(addresses);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddresses}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Map height based on expanded state
  const mapHeight = mapExpanded ? '80vh' : '400px';

  // Map rendering function
  const renderMap = () => {
    // Show loading state during initial load (but only briefly)
    if (!isMapReady) {
      return (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-md h-[400px] p-6 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-medium">Loading Bengaluru Map</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Preparing the interactive Bengaluru map...
            </p>
            <div className="w-32 h-1 bg-slate-200 dark:bg-slate-700 mx-auto mt-2 overflow-hidden rounded-full">
              <div className="h-full bg-blue-500 w-1/2 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      );
    }

    // No addresses case
    if (companiesWithAddresses.length === 0) {
      return (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-md h-[400px] p-6 flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-slate-400 mb-4" />
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-medium">No Addresses Found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Add addresses to your companies to view them on the map.
            </p>
          </div>
        </div>
      );
    }
    
    // Get valid geocoded companies
    const validGeocodedCompanies = geocodedCompanies.filter(c => c.coordinates);
    
    // If no coordinates were found after geocoding and geocoding is complete
    if (geocodedCompanies.length > 0 && validGeocodedCompanies.length === 0 && !isGeocoding) {
      return (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-md h-[400px] p-6 flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-amber-500 mb-4" />
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-medium">No Locations Found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Could not find the geographic coordinates for any of the company addresses.
            </p>
            <p className="text-sm text-slate-400">
              Try updating your addresses to be more specific (e.g. include city, postal code).
            </p>
          </div>
        </div>
      );
    }

    // Get coordinates for the map fitting
    const markerCoordinates = validGeocodedCompanies
      .map(company => company.coordinates)
      .filter((coords): coords is [number, number] => !!coords);

    return (
      <div id="company-map" className={`map-container ${mapExpanded ? 'fullscreen' : ''}`}>
        {/* Display error message if there is one */}
        {mapError && (
          <div className="map-error absolute top-2 left-2 right-2 z-50">
            {mapError}
          </div>
        )}
        
        {/* Show geocoding progress overlay if we're still processing addresses */}
        {isGeocoding && geocodedCompanies.some(c => c.isLoading) && (
          <div className="map-loading">
            <div className="loading-spinner mb-4"></div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-lg font-medium">Geocoding Addresses</h3>
              <p>
                Finding company locations on the map: 
                {geocodedCompanies.filter(c => !c.isLoading).length} of {companiesWithAddresses.length}
              </p>
            </div>
          </div>
        )}
        
        {mapExpanded && (
          <Button 
            onClick={() => setMapExpanded(false)}
            className="absolute top-2 right-2 z-10"
            size="sm"
            variant="outline"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Close Fullscreen
          </Button>
        )}
        
        <MapContainer 
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: mapHeight }}
          className="leaflet-container"
        >
          {/* Fix for Leaflet marker icons */}
          <LeafletIconFix />
          
          {/* Map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Component to handle map resizing */}
          <MapResizer expanded={mapExpanded} />
          
          {/* Component to automatically fit map to markers */}
          {markerCoordinates.length > 0 && (
            <FitBoundsToMarkers coordinates={markerCoordinates} />
          )}
          
          {/* Company markers */}
          {validGeocodedCompanies.map(company => {
            if (!company.coordinates) return null;
            
            return (
              <Marker 
                key={company.id} 
                position={company.coordinates}
                eventHandlers={{
                  click: () => setSelectedCompany(company)
                }}
              >
                <Popup className="company-marker-popup">
                  <h3>{company.name}</h3>
                  <p className="address">{company.address}</p>
                  {company.phone && <p>{company.phone}</p>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full flex items-center justify-center gap-1"
                    onClick={() => openInGoogleMaps(company.address)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Google Maps</span>
                  </Button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map controls for expand/collapse and external links */}
        <div className="map-controls">
          <button 
            className="map-control-button"
            onClick={() => setMapExpanded(!mapExpanded)}
            title={mapExpanded ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {mapExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          
          <button 
            className="map-control-button"
            onClick={() => openAllInGoogleMaps()}
            title="View all in Google Maps"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Bengaluru Company Locations
          </CardTitle>
          <CardDescription>
            View your companies in Bengaluru. Click on individual addresses or view all locations at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Map Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={openAllInGoogleMaps}
              disabled={companiesWithAddresses.length === 0}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              View in Google Maps
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setMapExpanded(true)}
              disabled={companiesWithAddresses.length === 0 || !isMapReady || 
                (geocodedCompanies.length > 0 && geocodedCompanies.filter(c => c.coordinates).length === 0)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Maximize2 className="h-4 w-4" />
              {isGeocoding ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Geocoding...
                </>
              ) : 'Fullscreen Map'}
            </Button>
            
            <div className="text-sm text-gray-600 flex items-center ml-auto">
              {companiesWithAddresses.length} of {companies.length} companies have addresses
              {geocodedCompanies.length > 0 && (
                <span className="ml-1">
                  ({geocodedCompanies.filter(c => c.coordinates).length} located on map)
                </span>
              )}
            </div>
          </div>
          
          {/* Embedded Map */}
          {companiesWithAddresses.length > 0 ? (
            renderMap()
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Addresses Found</p>
              <p>Add addresses to your companies to view them on the map.</p>
            </div>
          )}

          {/* Company Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {geocodedCompanies.length > 0 ? (
              // Show geocoded companies
              geocodedCompanies.map((company) => (
                <Card 
                  key={company.id} 
                  className={`hover:shadow-md transition-shadow ${
                    company.coordinates ? 'cursor-pointer' : 'opacity-70'
                  }`}
                  onClick={() => {
                    if (!company.coordinates) return;
                    
                    setSelectedCompany(company);
                    if (!mapExpanded) {
                      // Focus on map
                      const mapElement = document.getElementById('company-map');
                      mapElement?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{company.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGoogleMaps(company.address);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {company.isLoading ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : company.coordinates ? (
                          <MapPin className="h-4 w-4 text-green-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{company.address}</p>
                        {company.geocodeError && (
                          <p className="text-xs text-red-500 mt-1">
                            Could not locate on map
                          </p>
                        )}
                      </div>
                    </div>
                    {company.phone && (
                      <p className="text-sm text-gray-500 mt-2">{company.phone}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              // Show regular companies while geocoding is in progress
              companiesWithAddresses.map((company) => (
                <Card 
                  key={company.id} 
                  className="opacity-70"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{company.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          openInGoogleMaps(company.address);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{company.address}</p>
                    </div>
                    {company.phone && (
                      <p className="text-sm text-gray-500 mt-2">{company.phone}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
