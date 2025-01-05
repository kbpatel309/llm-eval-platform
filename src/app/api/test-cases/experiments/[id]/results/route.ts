import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const results = await prisma.testCaseResult.findMany({
        where: {
          experimentRun: {
            experimentId: params.id
          }
        },
        include: {
          evaluationResult: true
        }
      });
      return NextResponse.json(results);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }
  }