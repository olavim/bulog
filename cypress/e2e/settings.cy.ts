describe('settings tests', () => {
	beforeEach(() => {
		cy.resetBulog();
	});

	it('change server settings', () => {
		cy.visit('/');
		cy.get('[data-cy=settings-button]').click();
		cy.get('[data-cy=settings-tab-server]').click();
		cy.get('[data-cy=server-defaults-hostname-input]').clear().type('localhost');
		cy.get('[data-cy=server-defaults-port-input]').clear().type('1234');
		cy.get('[data-cy=server-defaults-memorySize-input]').clear().type('1234');

		cy.intercept('PUT', '/api/config').as('configOut');
		cy.intercept('GET', '/api/config').as('configIn');

		cy.get('[data-cy=apply-changes-button]').click();
		cy.wait('@configOut').then((interception) => {
			const body = interception.request.body;

			expect(body.server.defaults.hostname).to.eq('localhost');
			expect(body.server.defaults.port).to.eq(1234);
			expect(body.server.defaults.memorySize).to.eq(1234);

			cy.wait('@configIn').its('response.body').should('deep.eq', body);
		});
	});

	it('change bucket settings', () => {
		cy.visit('/');
		cy.sendLogsToBulog([
			{ bucket: 'bucket-1', message: 1 },
			{ bucket: 'bucket-2', message: 2 }
		]);

		cy.get('[data-cy=bucket-tabs] [data-cy=tab]').should('have.length', 2);
		cy.get('[data-cy=settings-button]').click();

		for (let i = 0; i < 2; i++) {
			cy.get('[data-cy^=settings-tab-buckets]').eq(i).click();
			cy.get('[data-cy^=settings-tabpanel-buckets]').eq(i).as('panel');

			cy.get('@panel').find('[data-cy=config-column]').should('have.length', 2);
			cy.get('@panel').find('[data-cy=config-column]').eq(0).should('have.text', 'timestamp');
			cy.get('@panel').find('[data-cy=config-column]').eq(1).should('have.text', 'message');

			cy.get('@panel')
				.find('[data-cy=config-column] [data-cy=drag-handle]')
				.then((handles) => {
					cy.dnd(handles[0], handles[1]);
				});

			cy.get('@panel').find('[data-cy=config-column]').eq(0).as('col1');
			cy.get('@panel').find('[data-cy=config-column]').eq(1).as('col2');

			cy.get('@col1').should('have.text', 'message');
			cy.get('@col2').should('have.text', 'timestamp');

			cy.get('@col1').click();
			cy.get('@col1').find('[data-cy=column-name-input]').clear().type(`col1-${i}`);
			cy.get('@col1')
				.find('[data-cy=column-formatter-input]')
				.clear()
				.type('return log => log.message');

			cy.get('@col2').click();
			cy.get('@col2').find('[data-cy=column-name-input]').clear().type(`col2-${i}`);
			cy.get('@col2')
				.find('[data-cy=column-formatter-input]')
				.clear()
				.type('return log => log.timestamp');
		}

		cy.intercept('PUT', '/api/config').as('configOut');
		cy.intercept('GET', '/api/config').as('configIn');

		cy.get('[data-cy=apply-changes-button]').click();
		cy.wait('@configOut').then((interception) => {
			const body = interception.request.body;

			expect(body.buckets['bucket-1'].columns[0].name).to.eq('col1-0');
			expect(body.buckets['bucket-1'].columns[0].formatter).to.eq('return log => log.message');
			expect(body.buckets['bucket-1'].columns[1].name).to.eq('col2-0');
			expect(body.buckets['bucket-1'].columns[1].formatter).to.eq('return log => log.timestamp');
			expect(body.buckets['bucket-2'].columns[0].name).to.eq('col1-1');
			expect(body.buckets['bucket-2'].columns[0].formatter).to.eq('return log => log.message');
			expect(body.buckets['bucket-2'].columns[1].name).to.eq('col2-1');
			expect(body.buckets['bucket-2'].columns[1].formatter).to.eq('return log => log.timestamp');

			cy.wait('@configIn').its('response.body').should('deep.eq', body);
		});
	});

	it('change filter settings', () => {
		cy.visit('/');
		cy.get('[data-cy=settings-button]').click();
		cy.get('[data-cy=settings-add-filter-button]').click();
		cy.get('[data-cy=settings-add-filter-button]').click();

		for (let i = 0; i < 2; i++) {
			cy.get('[data-cy^=settings-tab-filters]').eq(i).click();
			cy.get('[data-cy^=settings-tabpanel-filters]').eq(i).as('panel');

			cy.get('@panel').find('[data-cy=config-column]').should('have.length', 2);
			cy.get('@panel').find('[data-cy=config-column]').eq(0).should('have.text', 'timestamp');
			cy.get('@panel').find('[data-cy=config-column]').eq(1).should('have.text', 'message');

			cy.get('@panel').find('[data-cy=filter-name-input]').clear().type(`filter-${i}`);
			cy.get('@panel').find('[data-cy=filter-predicate-input]').clear().type('return () => true');

			cy.get('@panel')
				.find('[data-cy=config-column] [data-cy=drag-handle]')
				.then((handles) => {
					cy.dnd(handles[0], handles[1]);
				});

			cy.get('@panel').find('[data-cy=config-column]').eq(0).as('col1');
			cy.get('@panel').find('[data-cy=config-column]').eq(1).as('col2');

			cy.get('@col1').should('have.text', 'message');
			cy.get('@col2').should('have.text', 'timestamp');

			cy.get('@col1').click();
			cy.get('@col1').find('[data-cy=column-name-input]').clear().type(`col1-${i}`);
			cy.get('@col1')
				.find('[data-cy=column-formatter-input]')
				.clear()
				.type('return log => log.message');

			cy.get('@col2').click();
			cy.get('@col2').find('[data-cy=column-name-input]').clear().type(`col2-${i}`);
			cy.get('@col2')
				.find('[data-cy=column-formatter-input]')
				.clear()
				.type('return log => log.timestamp');
		}

		cy.intercept('PUT', '/api/config').as('configOut');
		cy.intercept('GET', '/api/config').as('configIn');

		cy.get('[data-cy=apply-changes-button]').click();
		cy.wait('@configOut').then((interception) => {
			const body = interception.request.body;
			const keys = Object.keys(body.filters);
			const f1 = body.filters[keys.find((key) => body.filters[key].name === 'filter-0')!];
			const f2 = body.filters[keys.find((key) => body.filters[key].name === 'filter-1')!];

			expect(f1.name).to.eq('filter-0');
			expect(f1.filter).to.eq('return () => true');
			expect(f1.columns[0].name).to.eq('col1-0');
			expect(f1.columns[0].formatter).to.eq('return log => log.message');
			expect(f1.columns[1].name).to.eq('col2-0');
			expect(f1.columns[1].formatter).to.eq('return log => log.timestamp');

			expect(f2.name).to.eq('filter-1');
			expect(f2.filter).to.eq('return () => true');
			expect(f2.columns[0].name).to.eq('col1-1');
			expect(f2.columns[0].formatter).to.eq('return log => log.message');
			expect(f2.columns[1].name).to.eq('col2-1');
			expect(f2.columns[1].formatter).to.eq('return log => log.timestamp');

			cy.wait('@configIn').its('response.body').should('deep.eq', body);
		});
	});

	it.only('delete bucket', () => {
		cy.visit('/');
		cy.sendLogsToBulog([
			{ bucket: 'bucket-1', message: 1 },
			{ bucket: 'bucket-2', message: 2 },
			{ bucket: 'bucket-1', message: 3 },
			{ bucket: 'bucket-2', message: 4 }
		]);

		cy.get('[data-cy=bucket-tabs] [data-cy=tab]').should('have.length', 2);

		cy.get('[data-cy=settings-button]').click();
		cy.get('[data-cy=settings-add-filter-button]').click();
		cy.get('[data-cy^=settings-tab-filters]').click();
		cy.get('[data-cy=filter-name-input]').clear().type('filter-1');
		cy.get('[data-cy=filter-predicate-input]').clear().type('return () => true');

		cy.get('[data-cy=apply-changes-button]').click();
		cy.get('[data-cy=close-settings-button]').click();
		cy.get('[data-cy=filter-tabs] [data-cy=tab]').click();

		cy.get('[data-cy=log-cell]').should('have.length', 8);
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-cell]').eq(3).should('have.text', '2');
		cy.get('[data-cy=log-cell]').eq(5).should('have.text', '3');
		cy.get('[data-cy=log-cell]').eq(7).should('have.text', '4');

		cy.get('[data-cy=settings-button]').click();
		cy.get('[data-cy="settings-tab-buckets:bucket-2"]').click();
		cy.get('[data-cy="settings-tabpanel-buckets:bucket-2"]')
			.find('[data-cy=settings-delete-bucket-button]')
			.click();

		cy.get('[data-cy=apply-changes-button]').click();
		cy.get('[data-cy=close-settings-button]').click();
		cy.get('[data-cy=filter-tabs] [data-cy=tab]').click();

		cy.get('[data-cy=log-cell]').should('have.length', 4);
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-cell]').eq(3).should('have.text', '3');

		cy.visit('/');

		cy.get('[data-cy=bucket-tabs]').should('have.length', 1);
		cy.get('[data-cy=filter-tabs] [data-cy=tab]').click();

		cy.get('[data-cy=log-cell]').should('have.length', 4);
		cy.get('[data-cy=log-cell]').eq(1).should('have.text', '1');
		cy.get('[data-cy=log-cell]').eq(3).should('have.text', '3');
	});
});
