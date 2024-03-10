Cypress.Commands.add('sendLogs', (logs) => {
	cy.task('sendLogs', logs);
});
