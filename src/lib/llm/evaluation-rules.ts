// lib/llm/evaluation-rules.ts
export interface EvaluationRule {
    name: string;
    weight: number;
    evaluate: (result: z.infer<typeof EvaluationResultSchema>) => number;
  }
  
  export const defaultEvaluationRules: EvaluationRule[] = [
    {
      name: 'balanced-scoring',
      weight: 1,
      evaluate: (result) => {
        const { accuracy, completeness, relevance } = result.categories;
        return (accuracy + completeness + relevance) / 3;
      }
    },
    {
      name: 'accuracy-focused',
      weight: 1.5,
      evaluate: (result) => {
        const { accuracy, completeness, relevance } = result.categories;
        return (accuracy * 0.6) + (completeness * 0.2) + (relevance * 0.2);
      }
    },
    {
      name: 'minimum-threshold',
      weight: 1,
      evaluate: (result) => {
        const { accuracy, completeness, relevance } = result.categories;
        // Fail if any category is below 50
        if (accuracy < 50 || completeness < 50 || relevance < 50) {
          return 0;
        }
        return result.score;
      }
    }
  ];
  
  // Update the LLMService class to use the new evaluator
  export class LLMService {
    private evaluator: LLMEvaluator;
    private evaluationRules: EvaluationRule[];
  
    constructor(
      evaluationApiKey: string,
      rules: EvaluationRule[] = defaultEvaluationRules
    ) {
      this.evaluator = new LLMEvaluator(evaluationApiKey);
      this.evaluationRules = rules;
    }
  
    private async evaluateWithLLM(
      response: string,
      expected: string,
      userMessage: string
    ): Promise<number> {
      try {
        const evaluationResult = await this.evaluator.evaluate(
          expected,
          response,
          userMessage
        );
  
        // Apply all evaluation rules and calculate weighted average
        const totalWeight = this.evaluationRules.reduce(
          (sum, rule) => sum + rule.weight,
          0
        );
  
        const weightedScore = this.evaluationRules.reduce((sum, rule) => {
          const ruleScore = rule.evaluate(evaluationResult);
          return sum + (ruleScore * rule.weight);
        }, 0);
  
        // Store detailed evaluation results
        await prisma.evaluationResult.create({
          data: {
            rawScore: evaluationResult.score,
            weightedScore: weightedScore / totalWeight,
            reasoning: evaluationResult.reasoning,
            accuracyScore: evaluationResult.categories.accuracy,
            completenessScore: evaluationResult.categories.completeness,
            relevanceScore: evaluationResult.categories.relevance,
            suggestion: evaluationResult.suggestion,
            // Add appropriate foreign keys and timestamps
          }
        });
  
        return weightedScore / totalWeight;
      } catch (error) {
        console.error('Evaluation failed:', error);
        // Fallback to simpler evaluation method
        return this.calculatePartialMatch(response, expected);
      }
    }
  }