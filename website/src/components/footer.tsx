import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const links = {
    navigate: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "/pricing" }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" }
  ];

  return (
    <footer className="bg-black/[0.02] border-t border-black/10 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
          {/* Brand */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <span className="text-white">A</span>
              </div>
              <span className="text-xl text-black">AntiTabs</span>
            </div>
            <p className="text-base text-black/50 mb-6 max-w-sm leading-relaxed">
              The new visual OS layer. Multiple windows. One infinite canvas. The end of tabs.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-black/5 hover:bg-black flex items-center justify-center transition-all duration-300 group"
                  >
                    <Icon className="w-4 h-4 text-black/70 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-black mb-4 text-sm uppercase tracking-wider">Navigate</h3>
            <ul className="space-y-3">
              {links.navigate.map((link, index) => (
                <li key={index}>
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className="text-black/50 hover:text-black transition-colors text-sm">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="text-black/50 hover:text-black transition-colors text-sm">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-black/40">
            <p>© 2025 AntiTabs. All rights reserved.</p>
            <p>The anti-tab browser.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
