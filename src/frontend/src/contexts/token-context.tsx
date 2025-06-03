import { createContext, useContext, useState, ReactNode } from 'react'

// Import contracts to get VEST token address
const VEST_TOKEN_ADDRESS = import.meta.env.VITE_VESTED_TOKEN_ADDRESS as string || ''

interface TokenContextType {
  selectedToken: string
  setSelectedToken: (token: string) => void
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

interface TokenProviderProps {
  children: ReactNode
}

export function TokenProvider({ children }: TokenProviderProps) {
  const [selectedToken, setSelectedToken] = useState(VEST_TOKEN_ADDRESS)

  return (
    <TokenContext.Provider value={{ selectedToken, setSelectedToken }}>
      {children}
    </TokenContext.Provider>
  )
}

export function useTokenContext() {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider')
  }
  return context
} 