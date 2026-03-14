'use client'

import { SessionProvider } from 'next-auth/react'
import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'

// Toast Context
interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
})

export const useToast = () => useContext(ToastContext)

// Cart Count Context
interface CartContextType {
  cartCount: number
  setCartCount: (n: number) => void
  refreshCart: () => void
}

export const CartContext = createContext<CartContextType>({
  cartCount: 0,
  setCartCount: () => {},
  refreshCart: () => {},
})

export const useCart = () => useContext(CartContext)

export function Providers({
  children,
  initialCartCount = 0,
}: {
  children: ReactNode
  initialCartCount?: number
}) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [cartCount, setCartCount] = useState(initialCartCount)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart/count')
      if (res.ok) {
        const data = await res.json()
        setCartCount(data.count)
      }
    } catch {}
  }, [])

  const originalTitle = useRef<string>('')
  useEffect(() => {
    originalTitle.current = document.title
    const handleVisibility = () => {
      if (document.hidden && cartCount > 0) {
        document.title = '🛒 Siparişinizi tamamlayın!'
      } else {
        document.title = originalTitle.current
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [cartCount])

  return (
    <SessionProvider>
      <ToastContext.Provider value={{ toasts, addToast }}>
        <CartContext.Provider value={{ cartCount, setCartCount, refreshCart }}>
          {children}
          {/* Toast bildirimleri */}
          <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
            {toasts.map(toast => (
              <div
                key={toast.id}
                className={`toast-enter flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs
                  ${toast.type === 'success' ? 'bg-primary-600' : 'bg-red-600'}`}
              >
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {toast.message}
              </div>
            ))}
          </div>
        </CartContext.Provider>
      </ToastContext.Provider>
    </SessionProvider>
  )
}
