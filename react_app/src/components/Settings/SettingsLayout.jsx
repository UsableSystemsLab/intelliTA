import React, { useState } from 'react';
import { User, Shield, PersonStanding , Award, LogOut } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
// a placeholder for possible settings we would have settings
const SecuritySettings = () => <div className="text-gray-400">Didnt do it yet</div>;
const AccessibilitySettings = () => <div className="text-gray-400">Didnt do it yet</div>;
const ProgressSettings = () => <div className="text-gray-400">Didnt do it yet</div>;

import { useTranslation } from 'react-i18next';

const SettingsLayout = ({ user }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  // define menu items so if we want to add new tab we can do it easily
  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User, component: ProfileSettings },
    { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
    { id: 'accessibility', label: 'Accessibility', icon: PersonStanding, component: AccessibilitySettings },
    { id: 'progress', label: 'Progress', icon: Award, component: ProgressSettings },
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || ProfileSettings;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sidebar Navigation */}
      <nav className="lg:w-64 flex-shrink-0">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 top-24">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${activeTab === item.id 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-900/20 border border-blue-500/20' 
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-blue-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Settings
            </h1>
           <p className="text-gray-400 mt-2">Manage your account preferences and view your progress.</p>
        </div>
        
        <div
          key={activeTab}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 md:p-8"
        >
          <ActiveComponent user={user} />
        </div>
      </main>
    </div>
  );
};

export default SettingsLayout;
