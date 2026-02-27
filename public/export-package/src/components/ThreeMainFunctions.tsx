export default function ThreeMainFunctions() {
  const functions = [
    {
      number: '01',
      title: 'Function One',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    },
    {
      number: '02',
      title: 'Function Two',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    },
    {
      number: '03',
      title: 'Function Three',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    },
  ];

  return (
    <section className="relative py-20 dark:bg-bg-black bg-white overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold dark:text-white text-gray-900">
              Three Main Functions
            </h2>

            <div className="space-y-6">
              {functions.map((func, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-teal-heart/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-teal-heart">{func.number}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                      {func.title}
                    </h3>
                    <p className="text-base dark:text-gray-400 text-gray-600 leading-relaxed">
                      {func.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Phone Image */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div
              className="absolute inset-0 -inset-x-20 bg-teal-heart/30 rounded-full blur-3xl opacity-40"
              style={{ transform: 'scale(0.8)' }}
            ></div>
            <div className="relative z-10 w-full max-w-md">
              <img
                src="/phone.png"
                alt="App Interface"
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
