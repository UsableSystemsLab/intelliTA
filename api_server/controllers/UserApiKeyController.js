import { User, UserApiKey } from "../models/index.js";

function generateLabel(baseUrl) {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    if (hostname.includes("openai")) return "OpenAI";
    if (hostname.includes("groq")) return "Groq";
    if (hostname.includes("together")) return "Together AI";
    if (hostname.includes("openrouter")) return "OpenRouter";
    if (hostname.includes("mistral")) return "Mistral";
    if (hostname.includes("anthropic")) return "Anthropic";
    if (hostname.includes("deepseek")) return "DeepSeek";

    return hostname.replace(/^api\./, "").split(".")[0];
  } catch {
    return baseUrl;
  }
}

function maskKey(key) {
  if (!key || key.length < 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

const UserApiKeyController = {
  async saveOrUpdate(req, res) {
    try {
      const { firebaseUid } = req.params;
      const { base_url, api_key, model_name } = req.body;

      if (!base_url || !api_key || !model_name) {
        return res.status(400).json({ message: "base_url, api_key, and model_name are required" });
      }

      const user = await User.findOne({ where: { firebaseId: firebaseUid } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const label = generateLabel(base_url);

      const [entry, created] = await UserApiKey.findOrCreate({
        where: { user_id: user.id, base_url },
        defaults: { api_key, model_name, label },
      });

      if (!created) {
        await entry.update({ api_key, model_name, label });
      }

      res.status(200).json({
        id: entry.id,
        base_url: entry.base_url,
        model_name: entry.model_name,
        label: entry.label,
        api_key_masked: maskKey(entry.api_key),
      });
    } catch (error) {
      res.status(500).json({ message: "Error saving API key", error: error.message });
    }
  },

  async getByFirebaseUid(req, res) {
    try {
      const { firebaseUid } = req.params;

      const user = await User.findOne({ where: { firebaseId: firebaseUid } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const keys = await UserApiKey.findAll({
        where: { user_id: user.id },
        order: [["created_at", "ASC"]],
      });

      const result = keys.map((k) => ({
        id: k.id,
        base_url: k.base_url,
        model_name: k.model_name,
        label: k.label,
        api_key_masked: maskKey(k.api_key),
      }));

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching API keys", error: error.message });
    }
  },

  async deleteKey(req, res) {
    try {
      const { firebaseUid, id } = req.params;

      const user = await User.findOne({ where: { firebaseId: firebaseUid } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const deleted = await UserApiKey.destroy({
        where: { id, user_id: user.id },
      });

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "API key not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting API key", error: error.message });
    }
  },

  async getRawKey(req, res) {
    try {
      const { firebaseUid, id } = req.params;

      const user = await User.findOne({ where: { firebaseId: firebaseUid } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entry = await UserApiKey.findOne({
        where: { id, user_id: user.id },
      });

      if (!entry) {
        return res.status(404).json({ message: "API key not found" });
      }

      res.status(200).json({
        api_key: entry.api_key,
        base_url: entry.base_url,
        model_name: entry.model_name,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching raw key", error: error.message });
    }
  },
};

export default UserApiKeyController;
