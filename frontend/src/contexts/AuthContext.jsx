import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const readUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readUser())
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    const onStorage = () => {
      setUser(readUser())
      setToken(localStorage.getItem('token'))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((nextToken, nextUser) => {
    if (nextToken) localStorage.setItem('token', nextToken)
    if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser))
    setToken(nextToken || null)
    setUser(nextUser || null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...(prev || {}), ...patch }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(() => ({ user, token, login, logout, updateUser }), [user, token, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
