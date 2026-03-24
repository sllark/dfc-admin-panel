'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { clearAuthSession, isJwtExpired } from '@/app/lib/authSession'

const AuthGuard = ({ children }) => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    if (!token || role !== 'ADMIN') {
      router.replace('/')
      return
    }

    if (isJwtExpired(token)) {
      clearAuthSession()
      toast.error('Your session has expired. Please sign in again.')
      router.replace('/')
      return
    }

    setIsAuthenticated(true)
  }, [router])

  // While logged in, periodically re-check JWT exp so idle users are redirected without waiting for an API call
  useEffect(() => {
    if (!isAuthenticated) return
    const tick = () => {
      const token = localStorage.getItem('token')
      if (!token) return
      if (isJwtExpired(token)) {
        clearAuthSession()
        toast.error('Your session has expired. Please sign in again.')
        router.replace('/')
      }
    }
    const id = setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null // ⛔ Prevent render flicker

  return children
}

export default AuthGuard