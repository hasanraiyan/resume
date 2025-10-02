import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl sm:text-8xl font-bold mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Project Not Found</h2>
        <p className="text-gray-600 mb-8">
          The project you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/projects" variant="primary">
            Browse All Projects
          </Button>
          <Button href="/" variant="secondary">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}