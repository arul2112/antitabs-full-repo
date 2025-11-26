import { Badge } from "./ui/badge";
import laptopScreen from "figma:asset/b5e2ae83955be7d36014e6ee1a6201b97f3c51a0.png";
import antiTabsInterface from "figma:asset/e9c4ee9164e511910d956eadf6ac81e4c37bce5c.png";

export function FeaturesShowcase() {
  const features = [
    {
      badge: "TRADERS",
      title: "See markets like a hawk",
      description: "Monitor 20 charts at once. Track multiple exchanges, news feeds, and portfolios simultaneously. Complete market visibility. No more tab-switching between positions.",
      stat: "20+",
      statLabel: "Charts at once"
    },
    {
      badge: "DEVELOPERS",
      title: "Run logs, docs, code, terminals together",
      description: "No more tab hell. Keep your IDE, documentation, Stack Overflow, terminal output, and localhost all visible at once. Debug faster. Code faster. Ship faster.",
      stat: "10×",
      statLabel: "Faster debugging"
    },
    {
      badge: "DESIGNERS",
      title: "Moodboards, references, live apps",
      description: "All open, all visible. Compare designs side-by-side. Reference inspiration while you create. Your creative flow stays unbroken.",
      stat: "Zero",
      statLabel: "Context switching"
    }
  ];

  return (
    <section id="features" className="relative py-32 md:py-40 bg-black/[0.02] overflow-hidden">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tight">
            Work like a broadcast director
          </h2>
          <p className="text-xl md:text-2xl text-black/50 leading-relaxed">
            Everything, everywhere, always.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-32">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <Badge className="bg-black/5 text-black/70 hover:bg-black/10 mb-6 text-xs uppercase tracking-widest border-0">
                  {feature.badge}
                </Badge>
                <h3 className="text-4xl md:text-5xl text-black mb-6 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-lg md:text-xl text-black/50 leading-relaxed mb-8">
                  {feature.description}
                </p>
                <div className="inline-flex items-baseline gap-3 px-6 py-4 bg-black/5 rounded-2xl">
                  <span className="text-4xl text-black">{feature.stat}</span>
                  <span className="text-sm text-black/50 uppercase tracking-wider">{feature.statLabel}</span>
                </div>
              </div>
              
              <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-black/5 to-black/10 overflow-hidden">
                  {/* Abstract representation instead of image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-white/50 rounded-2xl shadow-2xl backdrop-blur-sm relative overflow-hidden">
                      {/* Laptop mockup container */}
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        {/* Laptop frame */}
                        <div className="w-full h-full flex flex-col gap-0.5">
                          {/* Screen */}
                          <div className="flex-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg p-1.5 relative shadow-2xl">
                            {/* Screen bezel */}
                            <div className="w-full h-full bg-black rounded-md overflow-hidden border-[3px] border-gray-900 relative">
                              {/* AntiTabs interface image */}
                              <img 
                                src={index === 0 ? antiTabsInterface : laptopScreen} 
                                alt="AntiTabs Interface"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {/* Camera notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-950 rounded-b z-20"></div>
                          </div>
                          {/* Base/Keyboard - reduced height */}
                          <div className="h-4 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-b-lg relative shadow-lg">
                            {/* Trackpad hint */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-2 bg-gray-500/20 rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-8 left-8 w-1/3 h-1/4 bg-white/30 rounded-xl backdrop-blur-sm"></div>
                  <div className="absolute bottom-8 right-8 w-1/3 h-1/4 bg-white/30 rounded-xl backdrop-blur-sm"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}