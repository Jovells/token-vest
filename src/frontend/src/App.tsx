import { useState } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import {  useTheme } from './components/theme-provider'
import { TokenProvider } from './contexts/token-context'
import { Layout } from './components/layout'
import { Dashboard } from './pages/dashboard'
import { Admin } from './pages/admin'
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { darkTheme } from '@rainbow-me/rainbowkit'

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard')
  const { theme } = useTheme()

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
      <RainbowKitProvider theme={theme === 'dark' ? darkTheme() : lightTheme()}>
      <TokenProvider>
        <Layout 
          currentView={currentView} 
          onViewChange={setCurrentView}
        >
          <div className="p-6 lg:p-8 min-h-screen">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentView()}
            </motion.div>
          </div>
        </Layout>
        <Toaster richColors position="top-right" />
      </TokenProvider>
      </RainbowKitProvider>
  )
}

export default App 