export default function Footer() {
    return (
      <footer className="py-10 border-t-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold mb-5 md:mb-0 hover-target">JD</div>
            <div className="flex gap-7 mb-5 md:mb-0">
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
              >
                Dribbble
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
              >
                Behance
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
              >
                LinkedIn
              </a>
            </div>
            <div className="text-gray-600 text-sm">
              &copy; 2024 John Doe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    )
  }