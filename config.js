// Configuration management
class Config {
  constructor() {
    this.apiKey = this.loadApiKey();
  }

  loadApiKey() {
    // Try to load from environment variable first
    if (typeof process !== 'undefined' && process.env.GROQ_API_KEY) {
      return process.env.GROQ_API_KEY;
    }
    
    // For browser environment, try localStorage
    if (typeof localStorage !== 'undefined') {
      const storedKey = localStorage.getItem('groq_api_key');
      if (storedKey) {
        return storedKey;
      }
    }
    
    return null;
  }

  saveApiKey(key) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('groq_api_key', key);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  async promptForApiKey() {
    const key = prompt('Введите Groq API Key для ИИ-анализа:');
    if (key && key.trim()) {
      this.apiKey = key.trim();
      this.saveApiKey(this.apiKey);
      return this.apiKey;
    }
    return null;
  }

  hasApiKey() {
    return !!this.apiKey;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = Config;
} else {
  // Browser environment
  window.Config = Config;
}
