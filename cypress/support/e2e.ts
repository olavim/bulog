Cypress.Commands.add('sendLogsToBulog', (logs) => {
	cy.task('sendLogsToBulog', logs);
});

Cypress.Commands.add('resetBulog', () => {
	const url = Cypress.config().baseUrl;

	cy.intercept('/api/config/reset')
		.as('resetConfig')
		.then(() => fetch(`${url}/api/config/reset`, { method: 'POST' }));

	cy.intercept('/api/cache/reset')
		.as('resetCache')
		.then(() => fetch(`${url}/api/cache/reset`, { method: 'POST' }));

	cy.wait(['@resetConfig', '@resetCache']);
});

Cypress.Commands.add('asText', { prevSubject: 'element' }, (subject, alias) => {
	cy.wrap(subject)
		.then((elements) => elements.map((_, el) => el.textContent))
		.as(alias);
});

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
	if (resizeObserverLoopErrRe.test(err.message)) {
		return false;
	}
});
