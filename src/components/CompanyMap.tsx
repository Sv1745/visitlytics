
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';

interface CompanyMapProps {
  companies: Company[];
}

export const CompanyMap: React.FC<CompanyMapProps> = ({ companies }) => {
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
    }
  };

  if (showTokenInput) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Setup Map View
          </CardTitle>
          <CardDescription>
            Enter your Mapbox public token to view companies on the map.
            Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">mapbox.com</a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsaWRleGFtcGxlIn0..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
          </div>
          <Button onClick={handleTokenSubmit} className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Load Map
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Company Locations
          </CardTitle>
          <CardDescription>
            Interactive map showing all company locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-600">Map view will be implemented here</p>
              <p className="text-sm text-gray-500">
                Showing {companies.length} companies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="p-3">
            <div className="space-y-1">
              <h4 className="font-medium">{company.name}</h4>
              <p className="text-sm text-gray-600">{company.type}</p>
              {company.address && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {company.address}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
