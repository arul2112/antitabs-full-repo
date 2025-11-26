import { Avatar, AvatarFallback } from "./ui/avatar";
import { Quote } from "lucide-react";

export function SocialProofSection() {
  const testimonials = [
    {
      name: "Alex Rivera",
      role: "Day Trader",
      avatar: "AR",
      content: "I track 15 positions across 3 exchanges. Before AntiTabs, I was blind. Now I see everything."
    },
    {
      name: "Jordan Kim",
      role: "Senior Engineer",
      avatar: "JK",
      content: "Debugging used to mean switching between 12 tabs. Now everything is visible. I ship code 2× faster."
    },
    {
      name: "Taylor Morgan",
      role: "Product Designer",
      avatar: "TM",
      content: "Reference designs, Figma, and live preview all at once. My creative flow is uninterrupted."
    }
  ];

  const stats = [
    { value: "10×", label: "Faster" },
    { value: "40+", label: "Windows" },
    { value: "Zero", label: "Switching" },
    { value: "3×", label: "Productivity" }
  ];

  return (
    <section className="relative py-32 md:py-40 bg-black/[0.02] overflow-hidden">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl text-black mb-6 tracking-tight">
            Tabs are dead
          </h2>
          <p className="text-xl md:text-2xl text-black/50 leading-relaxed">
            Join professionals who've escaped the old workflow
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center py-8 px-4 rounded-3xl bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300">
              <div className="text-4xl md:text-5xl mb-2 text-black">
                {stat.value}
              </div>
              <div className="text-sm text-black/50 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-8 rounded-3xl bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300">
              <Quote className="w-8 h-8 mb-6 text-black/20" />
              
              <p className="text-base text-black/70 mb-8 leading-relaxed">
                {testimonial.content}
              </p>
              
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-black text-white">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-black">{testimonial.name}</div>
                  <div className="text-sm text-black/50">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}