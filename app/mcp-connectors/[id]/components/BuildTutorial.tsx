"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Clock, Target, CheckCircle2 } from "lucide-react";
import type { BuildPhase, ConnectorDifficulty } from "@/types/mcp-connector";

interface Props {
  phases: BuildPhase[];
  difficulty: ConnectorDifficulty;
  estimatedTime: string;
  prerequisites: string[];
}

export default function BuildTutorial({
  phases,
  difficulty,
  estimatedTime,
  prerequisites,
}: Props) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const togglePhase = (phaseNumber: number) => {
    setExpandedPhase(expandedPhase === phaseNumber ? null : phaseNumber);
  };

  const difficultyColor = {
    Beginner: "bg-green-500/10 text-green-700 dark:text-green-400",
    Intermediate: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    Advanced: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <section id="tutorial" className="scroll-mt-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">📖 Build It Yourself</h2>
        <p className="text-muted-foreground mb-6">
          Learn how to build this connector from scratch in {phases.length} progressive phases
        </p>

        {/* Tutorial Info */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium">Difficulty:</span>
            <Badge variant="secondary" className={difficultyColor[difficulty]}>
              {difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">Total Time:</span>
            <span className="text-muted-foreground">{estimatedTime}</span>
          </div>
        </div>

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <Card className="mb-8 border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Prerequisites</CardTitle>
              <CardDescription>
                Make sure you have these before starting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tutorial Phases */}
      <div className="space-y-4">
        {phases.map((phase) => (
          <Card
            key={phase.number}
            className={`border-2 transition-all ${
              expandedPhase === phase.number
                ? "border-primary shadow-lg"
                : "border-border hover:border-primary/50"
            }`}
          >
            <CardHeader
              className="cursor-pointer"
              onClick={() => togglePhase(phase.number)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Phase Number */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                    {phase.number}
                  </div>

                  {/* Phase Info */}
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{phase.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {phase.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {phase.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        {phase.filesCreated.length} files
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expand Icon */}
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  {expandedPhase === phase.number ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {/* Expanded Content */}
            {expandedPhase === phase.number && (
              <CardContent className="border-t border-border pt-6 space-y-6">
                {/* Goal */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">🎯 Goal</p>
                  <p className="text-sm text-muted-foreground">{phase.goal}</p>
                </div>

                {/* Steps */}
                {phase.steps && phase.steps.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="font-semibold">Steps</h4>
                    {phase.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="space-y-4">
                        <h5 className="font-medium text-sm">
                          {stepIndex + 1}. {step.title}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>

                        {/* Code Snippets */}
                        {step.codeSnippets.map((snippet, snippetIndex) => (
                          <div key={snippetIndex} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <code className="text-xs font-mono text-muted-foreground">
                                {snippet.filename}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {snippet.language}
                              </Badge>
                            </div>
                            <pre className="bg-black/90 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                              <code>{snippet.code}</code>
                            </pre>
                            <p className="text-xs text-muted-foreground italic">
                              💡 {snippet.explanation}
                            </p>
                          </div>
                        ))}

                        {/* Checkpoints */}
                        {step.checkpoints && step.checkpoints.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-xs font-semibold mb-2">
                              Checkpoints
                            </p>
                            <ul className="space-y-1">
                              {step.checkpoints.map((checkpoint, cpIndex) => (
                                <li
                                  key={cpIndex}
                                  className="text-xs text-muted-foreground"
                                >
                                  {checkpoint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Files Created */}
                <div>
                  <p className="text-sm font-semibold mb-3">Files Created in This Phase</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.filesCreated.map((file, fileIndex) => (
                      <code
                        key={fileIndex}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {file}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
