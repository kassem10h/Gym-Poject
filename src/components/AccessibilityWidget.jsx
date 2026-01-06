import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ZoomIn, Type, X, Accessibility } from 'lucide-react';

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isReading, setIsReading] = useState(false);
  const [magnifierEnabled, setMagnifierEnabled] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const magnifierRef = useRef(null);

  // Text-to-Speech functionality
  const toggleReading = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else {
      const textContent = document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsReading(false);
      window.speechSynthesis.speak(utterance);
      setIsReading(true);
    }
  };

  // Font size adjustment
  const adjustFontSize = (increase) => {
    const newSize = increase ? fontSize + 10 : fontSize - 10;
    if (newSize >= 80 && newSize <= 150) {
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
    }
  };

  // Magnifier functionality
  useEffect(() => {
    if (!magnifierEnabled) return;

    const handleMouseMove = (e) => {
      setMagnifierPos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [magnifierEnabled]);

  const resetAccessibility = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = '100%';
    setMagnifierEnabled(false);
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  };

  return (
    <>
      {/* Main Toggle Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Toggle Accessibility Menu"
        >
          <Accessibility size={24} />
        </button>
      </div>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 bg-white rounded-lg shadow-2xl p-6 z-50 w-80 border-2 border-blue-600">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Accessibility Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close accessibility menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Text to Speech */}
          <div className="mb-4">
            <button
              onClick={toggleReading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isReading
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              aria-label={isReading ? 'Stop reading' : 'Start reading page'}
            >
              <Volume2 size={20} />
              <span className="font-medium">
                {isReading ? 'Stop Reading' : 'Read Page Aloud'}
              </span>
            </button>
          </div>

          {/* Font Size Control */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Type size={18} />
              Text Size: {fontSize}%
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => adjustFontSize(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-bold transition-colors"
                disabled={fontSize <= 80}
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button
                onClick={() => adjustFontSize(true)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-bold transition-colors"
                disabled={fontSize >= 150}
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Magnifier Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setMagnifierEnabled(!magnifierEnabled)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                magnifierEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              aria-label={magnifierEnabled ? 'Disable magnifier' : 'Enable magnifier'}
            >
              <ZoomIn size={20} />
              <span className="font-medium">
                {magnifierEnabled ? 'Magnifier: ON' : 'Screen Magnifier'}
              </span>
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetAccessibility}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            aria-label="Reset all accessibility settings"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Magnifier Lens */}
      {magnifierEnabled && (
        <div
          ref={magnifierRef}
          className="fixed pointer-events-none border-4 border-blue-500 rounded-full overflow-hidden shadow-2xl"
          style={{
            width: '200px',
            height: '200px',
            left: `${magnifierPos.x - 100}px`,
            top: `${magnifierPos.y - 100}px`,
            zIndex: 9999,
            background: `url(${window.location.href})`,
            backgroundPosition: `${-magnifierPos.x * 2 + 100}px ${-magnifierPos.y * 2 + 100}px`,
            backgroundSize: `${window.innerWidth * 2}px ${window.innerHeight * 2}px`,
          }}
        />
      )}
    </>
  );
};

export default AccessibilityWidget;