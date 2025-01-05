import { LLMProvider, LLMResponse } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { prisma } from "lib/prisma";

export class LLMService {
    private providers: Map<string, LLMProvider>;

    constructor() {
        this.providers = new Map();
    }

    async initializeProviders(){
        const llmModels = await prisma.lLModel.findMany();

        for (const model of llmModels) {
            const config = model.apiConfiguration as { apiKey: string };

            switch (model.provider.toLowerCase()) {
                case 'openai':
                    this.providers.set(
                        model.id,
                        new OpenAIProvider(config.apiKey, model.modelVersion)
                    );
                    break;
                case 'anthropic':
                    this.providers.set(
                        model.id,
                        new AnthropicProvider(config.apiKey, model.modelVersion)
                    );
                    break;
            }
        }
    }

    async runExperiment(experimentId: string): Promise<void> {
        const experiment = await prisma.experiment.findUnique({
            where: { id: experimentId },
            include: {
                llmModel: true,
                experimentTestCases: {
                    include: { testCase: true }
                }
            }
        });

        if (!experiment) throw new Error('Experiment not found');

        const provider = this.providers.get(experiment.llmModelId);
        if (!provider) throw new Error('LLM provider not configured');

        const experimentRun = await prisma.experimentRun.create({
            data: { experimentId }
        });

        try {
            const results = await Promise.all(
                experiment.experimentTestCases.map(async (etc) => {
                    const response = await provider.generateResponse(
                        experiment.systemPrompt,
                        etc.testCase.userMessage
                    );

                    const score = await this.calculateScore(
                        etc.testCase.graderType,
                        response.content,
                        etc.testCase.expectedOutput
                    );

                    return prisma.testCaseResult.create({
                        data: {
                            experimentRunId: experimentRun.id,
                            testCaseId: etc.testCase.id,
                            llmResponse: response.content,
                            score,
                            executionTimeMs: response.executionTimeMs
                        }
                    });
                })
            );

            const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
            await prisma.experimentRun.update({
                where: { id: experimentRun.id },
                data: {
                    aggregateScore: avgScore,
                    completedAt: new Date()
                }
            });
        } catch (error) {
            await prisma.experimentRun.update({
                where: { id: experimentRun.id },
                data: { completedAt: new Date() }
            });
            throw error;
        }
    }

    private async calculateScore(
        graderType: string,
        response: string,
        expected: string
    ): Promise<number> {
        switch (graderType) {
            case 'exact_match':
                return response === expected ? 100 : 0;

            case 'partial_match':
                return this.calculatePartialMatch(response, expected);

            case 'llm_match':
                return await this.evaluateWithLLM(response, expected);

            default:
                throw new Error(`Unknown grader type: ${graderType}`);
        }
    }

    private calculatePartialMatch(response: string, expected: string): number {
        const responseWords = new Set(response.toLowerCase().split(/\s+/));
        const expectedWords = new Set(response.toLowerCase().split(/\s+/));
        const intersection = new Set(
            [...responseWords].filter(word => expectedWords.has(word))
        );
        return (intersection.size / expectedWords.size) * 100;
    }

    private async evaluateWithLLM(
        response: string,
        expected: string
    ): Promise<number> {
        return 0;
    }
}