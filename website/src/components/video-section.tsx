export function VideoSection() {
  return (
    <section className="relative py-4 md:py-6 bg-white overflow-hidden">
      <style>{`
        .video-hover-controls::-webkit-media-controls {
          opacity: 0;
          transition: opacity 0.3s;
        }
        .video-hover-controls:hover::-webkit-media-controls {
          opacity: 1;
        }
      `}</style>
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Video Container */}
          <div
            className="relative rounded-2xl shadow-xl"
            style={{
              background: 'linear-gradient(to bottom right, rgb(192, 132, 252), rgb(244, 114, 182), rgb(251, 146, 60))',
              padding: '6%'
            }}
          >
            <video
              className="w-full h-auto rounded-xl shadow-lg video-hover-controls"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              controls
              src="/video/antitabs-demo.mov"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
