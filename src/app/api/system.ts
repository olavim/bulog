import axios from 'axios';

const systemInstance = axios.create({ baseURL: '/api/system' });
systemInstance.interceptors.response.use(undefined, (err) => {
	if (axios.isAxiosError(err) && [401, 403].includes(err.response?.status ?? 0)) {
		window.location.href = '/login';
		return null;
	}

	throw err;
});

export async function rebootServer() {
	await systemInstance.post('/reboot');
}

export async function getEnvironment() {
	const res = await systemInstance.get('/environment');
	return res.data;
}
