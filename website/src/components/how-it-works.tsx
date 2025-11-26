import { MousePointerClick, Layers, Zap } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: MousePointerClick,
      step: "01",
      title: "Click, switch, forget",
      description: "Context switching every 30 seconds. Mental fatigue. Lost momentum. The old way of working."
    },
    {
      icon: Layers,
      step: "02",
      title: "See everything at once",
      description: "Code, design, documentation, and outputs all visible simultaneously. No more searching."
    },
    {
      icon: Zap,
      step: "03",
      title: "Stay in flow",
      description: "Your work becomes 3× faster instantly. Once you experience it, there's no going back."
    }
  ];

  return (
    <section id="how-it-works" className="relative py-32 md:py-40 bg-white overflow-hidden">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-black/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tight">
            No one should decide how you think
          </h2>
          <p className="text-xl md:text-2xl text-black/50 leading-relaxed">
            The transformation is instant
          </p>
        </div>

        <div className="grid gap-20 md:grid-cols-3 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center group">
                {/* Connector line - hidden on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+4rem)] w-[calc(100%-8rem)] h-px bg-black/10"></div>
                )}
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-black/5 mb-8 transition-all duration-300 group-hover:bg-black group-hover:scale-110">
                    <Icon className="w-10 h-10 text-black/70 transition-colors duration-300 group-hover:text-white" />
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-sm text-black/30 uppercase tracking-widest">
                      Step {step.step}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl text-black mb-4">{step.title}</h3>
                  <p className="text-base text-black/50 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}