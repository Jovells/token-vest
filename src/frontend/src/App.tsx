import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { config } from './config/wagmi'
import { ThemeProvider } from './components/theme-provider'
import { TokenProvider } from './contexts/token-context'
import { Layout } from './components/layout'
import { Dashboard } from './pages/dashboard'
import { Admin } from './pages/admin'

const queryClient = new QueryClient()

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'admin':
        return <Admin />
      default:
        return <Dashboard />
    }
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vesting-ui-theme">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <TokenProvider>
            <Layout 
              currentView={currentView} 
              onViewChange={setCurrentView}
            >
              {renderCurrentView()}
            </Layout>
            <Toaster richColors position="top-right" />
          </TokenProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}

export default App 