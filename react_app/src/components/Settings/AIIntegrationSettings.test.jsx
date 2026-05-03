import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { auth } from '@/utils/firebase';
import AIIntegrationSettings from './AIIntegrationSettings';

const USER = { uid: 'user-123' };

const mockUser = () => ({
  uid: 'user-123',
  getIdToken: jest.fn().mockResolvedValue('id-token'),
});

const okJson = (data) => Promise.resolve({
  ok: true,
  status: 200,
  json: async () => data,
});

const errJson = (status, data = {}) => Promise.resolve({
  ok: false,
  status,
  json: async () => data,
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  auth.currentUser = mockUser();
  global.fetch = jest.fn();
});

afterEach(() => {
  console.error.mockRestore();
  delete global.fetch;
  auth.currentUser = null;
});

describe('AIIntegrationSettings — loading saved keys', () => {
  test('loads and displays saved keys on mount', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([
          { id: 1, label: 'OpenAI', model_name: 'gpt-4', api_key_masked: 'sk-***1234' },
          { id: 2, label: 'Groq', model_name: 'llama-3', api_key_masked: 'gr-***abcd' },
        ]);
      }
      return errJson(404);
    });

    render(<AIIntegrationSettings user={USER} />);

    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Groq')).toBeInTheDocument();
    expect(screen.getByText('sk-***1234')).toBeInTheDocument();
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  test('renders nothing in saved-keys area when API returns empty array', async () => {
    global.fetch.mockResolvedValue(await okJson([]));

    render(<AIIntegrationSettings user={USER} />);

    // Wait for the loading spinner text to disappear
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('savedKeys')).not.toBeInTheDocument();
  });

  test('handles fetch failure on mount without crashing', async () => {
    global.fetch.mockRejectedValue(new Error('network down'));

    render(<AIIntegrationSettings user={USER} />);

    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });
    // Form should still render
    expect(screen.getByLabelText('baseUrl')).toBeInTheDocument();
  });
});

