module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended'
	],
	ignorePatterns: ['dist', '.eslintrc.cjs', '*.js'],
	parser: '@typescript-eslint/parser',
	plugins: ['react-refresh', '@stylistic'],
	rules: {
		'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
		'@typescript-eslint/no-explicit-any': 'off',
		semi: ['error', 'always'],
		'@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
		'@stylistic/comma-dangle': ['error', 'never'],
		'no-mixed-spaces-and-tabs': 'off',
		'@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs']
	}
};
