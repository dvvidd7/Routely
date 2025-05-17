import { GOOGLE_MAPS_PLACES_LEGACY } from "@env";

export const fetchAirQualityData = async (latitude, longitude) => {
  const API_KEY = GOOGLE_MAPS_PLACES_LEGACY; 
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_PLACES_LEGACY}`;

  const requestBody = {
    location: { latitude, longitude },
    extraComputations: ['LOCAL_AQI', 'HEALTH_RECOMMENDATIONS'],
    languageCode: 'en',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    return null;
  }
};