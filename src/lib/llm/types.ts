export interface LLMResponse {
    content: string,
    modelName: string;
    executionTimeMs: number;
    tokensUsed?: number;
    cost?: number;
}

export interface LLMProvider {
    generateResponse(
        systemPrompt: string,
        userMessage: string,
    ): Promise<LLMResponse>;
}