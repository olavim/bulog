declare global {
	namespace Cypress {
		interface Chainable {
			sendLogs(logs: any[]): Chainable<void>;
			asText(alias: string): Chainable<JQuery<string>>;
		}
	}
}

export {};
