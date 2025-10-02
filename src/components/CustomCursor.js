'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'

export default function CustomCursor() {
  useEffect(() => {
    const cursor = document.querySelector('.cursor')
    const cursorFollower = document.querySelector('.cursor-follower')
    const hoverTargets = document.querySelectorAll('.hover-target')

    if (!cursor || !cursorFollower) return

    gsap.set(cursor, { xPercent: -50, yPercent: -50 })
    gsap.set(cursorFollower, { xPercent: -50, yPercent: -50 })

    const handleMouseMove = (e) => {
      gsap.to(cursor, { duration: 0.2, x: e.clientX, y: e.clientY })
      gsap.to(cursorFollower, { duration: 0.6, x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)

    hoverTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        cursor.classList.add('hover')
      })
      target.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover')
      })
    })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <>
      <div className="cursor"></div>
      <div className="cursor-follower"></div>
    </>
  )
}