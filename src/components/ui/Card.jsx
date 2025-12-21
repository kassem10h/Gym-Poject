import React from 'react';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa";

const Card = ({
  id,
  image,
  title,
  description,
  price,
  originalPrice,
  rating = 0,
  reviewCount = 0,
  category,
  brand,
  inStock = true,
  isNew = false,
  isSale = false,
  onClick,
  onWishlist,
  className = '',
  buttonText = 'Contact Now',
  buttonIcon = <FaWhatsapp size={16} />,
}) => {
  const handleAddToCart = (e) => {
    e.preventDefault();
    onClick?.(id);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    onWishlist?.(id);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={`${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden group ${className}`}>
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-50">
        <img
          src={image}
          alt={title}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
              NEW
            </span>
          )}
          {isSale && discountPercentage > 0 && (
            <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
          {!inStock && (
            <span className="bg-gray-600 text-white text-xs font-medium px-2 py-1 rounded">
              OUT OF STOCK
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Brand */}
        <div className="flex items-center justify-between mb-2">
          {category && (
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {category}
            </span>
          )}
          {brand && (
            <span className="text-xs text-gray-500 font-medium">
              {brand}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1 leading-tight">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {renderStars(rating)}
            </div>
            <span className="text-xs text-gray-500">
              {rating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-xs text-gray-400">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${price.toFixed(2)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
            inStock
              ? 'bg-gray-900 hover:bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {buttonIcon}
          {inStock ? buttonText : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

export default Card;