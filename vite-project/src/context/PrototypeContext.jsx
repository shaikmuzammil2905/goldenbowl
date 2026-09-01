import { createContext, useContext } from 'react'
import { usePrototypeStore } from '../hooks/usePrototypeStore'

const PrototypeContext = createContext(null)

export function PrototypeProvider({ children }) {
  const state = usePrototypeStore()
  return <PrototypeContext.Provider value={state}>{children}</PrototypeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrototypeContext() {
  const context = useContext(PrototypeContext)
  if (!context) throw new Error('usePrototypeContext must be used inside PrototypeProvider')
  return context
}
