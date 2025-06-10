import { create } from 'zustand';
import { AIModel, getModelConfig, ModelConfig, AI_MODELS } from '@/lib/models';

// Define the interface for our store
interface ModelStore {
  selectedModel: AIModel;
  setModel: (model: AIModel) => void;
  getModelConfig: () => ModelConfig;
}

// Load the saved model from localStorage if available
const getSavedModel = (): AIModel => {
  if (typeof window === 'undefined') {
    return 'Gemini 2.0 Flash'; // Default for SSR
  }
  
  try {
    const saved = localStorage.getItem('selected-model');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.selectedModel && typeof parsed.selectedModel === 'string') {
        // Validate that it's a valid model
        if (AI_MODELS.includes(parsed.selectedModel)) {
          return parsed.selectedModel as AIModel;
        }
      }
    }
  } catch (error) {
    console.error('Error loading saved model:', error);
  }
  
  // Default model if nothing valid was found
  return 'Gemini 2.0 Flash';
};

// Create the store with a simple implementation
export const useModelStore = create<ModelStore>()((set, get) => ({
  // Initialize with saved value or default
  selectedModel: getSavedModel(),

  // Method to change the selected model
  setModel: (model: AIModel) => {
    set({ selectedModel: model });
    
    // Save to localStorage
    try {
      localStorage.setItem('selected-model', JSON.stringify({ selectedModel: model }));
    } catch (error) {
      console.error('Failed to save model to localStorage:', error);
    }
  },

  // Method to get the configuration for the currently selected model
  getModelConfig: () => {
    const { selectedModel } = get();
    return getModelConfig(selectedModel);
  },
}));

// Handle storage events for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'selected-model' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.selectedModel) {
          // Update the store without triggering another localStorage save
          useModelStore.setState({ selectedModel: parsed.selectedModel });
        }
      } catch (error) {
        console.error('Error syncing model across tabs:', error);
      }
    }
  });
}
