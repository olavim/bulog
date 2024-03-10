declare global {
	namespace Cypress {
		interface Chainable {
			sendLogs(logs: any[]): Chainable<void>;
		}
	}
}

export {};
