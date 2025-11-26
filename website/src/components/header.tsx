import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ProfileDropdown } from "./ProfileDropdown";
import { Link } from "react-router-dom";

export function Header() {
  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Proof", href: "#proof" },
    { label: "Download", href: "#download" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <span className="text-white">A</span>
            </div>
            <span className="text-lg text-black">AntiTabs</span>
          </Link>

          {/* Desktop Navigation - Pricing Link */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/pricing"
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button className="bg-black hover:bg-black/90 text-white rounded-full text-sm px-6 h-10">
              Download
            </Button>
            <ProfileDropdown />
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-white border-l border-black/10">
              <nav className="flex flex-col gap-6 mt-8">
                <Link
                  to="/pricing"
                  className="text-base text-black/60 hover:text-black transition-colors"
                >
                  Pricing
                </Link>
                {navLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-base text-black/60 hover:text-black transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Button className="bg-black hover:bg-black/90 text-white w-full mt-4 rounded-full">
                  Download
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
