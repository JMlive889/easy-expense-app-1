import { useState } from 'react';
import { X } from 'lucide-react';

const features = [
  {
    title: 'Finding Your Receipts',
    description: 'Tired of endless scrolling through unorganized lists trying to find that one receipt from last week? Our clear staging areas with smart batching organize receipts by trip or project automatically. Find what you need in seconds, not minutes.',
  },
  {
    title: 'Approval Status',
    description: 'Stop refreshing your email every hour wondering if your expense report has been approved. Get instant notifications the moment your report moves through the approval chain. Our real-time dashboard shows you exactly where everything stands.',
  },
  {
    title: 'Duplicate Receipts',
    description: 'Manual duplicate checking is tedious and error-prone. One missed duplicate could flag your entire report. Our automatic image hash detection and unique ID system catches duplicates instantly, protecting you from accidental resubmissions.',
  },
  {
    title: 'Permission Control',
    description: 'Basic role systems leave you guessing who can see what, with no transparency into who made changes. Granular permissions let you control access at every level, while full audit trail logs show you exactly who did what and when.',
  },
  {
    title: 'Data Entry',
    description: 'Manually typing merchant names, dates, amounts, and categories is the worst part of expense reporting. Advanced OCR technology automatically extracts all key information from your receipts. Just snap a photo and we handle the rest.',
  },
  {
    title: 'Report Generation',
    description: 'Building comprehensive reports with proper formatting and export options takes forever. Generate detailed expense reports in seconds with customizable templates, multi-format exports, and automatic calculation of totals and taxes.',
  },
];

const placeholderImages = [
  { gradient: 'from-blue-500 to-blue-600', label: 'Screenshot 1' },
  { gradient: 'from-teal-500 to-teal-600', label: 'Screenshot 2' },
  { gradient: 'from-green-500 to-green-600', label: 'Screenshot 3' },
  { gradient: 'from-cyan-500 to-cyan-600', label: 'Screenshot 4' },
];

export default function Differentiation() {
  const [selectedImage, setSelectedImage] = useState<{ featureIndex: number; imageIndex: number } | null>(null);
  return (
    <section className="relative py-20 dark:bg-bg-black bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="dark:text-white text-gray-900">Why Teams Choose</span>
            <br />
            <span className="text-teal-heart">
              Accounting Module
            </span>
          </h2>
          <p className="text-xl dark:text-gray-400 text-gray-900 max-w-3xl mx-auto">
            Experience the difference between frustration and clarity
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
            >
              <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <h3 className="text-3xl md:text-4xl font-bold dark:text-white text-gray-900 mb-6">
                  {feature.title}
                </h3>
                <p className="text-lg dark:text-gray-400 text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-lg dark:text-gray-400 text-gray-600 leading-relaxed mt-4">
                  {feature.description}
                </p>
              </div>

              <div className={`${index % 2 === 1 ? 'lg:order-1' : ''} max-w-md`}>
                <div className="grid grid-cols-2 gap-4">
                  {placeholderImages.map((image, imgIndex) => (
                    <div
                      key={imgIndex}
                      onClick={() => setSelectedImage({ featureIndex: index, imageIndex: imgIndex })}
                      className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${image.gradient} aspect-square cursor-pointer hover:scale-105 transition-transform duration-200 group`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-semibold opacity-50 group-hover:opacity-100 transition-opacity">
                          {image.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl dark:bg-teal-heart/10 bg-gray-100 border border-teal-heart/30 text-center">
          <h3 className="text-2xl font-bold dark:text-white text-gray-900 mb-4">
            Built for Transparency and Trust
          </h3>
          <p className="text-lg dark:text-gray-400 text-gray-900 max-w-2xl mx-auto">
            Every feature is designed with your team's clarity and accountability in mind.
            No hidden processes, no confusion, just straightforward expense management that works.
          </p>
        </div>
      </div>

      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`rounded-2xl overflow-hidden bg-gradient-to-br ${placeholderImages[selectedImage.imageIndex].gradient} aspect-square w-full max-w-2xl mx-auto`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">
                  {features[selectedImage.featureIndex].title} - {placeholderImages[selectedImage.imageIndex].label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
