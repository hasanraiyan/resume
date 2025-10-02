export default function Footer() {
    return (
      <footer className="py-8 sm:py-10 border-t-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xl sm:text-2xl font-bold hover-target">JD</div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-7">
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
            <div className="text-gray-600 text-xs sm:text-sm text-center md:text-right">
              &copy; 2024 John Doe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    )
  } 