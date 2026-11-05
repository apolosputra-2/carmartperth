import {
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";

import Link from "next/link";

const quickLinks = [
  { label: "Browse Inventory", href: "/inventory" },
  { label: "Finance Application", href: "/finance/apply" },
  { label: "Sell Your Car", href: "/sell-your-car" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// TODO: Replace with Carmart Perth's verified social URLs.
const socialLinks = [
  { label: "Facebook", href: "", Icon: FaFacebookF },
  { label: "Instagram", href: "", Icon: FaInstagram },
  { label: "YouTube", href: "", Icon: FaYoutube },
  { label: "WhatsApp", href: "", Icon: FaWhatsapp },
];

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=707+Albany+Highway+East+Victoria+Park+WA+6101";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0b0f] px-6 pt-16 pb-8 text-white lg:pt-20">
      <div className="mx-auto w-full max-w-[1472px]">
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">

          {/* Column 1: Dealership */}
          <div>
            {/* TODO: Replace with actual Carmart logo image */}
            <div className="mb-5">
              <p className="font-['Montserrat'] text-[25px] italic tracking-[-0.05em] text-white">
                Carmart Perth
              </p>
              <div className="mt-3 h-[2px] w-48 bg-gradient-to-r from-[#f00085] via-cyan-400 to-transparent" />
              <p className="mt-2 text-[10px] italic text-gray-400">
                driving dreams delivering quality
              </p>
            </div>

            <p className="max-w-[320px] font-[Inter] text-[14px] leading-6 text-gray-400">
              We say yes when others say no. Perth&apos;s
              WA-owned, family-run used-car dealership
              straight-talking finance support without
              judgement.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                href ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] transition hover:border-cyan-400 hover:text-cyan-400"
                  >
                    <Icon size={19} />
                  </a>
                ) : (
                  <span
                    key={label}
                    title={`${label} link coming soon`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-gray-500"
                  >
                    <Icon size={19} />
                  </span>
                )
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="mb-6 font-[Inter] text-[19px] font-bold">
              Quick Links
            </h3>

            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-start gap-5"
            >
              {quickLinks.map((link) => (
                <Link
                    key={link.label}
                    href={link.href}
                    className="font-[Inter] text-[14px] text-gray-400 transition hover:text-cyan-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="mb-6 font-[Inter] text-[19px] font-bold">
              Contact
            </h3>

            <div className="space-y-5">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-[14px] leading-6 text-gray-400 transition hover:text-white"
              >
                <MapPin
                  size={19}
                  className="mt-1 shrink-0 text-[#f00085]"
                />
                <span>
                  707 Albany Hwy
                  <br />
                  East Victoria Park, WA 6101
                </span>
              </a>

              <a
                href="tel:+61892726814"
                className="flex items-center gap-3 text-[14px] text-gray-400 transition hover:text-white"
              >
                <Phone size={19} className="text-[#f00085]" />
                (08) 9272 6814
              </a>

              <a
                href="mailto:sales@carmartperth.com.au"
                className="flex items-center gap-3 break-all text-[14px] text-gray-400 transition hover:text-white"
              >
                <Mail size={19} className="shrink-0 text-[#f00085]" />
                sales@carmartperth.com.au
              </a>
            </div>
          </div>

          {/* Column 4: Location & Hours */}
          <div>
            <h3 className="mb-5 font-[Inter] text-[19px] font-bold">
              Location &amp; Office Hours
            </h3>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Find Carmart Perth on Google Maps"
              className="group block overflow-hidden rounded-lg border border-white/10 bg-[#16191e]"
            >
              <iframe
                title="Carmart Perth location map"
                src="https://maps.google.com/maps?q=707%20Albany%20Highway%20East%20Victoria%20Park%20WA%206101&t=&z=15&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[160px] w-full border-0 pointer-events-none"
              />
            </a>

            <div className="mt-4 space-y-1 font-[Inter] text-[14px] text-gray-400">
              <p>Mon – Fri 8:00 – 18:00</p>
              <p>Saturday 8:00 – 13:00</p>
              <p>Sunday Closed</p>
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-[13px] text-gray-400 transition hover:text-cyan-400"
            >
              View location
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Bottom legal bar */}
        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 font-mono text-[12px] text-gray-500">
            <p>© {new Date().getFullYear()} Carmart Perth. All rights reserved.</p>
            <p className="text-gray-300">
              Dealer Licence: MDL#30628
            </p>
          </div>

          <div className="flex flex-wrap gap-5 font-mono text-[12px] text-gray-500">
            <Link
              href="/privacy-policy"
              className="transition hover:text-cyan-400"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms-of-use"
              className="transition hover:text-cyan-400"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
