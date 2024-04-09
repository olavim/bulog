describe('log tests', () => {
	beforeEach(() => {
		cy.resetBulog();
	});

	it('server remembers 1000 logs', () => {
		cy.visit('/');
		cy.sendLogsToBulog(
			Array.from(Array(2000)).map((_, i) => ({ bucket: `bucket-${(i % 2) + 1}`, message: i + 1 }))
		);

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').should('have.length', 2);

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').eq(0).click();
		cy.get('[data-cy=log-list]').scrollTo('top');
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-list]').scrollTo('bottom');
		cy.get('[data-cy=log-cell]').last().should('have.text', '1999');

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').eq(1).click();
		cy.get('[data-cy=log-list]').scrollTo('top');
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '2');
		cy.get('[data-cy=log-list]').scrollTo('bottom');
		cy.get('[data-cy=log-cell]').last().should('have.text', '2000');

		cy.visit('/');

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').eq(0).click();
		cy.get('[data-cy=log-list]').scrollTo('top');
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1001');
		cy.get('[data-cy=log-list]').scrollTo('bottom');
		cy.get('[data-cy=log-cell]').last().should('have.text', '1999');

		cy.get('[data-cy=bucket-tabs]').get('[data-cy=tab]').eq(1).click();
		cy.get('[data-cy=log-list]').scrollTo('top');
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1002');
		cy.get('[data-cy=log-list]').scrollTo('bottom');
		cy.get('[data-cy=log-cell]').last().should('have.text', '2000');
	});
});
