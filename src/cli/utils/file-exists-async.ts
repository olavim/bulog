import fs from 'fs';

export const fileExistsAsync = (path: string) =>
	fs.promises.stat(path).then(
		() => true,
		() => false
	);
