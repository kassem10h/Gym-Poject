import React, { useState } from 'react';
import { Dumbbell, Users, ShoppingBag, Calendar, TrendingUp, Star, Menu, X, Award, Clock, Target, Zap, CheckCircle, ArrowRight, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">FitZone</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition">Home</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition">Reviews</a>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition"
              >
                Login
              </button>
              <button 
                onClick={() => window.location.href = '/signup'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Get Started
              </button>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700">Home</a>
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700">Features</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700">Pricing</a>
              <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="block py-2 text-gray-700">Reviews</a>
              <button onClick={() => { window.location.href = '/login'; setIsMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">Login</button>
              <button onClick={() => window.location.href = '/signup'} className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                🎉 Limited Time: 20% Off First Month
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Your Body, Mind & Life
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join FitZone's premium gym management platform. Get personalized training plans, track your progress, and shop fitness essentials—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-lg transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl hover:border-blue-600 font-semibold text-lg transition"
                >
                  See How It Works
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-600">Active Members</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-gray-900">50+</p>
                  <p className="text-sm text-gray-600">Expert Trainers</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-gray-900">4.9⭐</p>
                  <p className="text-sm text-gray-600">User Rating</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop" 
                alt="Person working out" 
                className="rounded-2xl shadow-2xl w-full h-96 lg:h-[500px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 bg-blue-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            <div>
              <Award className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">15+</p>
              <p className="text-blue-100">Years Experience</p>
            </div>
            <div>
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">10k+</p>
              <p className="text-blue-100">Happy Members</p>
            </div>
            <div>
              <Dumbbell className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">200+</p>
              <p className="text-blue-100">Equipment</p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">98%</p>
              <p className="text-blue-100">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-2">FEATURES</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to help you reach your fitness goals faster
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Book classes and personal training sessions with real-time availability. Never miss a workout with automated reminders.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-green-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor every metric that matters. Track workouts, calories, body composition, and see your transformation unfold.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Target className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Plans</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized workout and nutrition plans tailored to your goals, fitness level, and preferences.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-orange-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fitness Store</h3>
              <p className="text-gray-600 leading-relaxed">
                Shop premium supplements, gear, and apparel. Exclusive member discounts on all products.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Coaches</h3>
              <p className="text-gray-600 leading-relaxed">
                Work with certified trainers who design programs just for you. Get form checks and motivation when you need it.
              </p>
            </div>

            <div className="p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition group cursor-pointer">
              <div className="bg-yellow-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Access</h3>
              <p className="text-gray-600 leading-relaxed">
                Train on your schedule with round-the-clock gym access and digital workout library available anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-2">HOW IT WORKS</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Get Started in 3 Simple Steps</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Profile</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up in minutes and tell us about your fitness goals, experience level, and preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Your Plan</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive a personalized workout program designed by our expert trainers just for you.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Training</h3>
              <p className="text-gray-600 leading-relaxed">
                Book your first session, track your progress, and watch yourself transform week by week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join 10,000+ members who are already crushing their fitness goals with FitZone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-10 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 font-bold text-lg transition transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              Start Your Free Trial <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-10 py-4 bg-blue-700 text-white border-2 border-blue-400 rounded-xl hover:bg-blue-800 font-bold text-lg transition"
            >
              Sign In
            </button>
          </div>
          <p className="text-blue-200 mt-6 text-sm">No credit card required • Cancel anytime</p>
        </div>
      </section>


      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-2">TESTIMONIALS</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">What Our Members Say</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "FitZone completely changed my approach to fitness. The personalized plans and amazing trainers kept me motivated every step of the way!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">SJ</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">Member for 2 years</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "Lost 30 pounds in 4 months! The progress tracking feature made it so easy to stay accountable and see real results."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">MC</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Mike Chen</p>
                  <p className="text-sm text-gray-600">Member for 1 year</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "Best gym experience ever! The equipment is top-notch and the community is incredibly supportive. Worth every penny."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">EP</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Emma Parker</p>
                  <p className="text-sm text-gray-600">Member for 6 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;