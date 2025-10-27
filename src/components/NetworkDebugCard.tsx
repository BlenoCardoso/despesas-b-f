import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Wifi, AlertTriangle, Smartphone } from 'lucide-react';

interface NetworkInfo {
  currentUrl: string;
  hostname: string;
  isLAN: boolean;
  isLocalhost: boolean;
  suggestedUrls: string[];
}

export function NetworkDebugCard() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const port = window.location.port || '5173';
    const protocol = window.location.protocol;
    const currentUrl = window.location.href;
    
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isLAN = hostname.match(/^192\.168\.|^10\.|^172\.16\./);
    
    // Sugerir URLs alternativas baseadas no IP atual
    const suggestedUrls = [];
    
    if (isLocalhost) {
      suggestedUrls.push('http://192.168.0.122:5173/');
      suggestedUrls.push('http://192.168.1.100:5173/');
    } else if (isLAN) {
      // Se já está em LAN, sugerir localhost para teste
      suggestedUrls.push('http://localhost:5173/');
    }
    
    setNetworkInfo({
      currentUrl,
      hostname,
      isLAN: !!isLAN,
      isLocalhost,
      suggestedUrls
    });
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (!networkInfo || (!import.meta.env.DEV && networkInfo.isLocalhost)) {
    return null;
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
          <Wifi className="w-4 h-4" />
          Informações de Rede
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">URL atual:</span>
            <div className="flex items-center gap-1">
              <code className="bg-white px-2 py-1 rounded text-blue-600">
                {networkInfo.hostname}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(networkInfo.currentUrl)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Tipo:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              networkInfo.isLocalhost 
                ? 'bg-green-100 text-green-700' 
                : networkInfo.isLAN 
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {networkInfo.isLocalhost ? 'Local' : networkInfo.isLAN ? 'LAN' : 'Externo'}
            </span>
          </div>
        </div>

        {networkInfo.isLAN && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs text-orange-700">
              <strong>Login Google via LAN:</strong> Adicione <code>{networkInfo.hostname}</code> 
              nos domínios autorizados do Firebase Console.
            </AlertDescription>
          </Alert>
        )}

        {networkInfo.suggestedUrls.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-gray-600">URLs sugeridas:</span>
            {networkInfo.suggestedUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between">
                <code className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                  {url}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(url)}
                  title="Copiar URL"
                >
                  {copied === url ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Smartphone className="w-3 h-3" />
          <span>Execute <code>pnpm detect-ip</code> para ver o melhor IP</span>
        </div>
      </CardContent>
    </Card>
  );
}