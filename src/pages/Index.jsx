import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ArrowRight, Calendar, Target, ShoppingBag, Flame, Trophy, Star,
  Crown, Check
} from 'lucide-react';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  // Animation Variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { staggerChildren: 0.2 }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                20% OFF FIRST MONTH
              </div>
              <h1 className="text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1]">
                Your Body <br />
                <span className="text-blue-600 italic">Our Mission.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                FitZone is the all-in-one ecosystem for elite athletes and fitness enthusiasts. Personal coaching, smart tracking, and premium gear.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/signup'}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight />
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop" 
                  alt="Training" 
                  className="w-full h-[600px] object-cover"
                />
              </div>
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4"
              >
                <div className="bg-green-500 p-3 rounded-xl text-white">
                  <TrendingUp />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Daily Progress</p>
                  <p className="text-2xl font-bold text-gray-900">+12.5%</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-gray-100 overflow-hidden bg-black">
        <div className="flex space-x-12 animate-marquee whitespace-nowrap">
          {[ 'NIKE', 'ADIDAS', 'PUMA', 'UNDER ARMOUR', 'REEBOK', 'LULULEMON', 'MOHAMMAD', 'RAWAD' ].map((brand) => (
            <span key={brand} className="text-4xl font-black text-gray-200 hover:text-blue-600 transition-colors cursor-default">
              {brand}
            </span>
          ))}
          {/* Duplicate for infinite loop effect */}
          {[ 'NIKE', 'ADIDAS', 'PUMA', 'UNDER ARMOUR', 'REEBOK', 'LULULEMON', 'HASAN', 'KASSEM' ].map((brand) => (
            <span key={brand + "2"} className="text-4xl font-black text-gray-200 hover:text-blue-600 transition-colors cursor-default">
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Choose Your Level</h2>
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isAnnual ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-7 bg-gray-200 rounded-full p-1 transition-colors duration-300 relative"
              >
                <motion.div 
                  animate={{ x: isAnnual ? 28 : 0 }}
                  className="w-5 h-5 bg-blue-600 rounded-full shadow-md"
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Annual <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">-20%</span></span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: 29, icon: <Flame />, features: ['Gym Access', 'Mobile App', '1 Group Class/mo'] },
              { name: 'Pro', price: 59, icon: <Trophy />, features: ['All Starter Features', 'Personal Trainer', 'Nutrition Plan'], popular: true },
              { name: 'Elite', price: 99, icon: <Crown />, features: ['All Pro Features', 'Recovery Spa', 'Guest Passes'] }
            ].map((plan, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-[2.5rem] border-2 ${plan.popular ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100'} relative`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </span>
                )}
                <div className="text-blue-600 mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black">${isAnnual ? Math.floor(plan.price * 0.8) : plan.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-gray-600">
                      <Check className="h-5 w-5 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-2xl font-bold transition ${plan.popular ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Hover Effects */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Master Your Routine</h2>
            <div className="h-1.5 w-20 bg-blue-600 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { title: "Smart Scheduling", icon: <Calendar />, color: "bg-blue-500", desc: "AI-powered booking that learns your habits." },
              { title: "Custom Plans", icon: <Target />, color: "bg-purple-500", desc: "Nutrition and lifting plans unique to your DNA." },
              { title: "Elite Store", icon: <ShoppingBag />, color: "bg-orange-500", desc: "Member-only access to pro supplements." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100"
              >
                <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-6xl mx-auto bg-gray-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">Ready to Level Up?</h2>
            <button 
              className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-xl hover:bg-blue-50 transition shadow-2xl"
              onClick={() => window.location.href = '/login'}
            >
              JOIN NOW
            </button>
          </div>
          {/* Decorative Circle */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;