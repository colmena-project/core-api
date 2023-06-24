import { Client, DistanceMatrixResponse } from '@googlemaps/google-maps-services-js';
import {
  LatLngLiteral,
  AddressComponent,
  LatLng,
  DistanceMatrixRow,
  TravelMode,
  UnitSystem,
} from '@googlemaps/google-maps-services-js/dist/common';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js/dist/places/autocomplete';

const { GOOGLE_MAPS_API_KEY } = process.env;

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY cannot be loaded. Please check your .env file');
}

const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<{ formatted_address: string; address_components: AddressComponent[] }> => {
  if (!(latitude && longitude)) {
    throw new Error('Latitude and Longitude must be provided');
  }
  const client = new Client({});
  const result = await client.reverseGeocode({
    params: {
      latlng: {
        latitude,
        longitude,
      },
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1000, // milliseconds
  });
  if (result.data.error_message) {
    throw new Error(result.data.error_message);
  }
  if (result.data.status === 'ZERO_RESULTS') {
    throw new Error(`Cannot match any result to ${latitude} ${longitude} LatLng`);
  }
  return {
    formatted_address: result.data.results[0].formatted_address,
    address_components: result.data.results[0].address_components,
  };
};

const geocode = async (
  address: string,
): Promise<{ formatted_address: string; geocode: LatLngLiteral }> => {
  if (!address) {
    throw new Error('Address must be provided');
  }
  const client = new Client({});
  const result = await client.geocode({
    params: {
      address,
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1000, // milliseconds
  });
  if (result.data.error_message) {
    throw new Error(result.data.error_message);
  }
  if (result.data.status === 'ZERO_RESULTS') {
    throw new Error(`Cannot match any result to ${address} Address`);
  }
  return {
    formatted_address: result.data.results[0].formatted_address,
    geocode: result.data.results[0].geometry.location,
  };
};

const placeAutocomplete = async (
  address: string,
): Promise<{ predictions: PlaceAutocompleteResult[] }> => {
  if (!address) {
    throw new Error('Address must be provided');
  }
  const client = new Client({});
  const result = await client.placeAutocomplete({
    params: {
      input: address,
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1000, // milliseconds
  });

  if (result.data.error_message) {
    throw new Error(result.data.error_message);
  }
  if (result.data.status === 'ZERO_RESULTS') {
    throw new Error(`Cannot match any result to ${address} Address`);
  }
  return {
    predictions: result.data.predictions,
  };
};

const distancematrix = async (
  origin: LatLng,
  destination: LatLng,
): Promise<{ distance: DistanceMatrixRow[] }> => {
  const client = new Client({});
  const result: DistanceMatrixResponse = await client.distancematrix({
    params: {
      origins: [origin],
      destinations: [destination],
      mode: TravelMode.driving,
      units: UnitSystem.metric,
      key: GOOGLE_MAPS_API_KEY,
    },
    timeout: 1000, // milliseconds
  });
  if (result.data.error_message) {
    throw new Error(result.data.error_message);
  }
  if (result.data.status === 'ZERO_RESULTS') {
    throw new Error(`Cannot calculate distances from ${origin} to ${destination} coords`);
  }
  return {
    distance: result.data.rows,
  };
};

export default {
  geocode,
  reverseGeocode,
  placeAutocomplete,
  distancematrix,
};
