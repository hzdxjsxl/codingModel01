import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getPlanningData = async () => {
  try {
    const response = await apiClient.get('/planning-data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch planning data:', error);
    throw error;
  }
};

export default {
  getPlanningData
};
