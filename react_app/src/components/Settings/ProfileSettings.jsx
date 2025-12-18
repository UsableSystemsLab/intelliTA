import React from 'react';
import { Camera, User, FileText } from 'lucide-react';

const ProfileSettings = ({ user }) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center space-x-4 mb-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-blue-500 transition-colors">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                <User size={40} />
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Profile Picture</h2>
          <p className="text-sm text-gray-400 mt-1">PNG, JPG</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4" />
            Display Name
          </label>
          <input
            type="text"
            defaultValue={user?.displayName || ''}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Bio
          </label>
          <textarea
            rows="4"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 resize-none"
            placeholder="Tell us a little bit about yourself..."
          ></textarea>
          <p className="text-xs text-gray-500 text-right">0 / 500 characters</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
