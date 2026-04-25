import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const saveDraft = async (data: any, token: string) => {
  return axios.post(`${API_URL}/worker/save-draft`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const submitReport = async (surveyId: string, token: string) => {
  return axios.post(`${API_URL}/worker/submit`, { surveyId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getPendingReports = async (token: string) => {
  return axios.get(`${API_URL}/ngo/pending-reports`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
