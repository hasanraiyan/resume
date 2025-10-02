export default function Footer() {
    return (
      <footer className="py-12 border-t-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-3xl font-bold mb-6 md:mb-0 hover-target">JD</div>
            <div className="flex gap-8 mb-6 md:mb-0">
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target"
              >
                Dribbble
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target"
              >
                Behance
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target"
              >
                LinkedIn
              </a>
            </div>
            <div className="text-gray-600">
              &copy; 2024 John Doe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    )
  }