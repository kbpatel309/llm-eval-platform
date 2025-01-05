import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TestCaseSchema = z.object({
    userMessage: z.string().min(1),
    expectedOutput: z.string().min(1),
    graderType: z.enum(['exact_match', 'llm_match', 'partial_match']),
})

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const body = TestCaseSchema.parse(json)

        const testCase = await prisma.testCase.create({
            data: body,
        })

        return NextResponse.json(testCase)
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        )
    }
}

export async function GET() {
    try {
        const testCases = await prisma.testCase.findMany({
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json(testCases)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch test cases' },
            { status: 500 }
        )
    }
}