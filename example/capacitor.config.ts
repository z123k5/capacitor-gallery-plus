import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'example',
  webDir: 'www',
  server: {
    // url: 'http://192.168.178.39:8100',
    cleartext: true
  }
};

export default config;
