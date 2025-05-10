'use client';

import React from 'react';
import Icon from '../ui/Icon';

/**
 * Example component showcasing various Lucide icons
 * This demonstrates how to use the Icon component in different ways
 */
const IconExample: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Icon Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic usage */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Basic Icons</h2>
          <div className="flex gap-4">
            <Icon name="Home" />
            <Icon name="Settings" />
            <Icon name="User" />
            <Icon name="Bell" />
          </div>
        </div>

        {/* Custom sizes */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Custom Sizes</h2>
          <div className="flex items-center gap-4">
            <Icon name="Heart" size={16} />
            <Icon name="Heart" size={24} />
            <Icon name="Heart" size={32} />
            <Icon name="Heart" size={48} />
          </div>
        </div>

        {/* Custom colors */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Custom Colors</h2>
          <div className="flex gap-4">
            <Icon name="Star" color="#4f46e5" />
            <Icon name="Star" color="#10b981" />
            <Icon name="Star" color="#ef4444" />
            <Icon name="Star" color="#f59e0b" />
          </div>
        </div>

        {/* Stroke width */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Stroke Width</h2>
          <div className="flex gap-4">
            <Icon name="Circle" strokeWidth={1} />
            <Icon name="Circle" strokeWidth={2} />
            <Icon name="Circle" strokeWidth={3} />
          </div>
        </div>

        {/* With CSS classes */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">With CSS Classes</h2>
          <div className="flex gap-4">
            <Icon name="ArrowRight" className="text-blue-500 hover:text-blue-700 transition-colors" />
            <Icon name="Check" className="text-green-500 hover:scale-125 transition-transform" />
            <Icon name="X" className="text-red-500 hover:rotate-90 transition-transform" />
          </div>
        </div>

        {/* Common UI patterns */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">UI Patterns</h2>
          <div className="space-y-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
              <Icon name="LogIn" size={18} />
              <span>Login</span>
            </button>
            
            <div className="flex items-center gap-2 text-amber-600">
              <Icon name="AlertTriangle" size={18} />
              <span>Warning message</span>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                className="pl-10 pr-4 py-2 border rounded-md w-full" 
                placeholder="Search..." 
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name="Search" size={18} color="#9ca3af" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconExample;
