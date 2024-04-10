export async function rebootServer() {
	await fetch('/api/system/reboot', {
		method: 'post'
	});
}

export async function getEnvironment() {
	const res = await fetch('/api/system/environment', {
		method: 'get'
	});

	return await res.json();
}
