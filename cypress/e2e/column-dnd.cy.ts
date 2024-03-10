describe('example to-do app', () => {
	beforeEach(() => {
		cy.visit('/');
		cy.sendLogs([{ bucket: 'cypress', message: 'test' }]);
	});

	it('dragging a column on top of another changes its position', () => {
		cy.get('[data-cy=log-column-header]').should('have.length', 2);
		cy.get('[data-cy=log-column-header]').then((columns) => {
			const headerText1 = columns[0].textContent;
			const headerText2 = columns[1].textContent;

			cy.get('[data-cy=log-cell]').should('have.length', 2);
			cy.get('[data-cy=log-cell]').then((cells) => {
				const cellText1 = cells[0].textContent;
				const cellText2 = cells[1].textContent;

				cy.get('[data-cy=drag-handle]').then((handles) => {
					const rect2 = handles[1].getBoundingClientRect();

					cy.wrap(handles[0]).trigger('pointerdown', {
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
						});

					cy.get('[data-cy=log-column-header]').eq(0).should('have.text', headerText2);
					cy.get('[data-cy=log-column-header]').eq(1).should('have.text', headerText1);

					cy.get('[data-cy=log-cell]').eq(0).should('have.text', cellText2);
					cy.get('[data-cy=log-cell]').eq(1).should('have.text', cellText1);
				});
			});
		});
	});
});
