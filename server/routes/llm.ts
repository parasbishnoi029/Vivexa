import express from 'express';
import { llmRouter, LLMRequestOptions } from '../services/llmRouter';

export const llmApiRouter = express.Router();

// 1. Get Available LLM Providers & Sovereignty Status
llmApiRouter.get('/providers', (req, res) => {
  return res.json({
    success: true,
    providers: [
      {
        id: 'GEMINI',
        name: 'Google Gemini 2.5 / 1.5',
        type: 'CLOUD',
        defaultModel: 'gemini-2.5-flash',
        sovereigntySupport: false,
        status: process.env.GEMINI_API_KEY ? 'ACTIVE' : 'READY_KEY_CONFIGURED'
      },
      {
        id: 'AZURE_OPENAI',
        name: 'Azure OpenAI GPT-4o Enterprise',
        type: 'PRIVATE_CLOUD',
        defaultModel: 'gpt-4o',
        sovereigntySupport: true,
        status: 'ACTIVE'
      },
      {
        id: 'CLAUDE',
        name: 'Anthropic Claude 3.5 Sonnet',
        type: 'CLOUD',
        defaultModel: 'claude-3-5-sonnet-20241022',
        sovereigntySupport: false,
        status: 'ACTIVE'
      },
      {
        id: 'OLLAMA_LOCAL',
        name: 'Self-Hosted Llama 3 / DeepSeek R1 (Ollama)',
        type: 'ON_PREMISE_AIRGAPPED',
        defaultModel: 'llama3:latest',
        sovereigntySupport: true,
        status: 'ACTIVE'
      }
    ],
    defaultProvider: 'GEMINI'
  });
});

// 2. Generate Completion via LLM Router
llmApiRouter.post('/generate', async (req, res) => {
  try {
    const options: LLMRequestOptions = req.body;
    if (!options.prompt) {
      return res.status(400).json({ success: false, error: 'Prompt text is required.' });
    }

    const response = await llmRouter.generateCompletion(options);
    return res.json({ success: true, response });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'LLM completion failed.' });
  }
});
