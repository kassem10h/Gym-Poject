import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Minus,
  Check,
  X,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  MessageCircle,
  ArrowLeft,
  Zap,
  Award,
  Users
} from 'lucide-react';

import axios from 'axios';
import Card from '../components/ui/Card';
import createSlug from '../utils/CreateSlug';
import ImageGallery from '../components/ImageGallery';

const API_URL = import.meta.env.VITE_REACT_APP_API;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchSimilarProducts();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  })

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };


  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/products/${id}/similar`);
      setSimilarProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch similar products');
    } finally {
      setLoading(false);
    }
  };


  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copy URL
      navigator.clipboard.writeText(window.location.href);
      alert('Product URL copied to clipboard!');
    }
  };

   const handleContactWhatsApp = async () => {
    const shareData = {
      title: product.title,
      text: `Hi! I'm interested in this product: ${product.title}`,
      url: window.location.href 
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      const message = `${shareData.text}\n${shareData.url}`;
      const whatsappUrl = `https://wa.me/96171545936?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCallNow = () => {
    const phoneNumber = '96171545936';
    window.location.href = `tel:${phoneNumber}`;
  }


  const discountPercentage = product?.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </motion.div>
        </div>
      );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <title>{`${product.title} - Aidiby SmartTech`}</title>
    <meta name="description" content={product.description} />
    {/* Open Graph / Facebook / WhatsApp meta tags */}
    <meta property="og:type" content="product" />
    <meta property="og:title" content={product.title} />
    <meta property="og:description" content={product.description} />
    <meta property="og:image" content={product.images?.[0]} />
    <meta property="og:url" content={window.location.href} />
    <meta property="og:site_name" content="Aidiby SmartTech" />
      
    {/* Twitter Card meta tags */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={product.title} />
    <meta name="twitter:description" content={product.description} />
    <meta name="twitter:image" content={product.images?.[0]} />
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center space-x-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <ChevronRight size={16} className="text-gray-400" />
              <Link
                id='category-link' 
                to={`/products?category=${product.category?.slug}`} 
                className="text-gray-500 hover:text-gray-700"
              >
                {product.category?.name}
              </Link>
              <ChevronRight size={16} className="text-gray-400" />
              <Link 
                id='brand-link'
                to={`/products?category=${product.category?.slug}&brand=${product.brand?.slug}`} 
                className="text-gray-500 hover:text-gray-700"
              >
                {product.brand?.name}
              </Link>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
            </nav>

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Product Details */}
      <ImageGallery product={product} handleCallNow={handleCallNow} handleContactWhatsApp={handleContactWhatsApp} />

     {/*  Similar Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Similar Products</h2>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4 min-w-max">
            {similarProducts && similarProducts.length > 0 ? (
              similarProducts.map((product) => (
                <Link to={`/products/${product.id}/${createSlug(product.title)}`} key={product.id}>
                  <Card
                    id={product.id}
                    image={product.images?.[0]}
                    title={product.title}
                    description={product.description}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    reviewCount={product.reviewCount}
                    category={product.category}
                    brand={product.brand}
                    inStock={product.inStock}
                    isNew={product.isNew}
                    isSale={product.isSale}
                    className="h-full w-64 flex-shrink-0"
                  />
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-500 w-full">
                No similar products found.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default ProductDetails;