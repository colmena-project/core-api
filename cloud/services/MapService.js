const { Client } = require('@googlemaps/google-maps-services-js');

const { GOOGLE_MAPS_API_KEY } = process.env;

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY cannot be loaded. Please check your .env file');
}

const reverseGeocode = async (latitude, longitude) => {
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
  return result.data.results[0].formatted_address;
};

const geocode = async (address) => {
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

module.exports = {
  geocode,
  reverseGeocode,
};
