import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-opus-20240229') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateResponse(
    systemPrompt: string,
    userMessage: string
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const executionTimeMs = Date.now() - startTime;

      return {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        modelName: this.model,
        executionTimeMs,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
        cost: this.calculateCost(response.usage?.input_tokens || 0, response.usage?.output_tokens || 0)
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error}`);
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Approximate costs - update based on current pricing
    const inputCostPer1k = 0.015;
    const outputCostPer1k = 0.075;
    return ((inputTokens / 1000) * inputCostPer1k) + 
           ((outputTokens / 1000) * outputCostPer1k);
  }
}