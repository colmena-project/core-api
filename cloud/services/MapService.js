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
  return result.data.results[0].formatted_address;
};

module.exports = {
  reverseGeocode,
};
