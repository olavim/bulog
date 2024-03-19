function dndElement(from: HTMLElement, to: HTMLElement) {
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
		});
}

describe('column tests', () => {
	beforeEach(() => {
		cy.visit('/');
		cy.sendLogs([{ bucket: 'cypress', message: { col1: 'test1', col2: 'test2' } }]);
	});

	it('drag the first column on top of the second and back', () => {
		cy.get('[data-cy=log-column-header]').should('have.length', 2);
		cy.get('[data-cy=log-column-header]').asText('columnHeaders');
		cy.get('[data-cy=log-cell]').should('have.length', 2);
		cy.get('[data-cy=log-cell]').asText('cells');

		cy.get('[data-cy=drag-handle]').then((handles) => {
			dndElement(handles[0], handles[1]);
		});

		cy.get('@columnHeaders').then((columnHeaders) => {
			cy.get('[data-cy=log-column-header]').eq(0).should('have.text', columnHeaders[1]);
			cy.get('[data-cy=log-column-header]').eq(1).should('have.text', columnHeaders[0]);
		});

		cy.get('@cells').then((cells) => {
			cy.get('[data-cy=log-cell]').eq(0).should('have.text', cells[1]);
			cy.get('[data-cy=log-cell]').eq(1).should('have.text', cells[0]);
		});

		cy.get('[data-cy=drag-handle]').then((handles) => {
			dndElement(handles[1], handles[0]);
		});

		cy.get('@columnHeaders').then((columnHeaders) => {
			cy.get('[data-cy=log-column-header]').eq(0).should('have.text', columnHeaders[0]);
			cy.get('[data-cy=log-column-header]').eq(1).should('have.text', columnHeaders[1]);
		});

		cy.get('@cells').then((cells) => {
			cy.get('[data-cy=log-cell]').eq(0).should('have.text', cells[0]);
			cy.get('[data-cy=log-cell]').eq(1).should('have.text', cells[1]);
		});
	});

	it('create a new column and drag it on top of the first, then delete it', () => {
		cy.get('[data-cy=new-column-button]').click();

		cy.get('[data-cy=log-column-header]').should('have.length', 3);
		cy.get('[data-cy=log-cell]').should('have.length', 3);

		cy.get('[data-cy=log-column-header]').eq(1).click();
		cy.get('[data-cy=column-name-input]').clear().type('col1');
		cy.get('[data-cy=column-formatter-input]').clear().type('return log => log.message.col1');
		cy.get('[data-cy=save-column-button]').click();
		cy.get('[data-cy=close-drawer-button]').click();

		cy.get('[data-cy=log-column-header]').eq(2).click();
		cy.get('[data-cy=column-name-input]').clear().type('col2');
		cy.get('[data-cy=column-formatter-input]').clear().type('return log => log.message.col2');
		cy.get('[data-cy=save-column-button]').click();
		cy.get('[data-cy=close-drawer-button]').click();

		cy.get('[data-cy=log-column-header]').asText('columnHeaders');
		cy.get('[data-cy=log-cell]').asText('cells');

		cy.get('[data-cy=drag-handle]').then((handles) => {
			dndElement(handles[2], handles[0]);
		});

		cy.get('@columnHeaders').then((columnHeaders) => {
			cy.get('[data-cy=log-column-header]').eq(0).should('have.text', columnHeaders[2]);
			cy.get('[data-cy=log-column-header]').eq(1).should('have.text', columnHeaders[0]);
			cy.get('[data-cy=log-column-header]').eq(2).should('have.text', columnHeaders[1]);
		});

		cy.get('@cells').then((cells) => {
			cy.get('[data-cy=log-cell]').eq(0).should('have.text', cells[2]);
			cy.get('[data-cy=log-cell]').eq(1).should('have.text', cells[0]);
			cy.get('[data-cy=log-cell]').eq(2).should('have.text', cells[1]);
		});

		cy.get('[data-cy=log-column-header]').eq(0).click();
		cy.get('[data-cy=delete-column-button]').click();
		cy.get('[data-cy=log-column-header]').should('have.length', 2);
		cy.get('[data-cy=log-cell]').should('have.length', 2);

		cy.get('@columnHeaders').then((columnHeaders) => {
			cy.get('[data-cy=log-column-header]').eq(0).should('have.text', columnHeaders[0]);
			cy.get('[data-cy=log-column-header]').eq(1).should('have.text', columnHeaders[1]);
		});

		cy.get('@cells').then((cells) => {
			cy.get('[data-cy=log-cell]').eq(0).should('have.text', cells[0]);
			cy.get('[data-cy=log-cell]').eq(1).should('have.text', cells[1]);
		});
	});
});
