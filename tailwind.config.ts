import config from './src/repo/ui/tailwind.config'

const tailwindConfig = {
  ...config,
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
}

export default tailwindConfig
