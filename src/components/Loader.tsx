import React from 'react';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-2 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        {/* Center icon */}
        <span className="material-symbols-outlined text-primary text-3xl animate-pulse">skull</span>
      </div>
    </div>
  );
}
