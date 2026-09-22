const axios = require('axios');
const FormData = require('form-data');

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(config => {
  console.log('Headers before sending:', config.headers);
  return config;
});

const form = new FormData();
form.append('test', 'value');

apiClient.post('/test', form, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
}).catch(() => {});
