import axios from 'axios';

const PYTHON_API_URL = process.env.PYTHON_API_URL;

export const pythonApiClient = axios.create({
  baseURL: PYTHON_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

pythonApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      ' Python Agent API Error:',
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);
