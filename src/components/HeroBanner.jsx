import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

// Redesigned Hero Banner Component
const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const autoPlayIntervalRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const touchStartX = useRef(0);

  const slides = [
    {
      subtitle: "The Heart of Your Setup",
      title: "Forge Your Power",
      description: "Discover pre-configured builds and custom components designed for elite performance in gaming and creation.",
      imageDesktop: "https://AidibySmartTech.b-cdn.net/Banner/banner_17375347980015a5908c59c80f41b2bdb55ced8d1a.jpeg",
      imageMobile: "https://AidibySmartTech.b-cdn.net/Banner/banner_17375347980bb671470cf0e12c4b278777261c69c3.jpeg",
      buttonText: "Explore PC Builds",
      accentColor: "bg-cyan-500",
      hoverAccentColor: "bg-cyan-400",
    },
    {
      subtitle: "Immerse Yourself",
      title: "Craft Your Command Center",
      description: "From ultra-wide 4K monitors to mechanical keyboards, find the perfect peripherals to complete your battle station.",
      imageDesktop: "https://AidibySmartTech.b-cdn.net/Banner/banner_17478197475bf699b6b5b5a48ba2133dc2d9254264.jpeg",
      imageMobile: "https://AidibySmartTech.b-cdn.net/Banner/banner_1750916669cf7cb44ea2a678bb9a64ee92c9233e55.jpeg",
      buttonText: "Discover Peripherals",
      accentColor: "bg-rose-500",
      hoverAccentColor: "bg-rose-400",
    },
    {
      subtitle: "The Final Touch",
      title: "Design Your Sanctuary",
      description: "Ergonomic chairs, ambient RGB lighting, and smart cable management to create a clean, focused, and aesthetic space.",
      imageDesktop: "https://AidibySmartTech.b-cdn.net/Banner/banner_174651238872fbc7dec1787c3022c69ba1dea74909.jpeg",
      imageMobile: "https://AidibySmartTech.b-cdn.net/Banner/banner_1746512388078280a2e275158330e356a3f8eb9099.jpeg",
      buttonText: "Shop Accessories",
      accentColor: "bg-amber-500",
      hoverAccentColor: "bg-amber-400",
    },
  ];
  
  const SLIDE_DURATION = 8000;

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const stopAutoPlay = () => {
    clearInterval(autoPlayIntervalRef.current);
    clearInterval(progressIntervalRef.current);
    setIsAutoPlaying(false);
  };

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    setIsAutoPlaying(true);
    setProgress(1); 
    
    autoPlayIntervalRef.current = setInterval(nextSlide, SLIDE_DURATION);
    
    progressIntervalRef.current = setInterval(() => {
        setProgress(p => p + 100 / (SLIDE_DURATION / 100));
    }, 100);

  }, [nextSlide]);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay]);

  useEffect(() => {
    setProgress(0);
    if(isAutoPlaying) {
        startAutoPlay();
    }
  }, [currentSlide]);


  const handleInteractionStart = () => {
    if (isAutoPlaying) {
      stopAutoPlay();
    }
  };

  const handleInteractionEnd = () => {
    if (!isAutoPlaying) {
      setTimeout(startAutoPlay, 3000);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    handleInteractionStart();
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX.current;
    if (Math.abs(distance) > 50) { 
      if (distance < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    handleInteractionEnd();
  };

  return (
    <div 
      className="relative w-full max-w-auto h-[450px] md:h-[650px] overflow-hidden shadow-2xl bg-gray-900 font-sans"
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Background Image with Ken Burns Effect */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Desktop image */}
            <img
              src={slide.imageDesktop}
              alt={slide.title}
              className={`w-full h-full object-cover hidden md:block transition-transform duration-[${SLIDE_DURATION + 1000}ms] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'}`}
            />
            {/* Mobile image */}
            <img
              src={slide.imageMobile}
              alt={slide.title}
              className={`w-full h-auto object-cover block md:hidden transition-transform duration-[${SLIDE_DURATION + 1000}ms] ease-linear ${index === currentSlide ? 'scale-110' : 'scale-100'}`}
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        </div>
      ))}

      {/* Content and Controls Wrapper */}
      <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8">
        
        {/* Top Controls (Mobile) */}
        <div className="md:hidden flex justify-end space-x-2">
            <button
              onClick={() => isAutoPlaying ? stopAutoPlay() : startAutoPlay()}
              className="p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-colors"
              aria-label={isAutoPlaying ? "Pause" : "Play"}
            >
              {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex items-center">
            <div className="w-full md:w-1/2 lg:w-2/5">
                {slides.map((slide, index) => (
                    <div key={index} className={`transition-all duration-700 ease-out ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between">
            {/* Navigation Dots */}
            <div className="flex space-x-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-6 h-1.5 rounded-full transition-colors duration-300 ${index === currentSlide ? slides[currentSlide].accentColor : 'bg-white/30 hover:bg-white/50'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Desktop Arrow Controls */}
            <div className="hidden md:flex items-center space-x-3">
                 <button
                    onClick={() => isAutoPlaying ? stopAutoPlay() : startAutoPlay()}
                    className="p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-colors"
                    aria-label={isAutoPlaying ? "Pause" : "Play"}
                 >
                    {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-colors"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-black/30 text-white/80 hover:bg-black/50 transition-colors"
                    aria-label="Next slide"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
      </div>
        
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div
          className={`h-full ${slides[currentSlide].accentColor} transition-all duration-100 ease-linear`}
          style={{ width: `${isAutoPlaying ? progress : 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HeroBanner;