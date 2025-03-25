import axios from "axios";

const UBER_SERVER_TOKEN = "your_uber_server_token"; // Get from Uber Developer Dashboard

export const getUberRideEstimate = async (start, end) => {
  const url = `https://api.uber.com/v1.2/estimates/price?start_latitude=${start.lat}&start_longitude=${start.lng}&end_latitude=${end.lat}&end_longitude=${end.lng}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${UBER_SERVER_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.prices; // Returns an array of Uber ride types & estimates
  } catch (error) {
    console.error("Error fetching Uber ride estimate:", error);
  }
};