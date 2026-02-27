import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CFO, TechStart Inc',
    avatar: '👩‍💼',
    content: 'Finally, an expense app that doesn\'t make me want to pull my hair out. The staging area is genius!',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Finance Manager, GrowthCo',
    avatar: '👨‍💼',
    content: 'The OCR feature saves us hours every week. And the audit trail gives us complete peace of mind.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Operations Director, Global Ventures',
    avatar: '👩‍💻',
    content: 'Multi-currency support with real-time rates is exactly what our international team needed. Game changer.',
    rating: 5,
  },
];

export default function SocialProof() {
  return (
    <section id="support" className="relative py-20 dark:bg-bg-black bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="dark:text-white text-gray-900">Loved by</span>
            <br />
            <span className="text-teal-heart">
              Business Owners
            </span>
          </h2>
          <p className="text-xl dark:text-gray-400 text-gray-900 max-w-3xl mx-auto">
            Transform your expense management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl dark:bg-teal-heart/10 bg-gray-50 border border-teal-heart/30 hover:border-teal-heart/50 transition-all"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-success-green fill-success-green" />
                ))}
              </div>
              <p className="dark:text-gray-300 text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-teal-heart flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold dark:text-white text-gray-900">{testimonial.name}</div>
                  <div className="text-sm dark:text-gray-400 text-gray-900">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
