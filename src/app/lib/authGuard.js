'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const AuthGuard = ({ children }) => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    if (!token || role !== 'ADMIN') {
      router.replace('/') // 🔒 Redirect immediately
    } else {
      setIsAuthenticated(true)
    }
  }, [])

  if (!isAuthenticated) return null // ⛔ Prevent render flicker

  return children
}

export default AuthGuard