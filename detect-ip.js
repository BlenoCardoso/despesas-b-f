import os from 'os';

function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          address: net.address,
          isWiFi: name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless'),
          isEthernet: name.toLowerCase().includes('ethernet'),
          isVirtual: net.address.startsWith('192.168.56.') || 
                    net.address.startsWith('172.') || 
                    net.address.startsWith('10.')
        });
      }
    }
  }
  
  return results;
}

const interfaces = getNetworkInterfaces();

console.log('\n🌐 IPs DETECTADOS:\n');

interfaces.forEach((iface, index) => {
  const icon = iface.isWiFi ? '📶' : iface.isEthernet ? '🔌' : '💻';
  const type = iface.isWiFi ? 'Wi-Fi' : iface.isEthernet ? 'Ethernet' : 'Virtual';
  const recommended = !iface.isVirtual && (iface.isWiFi || iface.isEthernet);
  
  console.log(`${icon} ${iface.address} (${type}${iface.isVirtual ? ' - Virtual' : ''})${recommended ? ' ⭐ RECOMENDADO' : ''}`);
});

console.log('\n🎯 PARA CELULAR, USE UM DOS IPs RECOMENDADOS (⭐)\n');

// Find the best IP for mobile access
const bestIP = interfaces.find(iface => !iface.isVirtual && iface.isWiFi) || 
              interfaces.find(iface => !iface.isVirtual && iface.isEthernet) ||
              interfaces.find(iface => !iface.isVirtual);

if (bestIP) {
  console.log(`📱 URL para celular: http://${bestIP.address}:5173/\n`);
  
  console.log('🔧 Para autorizar no Firebase:');
  console.log(`   1. Acesse: https://console.firebase.google.com/`);
  console.log(`   2. Authentication → Settings → Authorized domains`);
  console.log(`   3. Adicione: ${bestIP.address}`);
  console.log('');
} else {
  console.log('❌ Nenhum IP adequado encontrado\n');
}