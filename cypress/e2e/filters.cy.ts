describe('filter tests', () => {
	beforeEach(() => {
		cy.resetBulog();
	});

	it('create a new filter', () => {
		cy.visit('/');
		cy.sendLogsToBulog([
			{ bucket: 'bucket-1', message: 1 },
			{ bucket: 'bucket-2', message: 2 },
			{ bucket: 'bucket-3', message: 3 },
			{ bucket: 'bucket-1', message: 4 },
			{ bucket: 'bucket-2', message: 5 },
			{ bucket: 'bucket-3', message: 6 }
		]);

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').should('have.length', 3);

		cy.get('[data-cy=new-filter-button]').click();

		cy.get('[data-cy=log-cell]').should('have.length', 12);
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-cell]').eq(3).should('have.text', '2');
		cy.get('[data-cy=log-cell]').eq(5).should('have.text', '3');
		cy.get('[data-cy=log-cell]').eq(7).should('have.text', '4');
		cy.get('[data-cy=log-cell]').eq(9).should('have.text', '5');
		cy.get('[data-cy=log-cell]').eq(11).should('have.text', '6');

		cy.get('[data-cy=filter-settings-button]').click();
		cy.get('[data-cy=filter-name-input]').clear().type('filter-1');
		cy.get('[data-cy=filter-predicate-input]')
			.clear()
			.type('return log => log.bucket === "bucket-1" || log.bucket === "bucket-3"');
		cy.get('[data-cy=save-filter-button]').click();
		cy.get('[data-cy=close-drawer-button]').click();

		cy.get('[data-cy=log-cell]').should('have.length', 8);
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-cell]').eq(3).should('have.text', '3');
		cy.get('[data-cy=log-cell]').eq(5).should('have.text', '4');
		cy.get('[data-cy=log-cell]').eq(7).should('have.text', '6');
	});
});
