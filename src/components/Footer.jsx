import { Dumbbell } from 'lucide-react';
const Footer = () => {
  return (
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Dumbbell className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">FitZone</span>
              </div>
              <p className="text-gray-400">
                Transform your body, transform your life.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-blue-400 transition">Home</a></li>
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="/equipment" className="hover:text-blue-400 transition">Equipment</a></li>
                <li><a href="/store" className="hover:text-blue-400 transition">Store</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>123 Fitness Street</li>
                <li>Sidon, Lebanon</li>
                <li>+961 XX XXX XXX</li>
                <li>info@fitzone.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FitZone Gym Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
  );
};

export default Footer;