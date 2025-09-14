import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bleno.despesas',
  appName: 'despesas-app',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '958999401996-e6erq73qrbdqkf41hh5paes022jcbd7r.apps.googleusercontent.com', // Do google-services.json
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
