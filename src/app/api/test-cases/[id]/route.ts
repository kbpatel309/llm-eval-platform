import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const testCase = await prisma.testCase.findUnique({
            where: { id: params.id },
        })

        if (!testCase) {
            return NextResponse.json(
                { error: 'Test case not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(testCase)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch test case' },
            { status: 500 }
        )
    }
}