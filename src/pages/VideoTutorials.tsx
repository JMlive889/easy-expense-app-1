import { Upload, Sparkles, Target, ShieldCheck, ClipboardList, Bell, Eye, Shield, Layers, Flag, MousePointerClick, ListChecks, UserCheck, Lock, FileText, Smartphone, Download, Zap, RefreshCw, FileSpreadsheet, FileDown, Filter, CheckCircle, Plug, Database } from 'lucide-react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';
import { useState, useEffect } from 'react';

interface VideoTutorialsProps {
  onNavigate?: (page: string) => void;
}

export default function VideoTutorials({ onNavigate }: VideoTutorialsProps = {}) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const features = [
    { icon: Upload, label: 'Snap or drag-and-drop receipts from mobile/web in seconds' },
    { icon: Sparkles, label: 'AI-powered OCR auto-fills amount, date, vendor—no manual typing' },
    { icon: Target, label: 'Directed "Upload Here" screen with clear progress indicators' },
    { icon: ShieldCheck, label: 'Prevents errors and duplicates at the source for accurate data' },
  ];

  const approvalFeatures = [
    { icon: ClipboardList, label: 'All receipts land in a dedicated "Waiting for Approval" dashboard' },
    { icon: Bell, label: 'Instant notifications to bookkeepers for quick reviews' },
    { icon: Eye, label: 'Clear status visibility—no endless searching or scrolling' },
    { icon: Shield, label: 'AI assists in spotting issues, reducing approval time and fraud risk' },
  ];

  const batchedFeatures = [
    { icon: Layers, label: 'View complete batches grouped by trip, project, or date' },
    { icon: Flag, label: 'Auto-sorting and smart flags for high amounts or anomalies' },
    { icon: MousePointerClick, label: 'One-click review of grouped expenses for efficiency' },
    { icon: ListChecks, label: 'Ensures nothing slips through with visual batch summaries' },
  ];

  const userPermissionsFeatures = [
    { icon: UserCheck, label: 'Admins easily set custom roles: submitter, approver, payer, viewer' },
    { icon: FileText, label: 'Detailed logs track who approved what and when' },
    { icon: Lock, label: 'Granular controls prevent unauthorized access and reduce fraud' },
    { icon: Shield, label: 'Full audit trail for compliance and peace of mind' },
  ];

  const mobileAppFeatures = [
    { icon: Download, label: 'One-tap download from App Store or Google Play' },
    { icon: Smartphone, label: 'Instant setup with seamless mobile receipt capture' },
    { icon: Zap, label: 'Full features on the go—no desktop required' },
    { icon: RefreshCw, label: 'Syncs perfectly with web platform for unified experience' },
  ];

  const reportGenerationFeatures = [
    { icon: FileSpreadsheet, label: 'Generate clean PDF/CSV reports with one click' },
    { icon: CheckCircle, label: 'Built-in layouts eliminate duplicates via unique receipt IDs' },
    { icon: Filter, label: 'Custom filters for projects, dates, or categories' },
    { icon: FileDown, label: 'Export-ready for accounting software or audits' },
  ];

  const integrationHooksFeatures = [
    { icon: Plug, label: 'Ready to connect with our timetracking app for unified data' },
    { icon: Database, label: 'Pulls accurate, real-time info from future accounting modules' },
    { icon: Sparkles, label: 'Plugin ecosystem for custom AI-powered expansions' },
    { icon: RefreshCw, label: 'Seamless data flow to reduce manual work and errors' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-bg-black text-white' : 'bg-white text-gray-900'}`}>
      <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={onNavigate} />

      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold dark:text-white text-gray-900 mb-6">
              Video Tutorials
            </h1>
            <p className="text-xl md:text-2xl dark:text-gray-400 text-gray-600 max-w-3xl mx-auto">
              Learn how to maximize your productivity with our comprehensive video guides
            </p>
          </div>

          <section className="relative py-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Receipt Upload & Submission
                  </h3>

                  <div className="space-y-6">
                    {features.map((feature, featureIndex) => {
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
                    Upload Receipts
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        3
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Master Receipt Upload & Submission
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  Our step-by-step video tutorial shows you how to upload receipts effortlessly using our intuitive directed interface and AI OCR technology. Learn to capture expenses on the go with mobile snaps or web drag-and-drop, watch the system auto-extract key details accurately, and see tips for avoiding common pitfalls. Perfect for users who want fast, error-free submissions that feed clean data into your accounting hub—get started in minutes and eliminate manual entry forever.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Built-In Approval Process
                  </h3>

                  <div className="space-y-6">
                    {approvalFeatures.map((feature, featureIndex) => {
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
                    Staging Area for Approvals
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        2
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Streamline Your Approval Workflow
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  Dive into our video guide on the powerful Staging Area, where every receipt awaits structured approval. See how the "Waiting for Approval" dashboard organizes submissions, how notifications keep your team in sync, and how bookkeepers use AI suggestions to approve faster and with greater confidence. Say goodbye to chaotic workflows—gain transparency, speed, and control while minimizing errors and potential fraud.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Batched Receipts View
                  </h3>

                  <div className="space-y-6">
                    {batchedFeatures.map((feature, featureIndex) => {
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
                    View Pending Receipts Easily
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        3
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Organize & Review Batched Receipts Effortlessly
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  This tutorial walks you through the "Complete Batches" screen, showing how receipts are automatically grouped and sorted for quick overviews. Watch as the system flags potential issues like unusual amounts, learn batch review shortcuts, and see how this feature supports project-based or trip-based expense tracking. Achieve cleaner reporting and faster reimbursements with organized, transparent batches. No more scattered data.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    User Permissions & Transparency Logs
                  </h3>

                  <div className="space-y-6">
                    {userPermissionsFeatures.map((feature, featureIndex) => {
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
                    Users
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        4
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Easy, Secure & Transparent Permissions
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  In this tutorial you will learn to configure your permission system. Discover how admins assign roles, enforce controls, and access real-time transparency logs showing every action—from submission to approval. See real-world examples of preventing fraud and ensuring compliance. Build trust across your team with precise, auditable access that puts you fully in control.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Mobile App
                  </h3>

                  <div className="space-y-6">
                    {mobileAppFeatures.map((feature, featureIndex) => {
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
                    Download the Mobile App
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        5
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Get Started with Our Mobile App in Minutes
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  Our quick-start video demonstrates downloading and setting up the app on iOS or Android, as well as the 2FA login sequence. Follow along as you install, sign in, and begin snapping receipts instantly from your phone. Explore how mobile uploads sync to the web dashboard for real-time approvals and reporting. Experience true mobility and convenience—designed for busy users who need accurate expense tracking anywhere.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Quick Reports
                  </h3>

                  <div className="space-y-6">
                    {reportGenerationFeatures.map((feature, featureIndex) => {
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
                    Report Generation & Exports
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        6
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Create Accurate Reports Instantly
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  Watch this tutorial to master report generation: see how the system auto-compiles expenses into duplicate-free, professional exports (PDF or CSV). Learn filtering options, layout previews, and export best practices for seamless integration with your accounting tools. Deliver transparent, error-free reports that save time and ensure compliance, every time.
                </p>
              </div>
            </div>
          </section>

          <section className="relative py-16 mt-16 dark:bg-secondary-dark bg-gray-50 rounded-3xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-8 lg:pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900">
                    Building Connections
                  </h3>

                  <div className="space-y-6">
                    {integrationHooksFeatures.map((feature, featureIndex) => {
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
                    Integration Hooks (Coming Soon)
                  </h2>

                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-heart via-deep-green to-accent-lime shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/20 text-8xl font-bold">
                        7
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-gray-900 mb-6">
                  Prepare for Powerful Integrations
                </h3>
                <p className="text-lg md:text-xl dark:text-gray-300 text-gray-700 leading-relaxed">
                  Get a sneak peek in this overview video of our integration-ready architecture. See how hooks enable easy connections to the upcoming timetracking app and main accounting system, pulling concrete data for unmatched accuracy. Learn about future plugins and AI modules—position your team for a fully connected ecosystem built for growth.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer onNavigate={onNavigate} darkMode={darkMode} />
    </div>
  );
}
