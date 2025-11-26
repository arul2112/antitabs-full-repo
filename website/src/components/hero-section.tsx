import { Button } from "./ui/button";
import { Download } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white min-h-[80vh] flex items-center justify-center py-20">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4x2 mx-auto text-center">
          
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl tracking-tight text-black mb-6">
            The end of tabs.
          </h1>
          
          <h2 className="text-6xl md:text-7xl lg:text-8xl tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-8 font-bold pb-2">
            The beginning of everything.
          </h2>
          
          {/* Description */}
          <p className="text-xl md:text-2xl text-black/60 max-w-3xl mx-auto mb-12 leading-relaxed">
            A new visual OS layer that lets you operate 10× faster. Multiple windows in one infinite canvas. Your browser's evolution is here.
          </p>
          
          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-black/90 text-base px-8 h-12 rounded-full min-w-[200px] transition-all duration-300 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Download for Mac
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-black/20 text-black hover:bg-black/5 text-base px-8 h-12 rounded-full min-w-[200px] transition-all duration-300 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Download for Windows
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}