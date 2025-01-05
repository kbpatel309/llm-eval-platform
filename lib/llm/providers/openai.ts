import OpenAI from 'openai';
import { LLMProvider, LLMResponse } from '../types';

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model = 'gpt-4-turbo-preview') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async generateResponse(
        systemPrompt: string,
        userMessage: string
    ): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            });

            const executionTimeMs = Date.now() - startTime;

            return {
                content: response.choices[0].message.content || '',
                modelName: this.model,
                executionTimeMs,
                tokensUsed: response.usage?.total_tokens,
                cost: this.calculateCost(response.usage?.total_tokens || 0)
            };
        } catch (error) {
            throw new Error(`OpenAI API error: ${error}`);
        }
    }

    private calculateCost(tokens: number): number {
        const costPer1kTokens = this.model === 'gpt-4-turbo-preview' ? 0.01 : 0.002;
        return (tokens / 1000) * costPer1kTokens
    }
}