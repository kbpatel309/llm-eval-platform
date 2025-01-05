import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const experimentRun = await prisma.experimentRun.create({
            data: {
                experimentId: params.id,
            },
        })

        const experimentTestCases = await prisma.experimentTestCase.findMany({
            where: {
                experimentId: params.id,
            },
            include: {
                testCase: true,
            },
        })

        const testCaseResults = await Promise.all(
            experimentTestCases.map(async (etc) => {
                const mockLLMResponse = `Mock response for test case ${etc.testCase.userMessage}`

                return prisma.testCaseResult.create({
                    data: {
                        experimentRunId: experimentRun.id,
                        testCaseId: etc.testCaseId,
                        llmResponse: mockLLMResponse,
                        score: Math.random() * 100,
                        executionTimeMs: Math.floor(Math.random() * 1000),
                    }
                })
            })
        )

        const averageScore = testCaseResults.reduce((acc, curr) => acc + curr.score, 0) / testCaseResults.length

        const updatedRun = await prisma.experimentRun.update({
            where: { id: experimentRun.id },
            data: {
                aggregateScore: averageScore,
                completedAt: new Date(),
            },
            include: {
                testCaseResults: true,
            },
        })

        return NextResponse.json(updatedRun)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to run experiment' },
            { status: 500 }
        )
    }
}