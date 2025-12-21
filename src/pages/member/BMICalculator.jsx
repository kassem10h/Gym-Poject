import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, X, Activity, TrendingUp, Target, Flame, Heart, Scale
} from 'lucide-react';

export default function BMICalculator() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: 'Male',
    activityLevel: 'moderate',
    fitnessGoal: 'maintain'
  });
  const [results, setResults] = useState(null);
  const [unit, setUnit] = useState('metric');

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Light', description: 'Exercise 1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: 'Exercise 3-5 days/week' },
    { value: 'active', label: 'Active', description: 'Exercise 6-7 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Very intense exercise daily' }
  ];

  const fitnessGoals = [
    { value: 'lose', label: 'Lose Weight', icon: TrendingUp, color: 'from-red-500 to-pink-500' },
    { value: 'maintain', label: 'Maintain', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { value: 'gain', label: 'Gain Muscle', icon: Activity, color: 'from-green-500 to-emerald-500' }
  ];

  const calculateBMI = (height, weight) => {
    if (unit === 'metric') {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
    } else {
      return ((weight / (height * height)) * 703).toFixed(1);
    }
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (bmi < 25) return { category: 'Normal Weight', color: 'text-green-600', bg: 'bg-green-100' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { category: 'Obese', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const calculateBMR = (weight, height, age, gender) => {
    let bmr;
    if (unit === 'metric') {
      if (gender === 'Male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }
    } else {
      const weightKg = weight * 0.453592;
      const heightCm = height * 2.54;
      if (gender === 'Male') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
      } else {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
      }
    }
    return Math.round(bmr);
  };

  const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return Math.round(bmr * multipliers[activityLevel]);
  };

  const calculateDailyCalories = (tdee, goal) => {
    if (goal === 'lose') return Math.round(tdee - 500);
    if (goal === 'gain') return Math.round(tdee + 500);
    return tdee;
  };

  const calculateMacros = (calories, goal) => {
    let proteinPct, carbPct, fatPct;
    
    if (goal === 'lose') {
      proteinPct = 0.35; carbPct = 0.35; fatPct = 0.30;
    } else if (goal === 'gain') {
      proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
    } else {
      proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
    }

    return {
      protein: Math.round((calories * proteinPct) / 4),
      carbs: Math.round((calories * carbPct) / 4),
      fat: Math.round((calories * fatPct) / 9)
    };
  };

  const handleCalculate = () => {
    const { height, weight, age, gender, activityLevel, fitnessGoal } = formData;
    
    if (!height || !weight || !age) {
      alert('Please fill in all required fields');
      return;
    }
    
    const bmi = parseFloat(calculateBMI(parseFloat(height), parseFloat(weight)));
    const bmiInfo = getBMICategory(bmi);
    const bmr = calculateBMR(parseFloat(weight), parseFloat(height), parseInt(age), gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const dailyCalories = calculateDailyCalories(tdee, fitnessGoal);
    const macros = calculateMacros(dailyCalories, fitnessGoal);

    setResults({
      bmi,
      bmiCategory: bmiInfo.category,
      bmiColor: bmiInfo.color,
      bmiBg: bmiInfo.bg,
      bmr,
      tdee,
      dailyCalories,
      macros
    });
  };

  const resetForm = () => {
    setFormData({
      height: '',
      weight: '',
      age: '',
      gender: 'Male',
      activityLevel: 'moderate',
      fitnessGoal: 'maintain'
    });
    setResults(null);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all z-40 flex items-center gap-2"
      >
        <Calculator className="w-6 h-6" />
        <span className="font-semibold pr-2">BMI Calculator</span>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Fitness Calculator</h2>
                    <p className="text-white text-opacity-90 mt-1">Calculate your BMI, BMR, and daily calorie needs</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-center mb-6">
                  <div className="inline-flex rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setUnit('metric')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        unit === 'metric'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Metric (cm/kg)
                    </button>
                    <button
                      onClick={() => setUnit('imperial')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        unit === 'imperial'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Imperial (in/lbs)
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Height {unit === 'metric' ? '(cm)' : '(inches)'}*
                      </label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                        placeholder={unit === 'metric' ? '178' : '70'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Weight {unit === 'metric' ? '(kg)' : '(lbs)'}*
                      </label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        placeholder={unit === 'metric' ? '74' : '163'}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Age (years)*
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        placeholder="21"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Gender*</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Male', 'Female'].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setFormData({...formData, gender})}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.gender === gender
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-semibold">{gender}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Fitness Goal*</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {fitnessGoals.map((goal) => {
                        const Icon = goal.icon;
                        return (
                          <button
                            key={goal.value}
                            type="button"
                            onClick={() => setFormData({...formData, fitnessGoal: goal.value})}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              formData.fitnessGoal === goal.value
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`bg-gradient-to-r ${goal.color} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 block">{goal.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Activity Level*</label>
                    <div className="space-y-2">
                      {activityLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({...formData, activityLevel: level.value})}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            formData.activityLevel === level.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900 block">{level.label}</span>
                              <span className="text-sm text-gray-600">{level.description}</span>
                            </div>
                            {formData.activityLevel === level.value && (
                              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleCalculate}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Calculate
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {results && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-8 space-y-4"
                    >
                      <div className="border-t-2 border-gray-200 pt-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Activity className="w-6 h-6 text-indigo-600" />
                          Your Results
                        </h3>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Body Mass Index (BMI)</p>
                              <p className="text-5xl font-bold text-gray-900">{results.bmi}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${results.bmiBg} ${results.bmiColor}`}>
                                {results.bmiCategory}
                              </span>
                            </div>
                            <Scale className="w-16 h-16 text-indigo-300" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Heart className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Basal Metabolic Rate</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{results.bmr}</p>
                            <p className="text-sm text-gray-500 mt-1">calories/day at rest</p>
                          </div>

                          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Flame className="w-5 h-5 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Total Daily Energy</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{results.tdee}</p>
                            <p className="text-sm text-gray-500 mt-1">calories/day with activity</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-500 p-2 rounded-lg">
                              <Target className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-gray-900">Recommended Daily Calories</span>
                          </div>
                          <p className="text-4xl font-bold text-gray-900 mb-2">{results.dailyCalories} cal/day</p>
                          <p className="text-sm text-gray-600">
                            Based on your {formData.fitnessGoal} goal
                          </p>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 text-lg">Recommended Macronutrients</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="bg-red-100 rounded-xl p-4 mb-2">
                                <p className="text-3xl font-bold text-red-600">{results.macros.protein}g</p>
                              </div>
                              <p className="text-sm font-medium text-gray-700">Protein</p>
                            </div>
                            <div className="text-center">
                              <div className="bg-blue-100 rounded-xl p-4 mb-2">
                                <p className="text-3xl font-bold text-blue-600">{results.macros.carbs}g</p>
                              </div>
                              <p className="text-sm font-medium text-gray-700">Carbs</p>
                            </div>
                            <div className="text-center">
                              <div className="bg-yellow-100 rounded-xl p-4 mb-2">
                                <p className="text-3xl font-bold text-yellow-600">{results.macros.fat}g</p>
                              </div>
                              <p className="text-sm font-medium text-gray-700">Fat</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}