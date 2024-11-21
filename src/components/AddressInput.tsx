import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

type AddressInputProps = {
  value: string;
  onChange: (address: string, isValid: boolean) => void;
  error?: string;
};

export default function AddressInput({ value, onChange, error }: AddressInputProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address, true);
      }
    }
  };

  if (loadError) {
    return (
      <div className="text-red-600">
        Error loading Google Maps. Please check your internet connection and try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-3 left-3 z-10">
        <MapPin className="h-5 w-5 text-gray-400" />
      </div>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        restrictions={{ country: "au" }}
        fields={["formatted_address", "geometry"]}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, false)}
          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Start typing your address..."
        />
      </Autocomplete>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}