export default function VideoHero() {
  return (
    <section className="relative py-12 dark:bg-bg-black bg-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 space-y-3">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold dark:text-white text-gray-900">
            Built to be easy for everyone
          </h2>
          <p className="text-xl md:text-2xl text-teal-heart font-medium">
            AI will manage data from your receipts
          </p>
        </div>

        <div className="relative group">
          <div
            className="absolute -inset-1 bg-gradient-to-r from-teal-heart to-accent-lime rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          ></div>

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: `
                0 0 40px rgba(0, 212, 255, 0.3),
                0 0 80px rgba(0, 212, 255, 0.2),
                0 20px 100px rgba(0, 212, 255, 0.15)
              `
            }}
          >
            <div className="aspect-video relative">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/22exovj9apo"
                title="Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="dark:text-gray-400 text-gray-900 text-base md:text-lg max-w-3xl mx-auto">
            See how our intuitive interface makes expense tracking effortless for your entire team.
            No complex training required—your employees can start submitting expenses in minutes.
          </p>
        </div>
      </div>
    </section>
  );
}
