import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { API_BASE as NODE_API_URL, LLM_BASE as LLM_SERVER_URL, getAuthHeaders } from '../../config/api';
import { auth } from '@/utils/firebase.js';

const AIIntegrationSettings = ({ user }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | validating | valid | invalid
  const [errorMsg, setErrorMsg] = useState('');
  const [savedKeys, setSavedKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved keys on mount
  useEffect(() => {
    if (!user?.uid) return;
    loadSavedKeys();
  }, [user?.uid]);

  const loadSavedKeys = async () => {
    try {
      const res = await fetch(`${NODE_API_URL}/users/${user.uid}/api-keys`, {
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (res.ok) {
        setSavedKeys(await res.json());
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!baseUrl.trim() || !apiKey.trim() || !modelName.trim()) return;
    setStatus('validating');
    setErrorMsg('');

    try {
      // Step 1: Validate key via LLM server
      const validateRes = await fetch(`${LLM_SERVER_URL}/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: baseUrl.trim(),
          api_key: apiKey.trim(),
          model_name: modelName.trim(),
        }),
      });

      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setStatus('invalid');
        setErrorMsg(validateData.error || 'Invalid API key or model.');
        return;
      }

      // Step 2: Save to DB via Node API
      const saveRes = await fetch(`${NODE_API_URL}/users/${user.uid}/api-keys`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...await getAuthHeaders(auth.currentUser) },
        body: JSON.stringify({
          base_url: baseUrl.trim(),
          api_key: apiKey.trim(),
          model_name: modelName.trim(),
        }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save API key');
      }

      setStatus('valid');
      setBaseUrl('');
      setApiKey('');
      setModelName('');
      await loadSavedKeys();
    } catch (err) {
      setStatus('invalid');
      setErrorMsg(err.message || 'Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${NODE_API_URL}/users/${user.uid}/api-keys/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(auth.currentUser),
      });
      if (res.ok) {
        setSavedKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const resetStatus = () => {
    if (status !== 'idle') {
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const statusConfig = {
    validating: null,
    valid: { text: 'API key is valid and saved.', color: 'text-green-400', Icon: CheckCircle },
    invalid: { text: errorMsg || 'Invalid API key. Please check and try again.', color: 'text-red-400', Icon: XCircle },
  };

  const info = statusConfig[status];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-1">AI Integration</h2>
        <p className="text-gray-400 text-sm">Configure external AI models for the hint sidebar chat.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm text-gray-300 leading-relaxed">
          <p className="mb-1">
            Connect any <span className="text-blue-400 font-medium">OpenAI-compatible</span> provider
            (OpenAI, Groq, OpenRouter, etc.) to power the
            <span className="text-blue-400 font-medium"> Hint Chat</span> in activities.
          </p>
          <p className="text-gray-400">
            Enter the provider's base URL, your API key, and the model name. Your key will be validated before saving.
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <label htmlFor="base-url" className="block text-sm font-medium text-gray-300">
          Base URL
        </label>
        <input
          id="base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => { setBaseUrl(e.target.value); resetStatus(); }}
          placeholder="e.g. https://api.openai.com/v1"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300">
          API Key
        </label>
        <div className="relative">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); resetStatus(); }}
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
      </div>

      {/* Model Name */}
      <div className="space-y-2">
        <label htmlFor="model-name" className="block text-sm font-medium text-gray-300">
          Model Name
        </label>
        <input
          id="model-name"
          type="text"
          value={modelName}
          onChange={(e) => { setModelName(e.target.value); resetStatus(); }}
          placeholder="e.g. gpt-4o, llama-3.3-70b-versatile"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300"
        />
      </div>

      {/* Status message */}
      {info && (
        <div className={`flex items-center gap-2 text-sm ${info.color}`}>
          <info.Icon className="w-4 h-4" />
          <span>{info.text}</span>
        </div>
      )}

      {/* Save button */}
      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!baseUrl.trim() || !apiKey.trim() || !modelName.trim() || status === 'validating'}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'validating' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'validating' ? 'Validating...' : 'Save'}
        </button>
      </div>

      {/* Saved keys list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading saved keys...</span>
        </div>
      ) : savedKeys.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Saved API Keys</h3>
          <div className="space-y-2">
            {savedKeys.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-100">{entry.label}</span>
                    <span className="text-xs text-gray-500">{entry.model_name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {entry.api_key_masked}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="ml-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete API key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIIntegrationSettings;
