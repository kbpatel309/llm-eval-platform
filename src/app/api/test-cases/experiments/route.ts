import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { z } from 'zod';

const ExperimentSchema = z.object({
    name: z.string().min(1),
    systemPrompt: z.string().min(1),
    llmModelId: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const body = ExperimentSchema.parse(json)

        const experiment = await prisma.experiment.create({
            data: body,
            include: {
                llmModel: true,
            },
        })

        return NextResponse.json(experiment)
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        )
    }
}

export async function GET() {
    try {
        const experiments = await prisma.experiment.findMany({
            include: {
                llmModel: true,
                experimentTestCases: {
                    include: {
                        testCase: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json(experiments)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch experiments' },
            { status: 500 }
        )
    }
}