"use client";
import { useState } from "react";

const WA_NUMBER = "250795050123";
const WA_URL    = `https://wa.me/${WA_NUMBER}`;

export function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 group"
    >
      {/* Tooltip */}
      <span
        className={`
          whitespace-nowrap text-sm font-medium text-white bg-gray-900/90
          px-3 py-1.5 rounded-lg shadow-lg transition-all duration-200
          ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
        `}
      >
        Chat with us
      </span>

      {/* Button */}
      <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-green-500/40 hover:shadow-green-500/60 hover:scale-110 transition-all duration-200">
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />

        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 relative z-10"
          fill="white"
        >
          <path d="M16.002 2C8.28 2 2 8.28 2 16a13.94 13.94 0 0 0 1.898 7.07L2 30l7.18-1.87A13.97 13.97 0 0 0 16.002 30C23.72 30 30 23.72 30 16S23.72 2 16.002 2zm0 25.5a11.47 11.47 0 0 1-5.852-1.607l-.42-.25-4.26 1.11 1.132-4.14-.275-.435A11.47 11.47 0 0 1 4.5 16c0-6.351 5.151-11.5 11.502-11.5S27.5 9.649 27.5 16 22.353 27.5 16.002 27.5zm6.3-8.607c-.345-.173-2.042-1.006-2.358-1.12-.317-.116-.547-.173-.778.173-.23.346-.893 1.12-1.095 1.352-.2.23-.4.26-.745.087-.345-.174-1.455-.537-2.772-1.71-1.024-.914-1.715-2.043-1.916-2.388-.2-.346-.021-.532.15-.705.155-.154.345-.402.518-.604.172-.2.23-.345.345-.576.116-.23.058-.432-.029-.604-.087-.173-.778-1.873-1.066-2.564-.28-.674-.567-.582-.778-.593l-.662-.012c-.23 0-.604.086-.92.432-.317.346-1.21 1.18-1.21 2.877 0 1.696 1.239 3.334 1.41 3.564.173.23 2.44 3.724 5.913 5.222.827.356 1.472.57 1.975.73.83.264 1.585.226 2.182.137.665-.1 2.042-.834 2.33-1.638.288-.805.288-1.495.201-1.638-.086-.144-.317-.23-.662-.404z" />
        </svg>
      </div>
    </a>
  );
}
