import { NextResponse } from "next/server";
import { LLMService } from "lib/llm/llm-service";

const llmService = new LLMService();

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await llmService.initializeProviders();
        await llmService.runExperiment(params.id);
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to run experiment' },
            { status: 500 }
        );
    }
}