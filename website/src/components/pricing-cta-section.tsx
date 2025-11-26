import { Button } from "./ui/button";
import { Download } from "lucide-react";

export function PricingCTASection() {
  const features = [
    "Unlimited windows in one canvas",
    "Complete situational awareness",
    "Zero context switching",
    "Mission control for your workflow",
    "10× faster operations",
    "Your browser's second brain"
  ];

  return (
    <section id="pricing" className="relative py-32 md:py-40 bg-white overflow-hidden">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-black/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full mb-8 backdrop-blur-sm">
              <span className="text-sm text-black/70">One tool that removes 50% of your switching time</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tight">
              Multiple windows.<br/>One infinite canvas.
            </h2>
            
            <p className="text-xl md:text-2xl text-black/50 leading-relaxed mb-12">
              Welcome to AntiTabs — the anti-tab browser
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-black"></div>
                <span className="text-base text-black/70">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
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

          <p className="text-sm text-black/40 text-center">
            multiple windows in one canvas
          </p>

          {/* Quote */}
          <div className="mt-20 text-center max-w-3xl mx-auto">
            <p className="text-2xl md:text-3xl text-black/70 mb-4 italic">
              "Finally: an antidote to Tab Hell."
            </p>
            <p className="text-base text-black/50">
              Once you use AntiTabs, you'll never go back.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}