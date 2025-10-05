'use client'

import { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import BlogCard from './BlogCard'
import BlogFilters from './BlogFilters'

export default function BlogPageClient({ articles }) {
  const [filteredArticles, setFilteredArticles] = useState(articles)
  const [isLoading, setIsLoading] = useState(false)

  // Cleanup on component mount to ensure fresh state
  useEffect(() => {
    // Kill any existing ScrollTriggers from other pages
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    ScrollTrigger.refresh()
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Clean up previous ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const grid = document.querySelector('.articles-grid')
      if (grid && grid.children.length > 0) {
        // Reset any existing transforms
        gsap.set(grid.children, { opacity: 1, y: 0 })

        gsap.from(grid.children, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: grid,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
            refreshPriority: -1,
          },
        })
      }

      // Refresh ScrollTrigger to recalculate positions
      ScrollTrigger.refresh()
    }, 100)

    return () => {
      clearTimeout(timer)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [filteredArticles])

  const handleFilterChange = (tag) => {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = articles
      if (tag && tag !== 'all') {
        filtered = articles.filter(article =>
          article.tags?.some(articleTag =>
            articleTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      }
      setFilteredArticles(filtered)
      setIsLoading(false)
    }, 300)
  }

  const handleSearch = (query) => {
    setIsLoading(true)
    setTimeout(() => {
      if (query.trim() === '') {
        setFilteredArticles(articles)
      } else {
        const searchTerm = query.toLowerCase()
        const results = articles.filter(article =>
          article.title.toLowerCase().includes(searchTerm) ||
          article.excerpt.toLowerCase().includes(searchTerm) ||
          article.content.toLowerCase().includes(searchTerm) ||
          article.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        )
        setFilteredArticles(results)
      }
      setIsLoading(false)
    }, 300)
  }

  return (
    <>
      {/* Filters */}
      <BlogFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Articles Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20">
          <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">No articles found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {/* Articles Grid */}
          <div
            key={filteredArticles.length}
            className="articles-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12"
          >
            {filteredArticles.map((article) => (
              <BlogCard key={article._id} article={article} />
            ))}
          </div>

          {/* Article Count */}
          <div className="text-center mt-12 sm:mt-16 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredArticles.length}</span> of <span className="font-semibold">{articles.length}</span> articles
          </div>
        </>
      )}
    </>
  )
}
