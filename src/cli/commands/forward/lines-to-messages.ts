import JSON5 from 'json5';

export function linesToMessages(lines: string[]) {
	const messages: any[] = [];

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim().startsWith('{')) {
			let jsonChunk = '';
			let foundJson = false;

			for (let j = i; j < lines.length; j++) {
				jsonChunk += lines[j];

				if (lines[j].trim().endsWith('}')) {
					try {
						messages.push(JSON5.parse(jsonChunk));
						foundJson = true;
						i = j;
						break;
					} catch {
						// Ignore error
					}
				}
			}

			if (!foundJson) {
				messages.push(lines[i]);
			}
		} else {
			messages.push(lines[i]);
		}
	}

	return messages;
}
