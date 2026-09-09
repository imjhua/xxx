import { OFF } from '@/repo/eslint-config/base'
import { config } from '@/repo/eslint-config/react-internal'

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      'no-console': OFF
    }
  }
]
