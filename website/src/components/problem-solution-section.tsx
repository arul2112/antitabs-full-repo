import { TrendingUp, Layers, Eye, Zap } from "lucide-react";

export function ProblemSolutionSection() {
  const benefits = [
    {
      icon: Layers,
      title: "Operate like a broadcast director",
      description: "Multiple screens. Multiple windows. Zero switching. Real-time visibility."
    },
    {
      icon: Eye,
      title: "See everything, miss nothing",
      description: "Complete situational awareness in one view. Perfect for professionals."
    },
    {
      icon: TrendingUp,
      title: "Your brain finally matches your screen",
      description: "Your canvas is now as big as your ideas, not as small as a tab."
    },
    {
      icon: Zap,
      title: "Real multitasking finally exists",
      description: "From tab chaos to total situational awareness. Multi-reality unlocked."
    }
  ];

  return (
    <section className="relative py-32 md:py-40 bg-white overflow-hidden">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-black/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-black/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Problem Statement */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tight">
            Your browser is too small for your mind
          </h2>
          <p className="text-xl md:text-2xl text-black/50 leading-relaxed">
            If you have more than one thought, you deserve more than one tab.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-6 mx-auto transition-all duration-300 group-hover:bg-black group-hover:scale-110">
                  <Icon className="w-8 h-8 text-black/70 transition-colors duration-300 group-hover:text-white" />
                </div>
                <h3 className="text-xl md:text-2xl text-black mb-3">{benefit.title}</h3>
                <p className="text-base text-black/50 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}