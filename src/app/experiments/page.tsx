import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, PlayCircle, FileText } from 'lucide-react';

export default function ExperimentsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    systemPrompt: '',
    llmModelId: ''
  });

  // Fetch experiments
  const { data: experiments, isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const res = await fetch('/api/experiments');
      if (!res.ok) throw new Error('Failed to fetch experiments');
      return res.json();
    }
  });

  // Fetch available models
  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await fetch('/api/llm-models');
      if (!res.ok) throw new Error('Failed to fetch models');
      return res.json();
    }
  });

  // Create experiment mutation
  const createExperiment = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create experiment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['experiments']);
      setIsCreating(false);
      setNewExperiment({ name: '', systemPrompt: '', llmModelId: '' });
    },
  });

  // Run experiment mutation
  const runExperiment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/experiments/${id}/run`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to run experiment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['experiments']);
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">LLM Experiments</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Experiment</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createExperiment.mutate(newExperiment);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Experiment Name
                </label>
                <Input
                  value={newExperiment.name}
                  onChange={(e) =>
                    setNewExperiment({ ...newExperiment, name: e.target.value })
                  }
                  placeholder="Enter experiment name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  System Prompt
                </label>
                <Textarea
                  value={newExperiment.systemPrompt}
                  onChange={(e) =>
                    setNewExperiment({
                      ...newExperiment,
                      systemPrompt: e.target.value,
                    })
                  }
                  placeholder="Enter system prompt"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  LLM Model
                </label>
                <select
                  value={newExperiment.llmModelId}
                  onChange={(e) =>
                    setNewExperiment({
                      ...newExperiment,
                      llmModelId: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a model</option>
                  {models?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Experiment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading experiments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments?.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell>{experiment.name}</TableCell>
                    <TableCell>{experiment.llmModel.name}</TableCell>
                    <TableCell>
                      {new Date(experiment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {experiment.experimentRuns?.[0]?.completedAt
                        ? new Date(
                            experiment.experimentRuns[0].completedAt
                          ).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {experiment.experimentRuns?.[0]?.aggregateScore
                        ? `${experiment.experimentRuns[0].aggregateScore.toFixed(
                            2
                          )}%`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            runExperiment.mutate(experiment.id)
                          }
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.location.href = `/experiments/${experiment.id}`
                          }
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}