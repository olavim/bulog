Cypress.Commands.add('sendLogsToBulog', (logs) => {
	cy.task('sendLogsToBulog', logs);
});

Cypress.Commands.add('resetBulog', () => {
	const url = Cypress.config().baseUrl!;

	cy.intercept('/api/config/reset', { statusCode: 200 })
		.as('resetConfig')
		.then(() => fetch(`${url}/api/config/reset`, { method: 'POST' }));

	cy.intercept('/api/system/cache/reset', { statusCode: 200 })
		.as('resetCache')
		.then(() => fetch(`${url}/api/system/cache/reset`, { method: 'POST' }));

	cy.wait(['@resetConfig', '@resetCache']);
});

Cypress.Commands.add('asText', { prevSubject: 'element' }, (subject, alias) => {
	cy.wrap(subject)
		.then((elements) => elements.map((_, el) => el.textContent))
		.as(alias);
});

Cypress.Commands.add('dnd', (from, to) => {
	const rect2 = to.getBoundingClientRect();

	cy.wrap(from).trigger('pointerdown', {
		force: true,
		isPrimary: true,
		button: 0
	});

	cy.wait(100);

	cy.document()
		.trigger('pointermove', {
			clientX: rect2.left,
			clientY: rect2.top,
			force: true,
			isPrimary: true,
			button: 0
		})
		.wait(100)
		.trigger('pointerup', {
			force: true,
			isPrimary: true,
			button: 0
		})
		.wait(100);
});

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
	if (resizeObserverLoopErrRe.test(err.message)) {
		return false;
	}
});
