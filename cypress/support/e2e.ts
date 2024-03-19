Cypress.Commands.add('sendLogs', (logs) => {
	cy.task('sendLogs', logs);
});

Cypress.Commands.add('asText', { prevSubject: 'element' }, (subject, alias) => {
	cy.wrap(subject)
		.then((elements) => elements.map((_, el) => el.textContent))
		.as(alias);
});
