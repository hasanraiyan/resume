'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CustomCursor from '@/components/CustomCursor'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import About from '@/components/About'
import Work from '@/components/Work'
import Stats from '@/components/Stats'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  // Cleanup ScrollTriggers on component mount for fresh state
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    
    // Kill any existing ScrollTriggers from other pages
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    ScrollTrigger.refresh()
    
    // Cleanup on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <>
      <CustomCursor />
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Work />
      <Stats />
      <Contact />
      <Footer />
    </>
  )
}