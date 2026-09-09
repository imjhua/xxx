import { OFF } from '@/repo/eslint-config/base'
import { config } from '@/repo/eslint-config/react-internal'

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      '@stylistic/operator-linebreak': OFF,
      'react/prop-types': OFF,
      'react/no-unknown-property': OFF,
      '@stylistic/keyword-spacing': OFF,
      '@stylistic/space-before-blocks': OFF
    }
  }
]
