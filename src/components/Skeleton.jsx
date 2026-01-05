import React from 'react';

const Skeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[...Array(count)].map((_, index) => (
        <div 
          key={index} 
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
        >
          {/* Image Placeholder */}
          <div className="aspect-[4/5] bg-gray-200 rounded-xl w-full mb-5 relative overflow-hidden">
            {/* Optional: Shimmer effect overlay could go here, but animate-pulse handles most of it */}
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            {/* Title Line */}
            <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
            
            {/* Rating Stars Placeholder */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded-full"></div>
              ))}
            </div>

            {/* Price and Button Row */}
            <div className="flex items-end justify-between mt-6">
              <div className="flex flex-col gap-2 w-1/3">
                {/* Price Label */}
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                {/* Price Value */}
                <div className="h-7 bg-gray-200 rounded w-full"></div>
              </div>
              
              {/* Cart Button Placeholder */}
              <div className="w-11 h-11 bg-gray-200 rounded-xl shadow-sm"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;