import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

/* SEE: https://tailwindcss.com/docs/theme#theme-variable-namespaces */
const TWEB_VARIABLES = {
  colors: {
    /* ============= tweb 컬러 - TUI 디자인 시스템 ============= */
    'tweb-neutral1': 'var(--tweb-neutral1)',
    'tweb-neutral2': 'var(--tweb-neutral2)',
    'tweb-neutral3': 'var(--tweb-neutral3)',
    'tweb-neutral4': 'var(--tweb-neutral4)',
    'tweb-neutral5': 'var(--tweb-neutral5)',
    'tweb-neutral6': 'var(--tweb-neutral6)',
    'tweb-gray-n6': 'var(--tweb-gray-n6)',
    'tweb-black': 'var(--tweb-black)',
    'tweb-white': 'var(--tweb-white)',
    'tweb-white2': 'var(--tweb-white2)',
    'tweb-white3': 'var(--tweb-white3)',
    'tweb-white6': 'var(--tweb-white6)',
    'tweb-primary1': 'var(--tweb-primary1)',
    'tweb-primary4': 'var(--tweb-primary4)',
    'tweb-primary5': 'var(--tweb-primary5)',
    'tweb-primary6': 'var(--tweb-primary6)',
    'tweb-primary7': 'var(--tweb-primary7)',
    'tweb-bg': 'var(--tweb-bg)',
    'tweb-bg2': 'var(--tweb-bg2)',
    /* 컬러 - Floating */
    'tweb-message': 'var(--tweb-message)',
    'tweb-alert-red': 'var(--tweb-alert-red)',
    'tweb-toast': 'var(--tweb-toast)'
  },
  fontSize: {
    display: 'var(--tweb-typo-display)',
    title1: 'var(--tweb-typo-title1)',
    title2: 'var(--tweb-typo-title2)',
    headline: 'var(--tweb-typo-headline)',
    body1: 'var(--tweb-typo-body1)',
    body2: 'var(--tweb-typo-body2)',
    caption1: 'var(--tweb-typo-caption1)',
    caption2: 'var(--tweb-typo-caption2)'
  },
  fontWeight: {
    regular: 'var(--tweb-typo-regular)',
    medium: 'var(--tweb-typo-medium)',
    bold: 'var(--tweb-typo-bold)'
  },
  height: {
    'xsmall': 'var(--tweb-btn-xsmall)',
    'small': 'var(--tweb-btn-small)',
    'medium': 'var(--tweb-btn-medium)',
    'large': 'var(--tweb-btn-large)',
    'xlarge': 'var(--tweb-btn-xlarge)'
  }
}

export default {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      boxShadow: {},
      colors: {
        /* 기본 색상 정의 */
        skeleton: 'hsl(var(--skeleton))',
        'skeleton-foreground': 'hsl(var(--skeleton-foreground))',

        /* tweb 정의 */
        background: 'var(--tweb-white)',
        foreground: 'var(--tweb-neutral1)',
        primary: {
          DEFAULT: 'var(--tweb-neutral1)',
          foreground: 'var(--tweb-white)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'var(--tweb-bg2)',
          foreground: 'var(--tweb-neutral2)'
        },
        accent: {
          DEFAULT: 'var(--tweb-bg)',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'var(--tweb-primary5)',
          foreground: 'var(--tweb-white)'
        },
        popover: {
          DEFAULT: 'var(--tweb-white)',
          foreground: 'var(--tweb-neutral1)'
        },
        border: 'var(--tweb-neutral5)',
        input: 'var(--tweb-neutral5)',
        ring: 'var(--tweb-primary1)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)'
        },
        sidebar: {
          DEFAULT: 'var(--tweb-neutral1)',
          foreground: 'var(--tweb-white)',
          primary: 'var(--tweb-primary4)',
          'primary-foreground': 'var(--tweb-neutral1)',
          accent: 'var(--tweb-primary4)',
          'accent-foreground': 'var(--tweb-neutral1)',
          border: 'var(--tweb-white6)',
          ring: 'var(--tweb-primary1)',
          hover: {
            DEFAULT: 'var(--tweb-white6)',
            foreground: 'var(--tweb-white)'
          }
        },

        // 상태 커스텀 색상
        /* 기본 */
        'default': '#262d39',
        'default2': '#fff',
        /* 정상 */
        'normal': '#E4F7E9',
        'normal2': '#099830',
        /* 비정상 */
        'abnormal': '#FEEEEE',
        'abnormal2': '#D12020',
        /* 배차 후 취소 */
        'cancel': '#262D3914',
        'cancel2': '#262D39B8',
        /* 운행중 */
        'driving': '#EFF5FF',
        'driving2': '#066AEB',
        /* 탑승대기 */
        'waiting': '#EFF5FF',
        'waiting2': '#066AEB',
        /* 운행완료 */
        'completed': '#E4F7E9',
        'completed2': '#099830',
        /* 승객 신고로 중단 */
        'passenger-stop': '#FEEEEE',
        'passenger-stop2': '#D12020',
        /* 기사 신고로 중단 */
        'driver-stop': '#FEEEEE',
        'driver-stop2': '#D12020',

        /* T 컬러 */
        ...TWEB_VARIABLES.colors
      },
      fontSize: { ...TWEB_VARIABLES.fontSize },
      fontWeight: { ...TWEB_VARIABLES.fontWeight },
      height: { ...TWEB_VARIABLES.height }
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config
