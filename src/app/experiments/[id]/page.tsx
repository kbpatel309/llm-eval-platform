import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function ExperimentDetailsPage({ params }: { params: { id: string } }) {
  // Fetch experiment details
  const { data: experiment, isLoading } = useQuery({
    queryKey: ['experiment', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/experiments/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch experiment');
      return res.json();
    },
  });

  // Fetch latest run results
  const { data: results } = useQuery({
    queryKey: ['experiment-results', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/experiments/${params.id}/results`);
      if (!res.ok) throw new Error('Failed to fetch results');
      return res.json();
    },
    enabled: !!experiment?.experimentRuns?.[0],
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Button
        variant="outline"
        onClick={() => window.location.href = '/experiments'}
        className="mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Experiments
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{experiment.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">System Prompt</h3>
              <pre className="mt-2 p-4 bg-gray-100 rounded">
                {experiment.systemPrompt}
              </pre>
            </div>
            <div>
              <h3 className="font-medium">Model Details</h3>
              <div className="mt-2">
                <p>Name: {experiment.llmModel.name}</p>
                <p>Provider: {experiment.llmModel.provider}</p>
                <p>Version: {experiment.llmModel.modelVersion}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Case</TableHead>
                <TableHead>Expected Output</TableHead>
                <TableHead>Actual Response</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Pass/Fail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.testCase.userMessage}</TableCell>
                  <TableCell>{result.testCase.expectedOutput}</TableCell>
                  <TableCell>{result.llmResponse}</TableCell>
                  <TableCell>{result.score.toFixed(2)}%</TableCell>
                  <TableCell>
                    {result.score >= 80 ? (
                      <Check className="text-green-500" />
                    ) : (
                      <X className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}