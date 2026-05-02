import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alphaDesk.app',
  appName: 'AlphaDesk',
  webDir: 'out',
  server: {
    url: 'https://trading-app-rr9b.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