describe('AIIntegrationSettings — save flow', () => {
  beforeEach(() => {
    // Default: empty saved-keys list on mount
    global.fetch.mockImplementation((url) => {
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([]);
      }
      return errJson(404);
    });
  });

  test('Save button disabled until all three fields are filled', async () => {
    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: 'save' });
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByLabelText('apiKey'), 'sk-123');
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByLabelText('modelName'), 'gpt-4');
    expect(saveBtn).not.toBeDisabled();
  });

  test('successful save: validates, persists, clears fields, refreshes list', async () => {
    let getCount = 0;
    global.fetch.mockImplementation((url, opts) => {
      const method = opts?.method || 'GET';
      if (url.endsWith('/validate-key')) {
        return okJson({ valid: true });
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`) && method === 'PUT') {
        return okJson({ ok: true });
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`) && method === 'GET') {
        getCount += 1;
        return okJson(getCount > 1
          ? [{ id: 9, label: 'New', model_name: 'gpt-4', api_key_masked: 'sk-***xxxx' }]
          : []);
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    await user.type(screen.getByLabelText('apiKey'), 'sk-123');
    await user.type(screen.getByLabelText('modelName'), 'gpt-4');

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('apiKeyValid')).toBeInTheDocument();
    // Fields cleared
    expect(screen.getByLabelText('baseUrl')).toHaveValue('');
    expect(screen.getByLabelText('apiKey')).toHaveValue('');
    expect(screen.getByLabelText('modelName')).toHaveValue('');
    // Saved keys list refreshed
    expect(await screen.findByText('New')).toBeInTheDocument();
  });

  test('invalid key: shows error from server, does NOT call PUT', async () => {
    const calls = [];
    global.fetch.mockImplementation((url, opts) => {
      calls.push({ url, method: opts?.method || 'GET' });
      if (url.endsWith('/validate-key')) {
        return okJson({ valid: false, error: 'bad key' });
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([]);
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    await user.type(screen.getByLabelText('apiKey'), 'sk-bad');
    await user.type(screen.getByLabelText('modelName'), 'gpt-4');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('bad key')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  test('PUT failure shows the failedToSaveApiKey error', async () => {
    global.fetch.mockImplementation((url, opts) => {
      const method = opts?.method || 'GET';
      if (url.endsWith('/validate-key')) {
        return okJson({ valid: true });
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`) && method === 'PUT') {
        return errJson(500);
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([]);
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    await user.type(screen.getByLabelText('apiKey'), 'sk-ok');
    await user.type(screen.getByLabelText('modelName'), 'gpt-4');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('failedToSaveApiKey')).toBeInTheDocument();
  });

  test('validate fetch rejects: shows error fallback', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.endsWith('/validate-key')) {
        return Promise.reject(new Error('boom'));
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([]);
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    await user.type(screen.getByLabelText('apiKey'), 'sk-x');
    await user.type(screen.getByLabelText('modelName'), 'gpt-4');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('boom')).toBeInTheDocument();
  });

  test('editing a field after a status resets the status to idle', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.endsWith('/validate-key')) {
        return okJson({ valid: false, error: 'bad' });
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys`)) {
        return okJson([]);
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);
    await waitFor(() => {
      expect(screen.queryByText('loadingSavedKeys')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('baseUrl'), 'https://api.example.com');
    await user.type(screen.getByLabelText('apiKey'), 'sk-bad');
    await user.type(screen.getByLabelText('modelName'), 'gpt-4');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('bad')).toBeInTheDocument();

    // Edit a field — status should reset
    await user.type(screen.getByLabelText('apiKey'), 'X');
    await waitFor(() => {
      expect(screen.queryByText('bad')).not.toBeInTheDocument();
    });
  });
});

describe('AIIntegrationSettings — delete flow', () => {
  test('successful delete removes key from the list', async () => {
    let listAfterDelete = false;
    global.fetch.mockImplementation((url, opts) => {
      const method = opts?.method || 'GET';
      if (url.endsWith(`/users/${USER.uid}/api-keys`) && method === 'GET') {
        return okJson([
          { id: 1, label: 'OpenAI', model_name: 'gpt-4', api_key_masked: 'sk-***1234' },
        ]);
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys/1`) && method === 'DELETE') {
        listAfterDelete = true;
        return okJson({ ok: true });
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);

    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    await user.click(screen.getByTitle('deleteApiKey'));

    await waitFor(() => {
      expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
    });
    expect(listAfterDelete).toBe(true);
  });

  test('delete network failure leaves the key in the list', async () => {
    global.fetch.mockImplementation((url, opts) => {
      const method = opts?.method || 'GET';
      if (url.endsWith(`/users/${USER.uid}/api-keys`) && method === 'GET') {
        return okJson([
          { id: 1, label: 'OpenAI', model_name: 'gpt-4', api_key_masked: 'sk-***1234' },
        ]);
      }
      if (url.endsWith(`/users/${USER.uid}/api-keys/1`) && method === 'DELETE') {
        return Promise.reject(new Error('net down'));
      }
      return errJson(404);
    });

    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);

    expect(await screen.findByText('OpenAI')).toBeInTheDocument();
    await user.click(screen.getByTitle('deleteApiKey'));

    // Settle: key stays
    await waitFor(() => {});
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });
});

describe('AIIntegrationSettings — UI bits', () => {
  beforeEach(() => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
  });

  test('toggle reveals/hides the API key field', async () => {
    const user = userEvent.setup();
    render(<AIIntegrationSettings user={USER} />);

    const apiKey = screen.getByLabelText('apiKey');
    expect(apiKey).toHaveAttribute('type', 'password');

    const toggle = apiKey.parentElement.querySelector('button');
    await user.click(toggle);
    expect(apiKey).toHaveAttribute('type', 'text');

    await user.click(toggle);
    expect(apiKey).toHaveAttribute('type', 'password');
  });

  test('does nothing on mount when user has no uid', () => {
    render(<AIIntegrationSettings user={undefined} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
