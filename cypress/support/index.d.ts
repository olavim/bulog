declare global {
	namespace Cypress {
		interface Chainable {
			sendLogsToBulog(logs: any[]): Chainable<void>;
			resetBulog(): Chainable<void>;
			asText(alias: string): Chainable<JQuery<string>>;
			dnd(from: HTMLElement, to: HTMLElement): Chainable<void>;
		}
	}
}

export {};
