import { Check } from 'lucide-react';

export default function PricingSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      name: 'Core Expense Tracking',
      basic: 'Unlimited receipt uploads with AI OCR auto-fill (amount, date, vendor)',
      pro: 'All Basic features + unlimited uploads',
    },
    {
      name: 'Approval Workflow',
      basic: 'Dedicated staging area with notifications and clear dashboards',
      pro: 'Enhanced approvals with AI duplicate detection',
    },
    {
      name: 'Batched Views',
      basic: 'Grouped expenses by project/trip with auto-sorting and flags',
      pro: 'Advanced batching with custom filters',
    },
    {
      name: 'User Permissions',
      basic: 'Elaborate roles (submitter, approver, etc.) with transparency logs',
      pro: 'Full permissions + audit trails for teams',
    },
    {
      name: 'Report Generation',
      basic: 'Simple PDF/CSV exports with duplicate elimination',
      pro: 'Customizable reports + export integrations',
    },
    {
      name: 'Mobile App Access',
      basic: 'Easy download and on-the-go tracking',
      pro: 'Priority mobile updates and sync',
    },
    {
      name: 'AI-Powered Features',
      basic: 'All AI tools: Dupe checks, predictive insights, workflow optimization',
      pro: 'All AI + premium invoicing AI (coming soon)',
    },
    {
      name: 'Invoicing',
      basic: null,
      pro: 'Send Stripe-compatible invoices (coming soon)',
    },
  ];

  return (
    <section id="pricing" className="relative py-20 dark:bg-bg-black bg-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 212, 255, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="dark:text-white text-gray-900">Simple, Transparent</span>
            <br />
            <span className="text-teal-heart">Pricing</span>
          </h2>
          <p className="text-xl dark:text-gray-400 text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your team's needs. All plans include AI-powered features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-heart/20 to-accent-lime/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative dark:bg-bg-black bg-white rounded-2xl border-2 border-teal-heart/30 p-8 h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">Basic</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold text-teal-heart">$7</span>
                  <span className="text-xl dark:text-gray-400 text-gray-600 ml-2">/user/month</span>
                </div>
                <p className="dark:text-gray-400 text-gray-600">Perfect for small teams getting started with expense management</p>
              </div>

              <div className="space-y-6 flex-grow">
                {features.map((feature) => (
                  <div key={feature.name} className="flex gap-3">
                    {feature.basic ? (
                      <>
                        <Check className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-lg font-semibold dark:text-white text-gray-900 mb-1">{feature.name}</p>
                          <p className="text-base dark:text-gray-400 text-gray-600">{feature.basic}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3 opacity-40">
                        <span className="w-5 h-5 flex-shrink-0 text-gray-500">-</span>
                        <div>
                          <p className="text-lg font-semibold dark:text-gray-500 text-gray-400 mb-1">{feature.name}</p>
                          <p className="text-base dark:text-gray-600 text-gray-400">Not included</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollToSection('cta')}
                className="w-full mt-8 px-8 py-4 rounded-lg bg-teal-heart/10 border-2 border-teal-heart text-teal-heart font-bold text-lg hover:bg-teal-heart hover:text-bg-black transition-all"
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-heart/30 to-accent-lime/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative dark:bg-gradient-to-br dark:from-teal-heart/10 dark:to-accent-lime/10 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl border-2 border-teal-heart p-8 h-full flex flex-col">
              <div className="absolute top-6 right-6">
                <span className="px-4 py-1 rounded-full bg-teal-heart text-bg-black text-sm font-bold">
                  POPULAR
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">Pro Expense + Invoicing</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold text-teal-heart">$15</span>
                  <span className="text-xl dark:text-gray-400 text-gray-600 ml-2">/month</span>
                </div>
                <p className="dark:text-gray-300 text-gray-700">Complete expense and invoicing solution for growing teams</p>
              </div>

              <div className="space-y-6 flex-grow">
                {features.map((feature) => (
                  <div key={feature.name} className="flex gap-3">
                    <Check className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-lg font-semibold dark:text-white text-gray-900 mb-1">{feature.name}</p>
                      <p className="text-base dark:text-gray-300 text-gray-700">{feature.pro}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollToSection('cta')}
                className="w-full mt-8 px-8 py-4 rounded-lg bg-teal-heart text-bg-black font-bold text-lg hover:shadow-2xl hover:shadow-teal-heart/50 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="dark:text-gray-400 text-gray-600">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
