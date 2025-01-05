import { OpenAI } from 'openai';
import { z } from 'zod';

const EvaluationResultSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  categories: z.object({
    accuracy: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
  }),
  suggestion: z.string().optional(),
});

type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export class LLMEvaluator {
  private client: OpenAI;
  private evaluationPrompt: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.evaluationPrompt = `You are an expert evaluator for language model responses. Your task is to evaluate how well a given response matches the expected output. 

Evaluate the response based on:
1. Accuracy (0-100): How factually correct and accurate is the response?
2. Completeness (0-100): How completely does it address all aspects of the expected output?
3. Relevance (0-100): How relevant is the response to the original question?

Provide your evaluation in the following JSON format:
{
  "score": <overall_score_0_to_100>,
  "reasoning": "<detailed explanation of your evaluation>",
  "categories": {
    "accuracy": <accuracy_score>,
    "completeness": <completeness_score>,
    "relevance": <relevance_score>
  },
  "suggestion": "<optional suggestion for improvement>"
}`;
  }

  async evaluate(
    expectedOutput: string,
    actualResponse: string,
    userMessage: string,
    context?: string
  ): Promise<EvaluationResult> {
    const evaluationMessage = `
Original Question: ${userMessage}

${context ? `Context: ${context}\n` : ''}
Expected Output: ${expectedOutput}

Actual Response: ${actualResponse}

Evaluate the actual response against the expected output.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.evaluationPrompt },
          { role: 'user', content: evaluationMessage }
        ],
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      if (!result) throw new Error('No evaluation result received');

      // Parse and validate the response
      const parsedResult = EvaluationResultSchema.parse(JSON.parse(result));
      return parsedResult;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid evaluation format: ${error.message}`);
      }
      throw new Error(`Evaluation failed: ${error}`);
    }
  }
}
