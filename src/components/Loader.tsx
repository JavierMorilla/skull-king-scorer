import React from 'react';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-4 border-dashed border-[#fabd04]/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-2 border-4 border-[#fabd04] rounded-full border-t-transparent animate-spin"></div>
        {/* Center icon */}
        <span className="material-symbols-outlined text-[#fabd04] text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
          skull
        </span>
      </div>
    </div>
  );
}
