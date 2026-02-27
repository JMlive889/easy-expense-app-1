import { useState } from 'react';
import {
  Upload,
  Clock,
  FolderKanban,
  Shield,
  Plug,
  FileText,
  Smartphone,
  Tags,
  AlertTriangle,
  DollarSign,
  FileCheck,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Receipt Upload & OCR',
    description: 'Mobile and web upload with optical character recognition to auto-fill amount, date, and vendor details instantly.',
  },
  {
    icon: Clock,
    title: 'Staging Area for Approvals',
    description: 'All uploads go to a "Waiting for Approval" dashboard. Clear status visibility with instant notifications.',
  },
  {
    icon: FolderKanban,
    title: 'Batched Receipts View',
    description: 'Grouped expenses by trip or project with auto-sorting and smart flagging for high-amount reviews.',
  },
  {
    icon: Shield,
    title: 'User Permissions',
    description: 'Elaborate role structure with admins setting submitter, approver, and payer roles. Full transparency logs.',
  },
  {
    icon: Plug,
    title: 'Integration Hooks',
    description: 'Ready to connect with timetracking apps and accounting systems for accurate, automated data flow.',
  },
  {
    icon: FileText,
    title: 'Report Generation',
    description: 'Simple PDF and CSV exports with layouts that naturally eliminate duplicates via unique receipt IDs.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Web App',
    description: 'Browser-based web app for immediate access. Full native app coming soon for enhanced mobile experience.',
  },
  {
    icon: Tags,
    title: 'Custom Categories & Rules',
    description: 'Set smart rules to auto-categorize expenses. "Starbucks" automatically tagged as meals, for example.',
  },
  {
    icon: AlertTriangle,
    title: 'Fraud Detection',
    description: 'Intelligent alerts for unusual patterns and duplicate receipt detection via advanced image hash checking.',
  },
  {
    icon: DollarSign,
    title: 'Multi-Currency Support',
    description: 'Automatic currency conversion with real-time exchange rates for global teams and international expenses.',
  },
  {
    icon: FileCheck,
    title: 'Complete Audit Trail',
    description: 'Full history view for transparency. Exportable audit logs for compliance and accountability.',
  },
];

export default function Features() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="features" className="relative py-20 dark:bg-bg-black bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-accent-lime/30 bg-accent-lime/5 mb-6">
            <span className="text-sm text-accent-lime font-medium">App Benefits</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-teal-heart">
              Discover powerful features
            </span>
            <br />
            <span className="dark:text-white text-gray-900">that simplify your life</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="relative lg:sticky lg:top-24">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime p-12 shadow-2xl min-h-[500px] flex flex-col justify-center">
              <div className="absolute top-8 left-8">
                <Sparkles className="w-8 h-8 text-white/40" />
              </div>
              <div className="absolute bottom-12 right-12">
                <Sparkles className="w-6 h-6 text-white/30" />
              </div>

              <div className="relative z-10">
                <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                  <span className="text-sm text-white font-medium">Features</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  Everything you need for expense management
                </h3>
                <p className="text-xl text-white/90 leading-relaxed">
                  Streamline workflows, ensure transparency, and empower your team with powerful automation and intelligent insights.
                </p>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isExpanded = expandedIndex === index;

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-secondary-dark rounded-2xl border border-gray-200 dark:border-teal-heart/20 overflow-hidden transition-all hover:border-teal-heart/50 hover:shadow-lg"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-gray-50 dark:hover:bg-teal-heart/5"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-2xl font-bold text-teal-heart">
                        {index + 1}.
                      </span>
                      <h3 className="text-xl font-bold dark:text-white text-gray-900">
                        {feature.title}
                      </h3>
                    </div>

                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isExpanded
                        ? 'bg-teal-heart rotate-180'
                        : 'bg-teal-heart/20 hover:bg-teal-heart/30'
                    }`}>
                      {isExpanded ? (
                        <Minus className="w-5 h-5 text-white" />
                      ) : (
                        <Plus className="w-5 h-5 text-teal-heart" />
                      )}
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-heart/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Icon className="w-6 h-6 text-accent-lime" />
                        </div>
                        <p className="text-lg dark:text-gray-400 text-gray-700 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
