import Link from "next/link";
import { Stethoscope, MessageCircle, Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "About RMDC", href: "/about" },
    { label: "Pricing Plans", href: "/pricing" },
    { label: "Free Trial", href: "/free-trial" },
    { label: "Video Tutorials", href: "/tutorials" },
  ],
  Support: [
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact" },
    { label: "WhatsApp Chat", href: "https://wa.me/250700000000", external: true },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

const contactDetails = [
  { icon: Mail, text: "support@rmdcprep.rw" },
  { icon: Phone, text: "+250 700 000 000" },
  { icon: MapPin, text: "Kigali, Rwanda" },
];

const socialLinks = [
  { label: "Facebook", initial: "f", href: "#" },
  { label: "Twitter", initial: "X", href: "#" },
  { label: "LinkedIn", initial: "in", href: "#" },
  { label: "YouTube", initial: "YT", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Top accent bar — Rwanda flag colors */}
      <div className="h-1 flex">
        <div className="flex-1 bg-sky-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-10 mb-14">

          {/* Brand col — spans 2 on xl */}
          <div className="xl:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                RMDC <span className="text-indigo-400">Prep</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-gray-400 mb-6 max-w-sm">
              Rwanda's leading medical and dental licensing exam preparation platform. Built by healthcare professionals, for future healthcare heroes.
            </p>

            {/* Contact info */}
            <div className="space-y-2 mb-7">
              {contactDetails.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map(({ label, initial, href }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 border border-gray-700 hover:border-indigo-500 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white transition-all duration-200"
                >
                  {initial}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white text-sm font-semibold mb-4 tracking-wide">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} RMDC Exam Prep. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-700">·</span>
            <span className="hidden sm:inline">Kigali, Rwanda 🇷🇼</span>
          </div>
          <a
            href="https://wa.me/250700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-green-900/30"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
