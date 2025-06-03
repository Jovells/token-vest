import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import App from './App';
import './index.css';
import '@rainbow-me/rainbowkit/styles.css';
import { ThemeProvider } from './components/theme-provider';

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vesting-ui-theme">

    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
          <App />
      </QueryClientProvider>
    </WagmiProvider>
    </ThemeProvider>
  </React.StrictMode>
); 