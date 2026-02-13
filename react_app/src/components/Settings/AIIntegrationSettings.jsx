import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

const AIIntegrationSettings = () => {
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | validating | valid | invalid

  const handleSave = async () => {
    if (!apiKey.trim() || !modelName.trim()) return;
    setStatus('validating');

    // TODO: Replace with real API validation call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const isValid = apiKey.trim().length >= 8;

    setStatus(isValid ? 'valid' : 'invalid');
  };

  const statusConfig = {
    validating: null,
    valid: { text: 'API key is valid and saved.', color: 'text-green-400', Icon: CheckCircle },
    invalid: { text: 'Invalid API key. Please check and try again.', color: 'text-red-400', Icon: XCircle },
  };

  const info = statusConfig[status];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-1">AI Integration</h2>
        <p className="text-gray-400 text-sm">Configure your API key for the AI-powered hint sidebar chat.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="model-name" className="block text-sm font-medium text-gray-300">
          Model Name
        </label>
        <input
          id="model-name"
          type="text"
          value={modelName}
          onChange={(e) => {
            setModelName(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="e.g. GPT-4, Claude, Gemini"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300">
          API Key
        </label>
        <div className="relative">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="Enter your API key"
            className={`w-full px-4 py-3 rounded-xl bg-gray-800/50 border text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300 pr-12 ${
              status === 'valid' ? 'border-green-500/50' : status === 'invalid' ? 'border-red-500/50' : 'border-gray-700'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {info && (
          <div className={`flex items-center gap-2 mt-2 text-sm ${info.color}`}>
            <info.Icon className="w-4 h-4" />
            <span>{info.text}</span>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!apiKey.trim() || !modelName.trim() || status === 'validating'}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'validating' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'validating' ? 'Validating...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default AIIntegrationSettings;
