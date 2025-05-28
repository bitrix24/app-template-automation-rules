import unjs from 'eslint-config-unjs'

export default unjs({
	rules: {
    'unicorn/no-process-exit': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/prefer-global-this': 'off',
		'unicorn/switch-case-braces': 'off',
		'no-prototype-builtins': 'off',
		'unicorn/prefer-ternary': 'off',
		'unicorn/no-typeof-undefined': 'off',
		'unicorn/no-zero-fractions': 'off',
		'unicorn/no-null': 'off',
		'no-null': 'off',
		'unicorn/no-useless-promise-resolve-reject': 'off',
		'unicorn/numeric-separators-style': [
			'error',
			{
				'onlyIfContainsSeparator': true,
				'number': {
					'minimumDigits': 0,
					'groupLength': 3
				}
			}
		]
	},
  ignores: [
    'generated/*'
  ],
	markdown: {
		rules: {
			// markdown rule overrides
		}
	}
});
