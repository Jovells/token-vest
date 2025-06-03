import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Coins, 
  Wallet, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  ExternalLink,
  AlertTriangle,
  Heart
} from 'lucide-react'
import { useAccount, useConnectors } from 'wagmi'
import { sepolia, baseSepolia } from 'viem/chains'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatAddress } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  currentView: 'dashboard' | 'admin'
  onViewChange: (view: 'dashboard' | 'admin') => void
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { address, isConnected, chainId } = useAccount()
  const connectors = useConnectors()
  
  const connector = connectors.find((connector) => connector.name.toLowerCase().includes('metamask')) || connectors[0]
  
  const isSepolia = chainId === sepolia.id
  const isBaseSepolia = chainId === baseSepolia.id
  const isSupportedNetwork = isSepolia || isBaseSepolia

  const navigation = [
    {
      name: 'Dashboard',
      icon: BarChart3,
      key: 'dashboard' as const,
      description: 'Demo KRNL token vesting & claims'
    },
    {
      name: 'Admin Panel',
      icon: Settings,
      key: 'admin' as const,
      description: 'Create KRNL-powered schedules'
    }
  ]

  const getNetworkInfo = () => {
    if (!isSupportedNetwork) {
      return {
        name: 'Unsupported',
        color: 'destructive' as const,
        icon: AlertTriangle
      }
    }
    if (isBaseSepolia) {
      return {
        name: 'Base Sepolia',
        color: 'default' as const,
        icon: ExternalLink
      }
    }
    if (isSepolia) {
      return {
        name: 'Sepolia',
        color: 'secondary' as const,
        icon: ExternalLink
      }
    }
    return {
      name: 'Unknown',
      color: 'outline' as const,
      icon: AlertTriangle
    }
  }

  const networkInfo = getNetworkInfo()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always visible on desktop */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white dark:lg:bg-gray-800 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:shadow-sm">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#001efe] rounded-xl flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900 dark:text-white">TokenVest</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">KRNL Demo Platform</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.key
              
              return (
                <motion.button
                  key={item.key}
                  onClick={() => onViewChange(item.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#001efe] text-white shadow-lg shadow-[#001efe]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </nav>

          {/* Network & Wallet Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 pb-24 space-y-4">
            {/* Demo Platform Info */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-[#001efe] rounded-lg flex items-center justify-center">
                  <Coins className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">KRNL Demo Platform</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                This platform demonstrates KRNL kernel integration for token vesting and claiming. 
                Experience secure, decentralized token distribution powered by KRNL's kernel architecture.
              </p>
            </div>

            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network</span>
              <Badge variant={networkInfo.color} className="text-xs">
                <networkInfo.icon className="mr-1 h-3 w-3" />
                {networkInfo.name}
              </Badge>
            </div>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{formatAddress(address!)}</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => connector?.connect()}
                className="w-full bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl py-2.5"
                size="sm"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : "-100%"
        }}
        className="fixed left-0 top-0 z-50 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl lg:hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#001efe] rounded-xl flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900 dark:text-white">TokenVest</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">KRNL Demo Platform</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.key
              
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onViewChange(item.key)
                    setIsSidebarOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#001efe] text-white shadow-lg shadow-[#001efe]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Network & Wallet Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 pb-24 space-y-4">
            {/* Demo Platform Info */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-[#001efe] rounded-lg flex items-center justify-center">
                  <Coins className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">KRNL Demo Platform</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                This platform demonstrates KRNL kernel integration for token vesting and claiming. 
                Experience secure, decentralized token distribution powered by KRNL's kernel architecture.
              </p>
            </div>

            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network</span>
              <Badge variant={networkInfo.color} className="text-xs">
                <networkInfo.icon className="mr-1 h-3 w-3" />
                {networkInfo.name}
              </Badge>
            </div>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{formatAddress(address!)}</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => connector?.connect()}
                className="w-full bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl py-2.5"
                size="sm"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-72 pb-20">
        {/* Top bar - Airbnb style */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-20 items-center justify-between px-6 lg:px-8">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{currentView}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {currentView === 'dashboard' && 'Experience KRNL-powered token vesting and claims'}
                  {currentView === 'admin' && 'Create vesting schedules with KRNL kernel integration'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {!isSupportedNetwork && (
                <Badge variant="destructive" className="animate-pulse hidden sm:flex">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Unsupported Network
                </Badge>
              )}
              
              {!isConnected && (
                <Button
                  onClick={() => connector?.connect()}
                  className="bg-[#001efe] hover:bg-[#001efe]/90 text-white rounded-xl hidden sm:flex"
                  size="sm"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8 min-h-[calc(100vh-5rem)]">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Sticky Credits Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-between px-6 py-3 lg:pl-78">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">KRNL Demo Platform • Built with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span className="text-sm text-gray-600 dark:text-gray-400">by</span>
            <a 
              href="https://linktr.ee/jovells" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#001efe] hover:text-[#001efe]/80 transition-colors duration-200"
            >
              Jovells
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Powered by</span>
            <a 
              href="https://krnl.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-[#001efe] transition-colors duration-200"
            >
             <img src="/krnl-logo.png" alt="KRNL" width={20} height={20} />
              <span>KRNL</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 