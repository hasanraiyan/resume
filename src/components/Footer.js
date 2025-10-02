import Link from 'next/link'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const footerData = {
  logo: {
    text: "JD",
    link: "/"
  },
  
  socialLinks: [
    {
      id: 1,
      name: "Dribbble",
      url: "https://dribbble.com/yourusername",
      label: "Dribbble",
      icon: "fab fa-dribbble"
    },
    {
      id: 2,
      name: "Behance",
      url: "https://behance.net/yourusername",
      label: "Behance",
      icon: "fab fa-behance"
    },
    {
      id: 3,
      name: "Instagram",
      url: "https://instagram.com/yourusername",
      label: "Instagram",
      icon: "fab fa-instagram"
    },
    {
      id: 4,
      name: "LinkedIn",
      url: "https://linkedin.com/in/yourusername",
      label: "LinkedIn",
      icon: "fab fa-linkedin"
    }
  ],
  
  copyright: {
    year: new Date().getFullYear(),
    name: "John Doe",
    text: "All rights reserved"
  }
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Footer() {
  return (
    <footer className="py-8 sm:py-10 border-t-2 border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo */}
          <Link 
            href={footerData.logo.link}
            className="text-xl sm:text-2xl font-bold hover-target"
          >
            {footerData.logo.text}
          </Link>
          
          {/* Social Links */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-7">
            {footerData.socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
                aria-label={social.name}
              >
                {social.label}
              </a>
            ))}
          </div>
          
          {/* Copyright */}
          <div className="text-gray-600 text-xs sm:text-sm text-center md:text-right">
            &copy; {footerData.copyright.year} {footerData.copyright.name}. {footerData.copyright.text}.
          </div>
          
        </div>
      </div>
    </footer>
  )
}