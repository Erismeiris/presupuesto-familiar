import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.winfor.presupuestofamiliar',
  appName: 'Presupuesto Familiar',
  webDir: 'dist/presupuesto_familiar/browser',
  android: {
    allowMixedContent: false,
    captureInput: true
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp:    { enabled: true },
    CapacitorCookies: { enabled: true },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f6b5c',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
