import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Coins, 
  Settings, 
  BarChart3, 
  Menu, 
  X,  
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  currentView: 'dashboard' | 'admin'
  onViewChange: (view: 'dashboard' | 'admin') => void
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      icon: BarChart3,
      key: 'dashboard' as const,
      description: 'Demo token vesting & claims'
    },
    {
      name: 'Admin Panel',
      icon: Settings,
      key: 'admin' as const,
      description: 'Create KRNL-powered schedules'
    }
  ]


  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black">
      {/* Clean Top Navbar - Higher z-index */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-950 rounded-lg flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-lg text-gray-900 dark:text-white">TokenVest</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">KRNL Demo Platform</div>
              </div>
            </div>
          </div>

          {/* Right: Network + Theme + Wallet */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* RainbowKit Connect Button */}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Clean Sidebar - Lower z-index than navbar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col pt-16">
          {/* Mobile close button */}
          <div className="flex justify-end p-6 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Clean Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.key
              
              return (
                <motion.button
                  key={item.key}
                  onClick={() => {
                    onViewChange(item.key)
                    setIsSidebarOpen(false)
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-primary-foreground/80" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </nav>

          {/* Clean Demo Platform Info */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">KRNL Demo Platform</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Experience secure, kernel-verified token distribution powered by KRNL's architecture.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Reduced left padding */}
      <main className="flex-1 lg:pl-18 pt-16">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
} 