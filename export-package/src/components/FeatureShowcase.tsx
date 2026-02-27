import {
  Smartphone,
  Zap,
  Palette,
  ArrowUpDown,
  Video,
  Camera,
  Lock,
  Gauge,
  Database,
  Globe,
  Mail,
  Users,
} from 'lucide-react';

const showcaseData = [
  {
    heading: 'How to get the most out of this event promotion',
    subheading: 'Template features',
    features: [
      { icon: Smartphone, label: 'Responsive' },
      { icon: Zap, label: 'Dynamic' },
      { icon: Palette, label: 'Customisable' },
      { icon: ArrowUpDown, label: 'Scroll Effects' },
      { icon: Video, label: 'Video' },
      { icon: Camera, label: 'Photography' },
    ],
  },
  {
    heading: 'Streamlined workflow for maximum productivity',
    subheading: 'Performance benefits',
    features: [
      { icon: Gauge, label: 'Lightning Fast' },
      { icon: Lock, label: 'Secure by Default' },
      { icon: Database, label: 'Real-time Sync' },
      { icon: Globe, label: 'Global Access' },
      { icon: Mail, label: 'Notifications' },
      { icon: Users, label: 'Team Collaboration' },
    ],
  },
  {
    heading: 'Built for modern teams and enterprises',
    subheading: 'Enterprise ready',
    features: [
      { icon: Lock, label: 'Advanced Security' },
      { icon: Users, label: 'Multi-user Support' },
      { icon: Database, label: 'Scalable Architecture' },
      { icon: Globe, label: 'Cloud Native' },
      { icon: Zap, label: 'Instant Updates' },
      { icon: Gauge, label: 'High Performance' },
    ],
  },
];

export default function FeatureShowcase() {
  return (
    <div className="dark:bg-bg-black bg-white">
      {showcaseData.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          className={`relative py-24 ${
            sectionIndex % 2 === 0 ? 'dark:bg-bg-black bg-white' : 'dark:bg-secondary-dark bg-gray-50'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 space-y-8 lg:pt-4">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                  {section.subheading}
                </h3>

                <div className="space-y-6">
                  {section.features.map((feature, featureIndex) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={featureIndex}
                        className="flex items-center space-x-4 group"
                      >
                        <div className="w-14 h-14 rounded-xl bg-teal-heart/10 dark:bg-teal-heart/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-teal-heart/20 dark:group-hover:bg-teal-heart/30 transition-all">
                          <Icon className="w-6 h-6 text-teal-heart dark:text-accent-lime" />
                        </div>
                        <span className="text-xl dark:text-gray-300 text-gray-700 font-medium">
                          {feature.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-8">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold dark:text-white text-gray-900 leading-tight">
                  {section.heading}
                </h2>

                <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/20 text-8xl font-bold">
                      {sectionIndex + 1}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
