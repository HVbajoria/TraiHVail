
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RotateCcw, Zap, Award, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface QuizQuestionData {
  id: string;
  questionTitle: string;
  questionText: string;
  options: string[];
  correctAnswerText: string; // Full explanation containing the correct answer
}

interface QuizPlayerProps {
  questions: QuizQuestionData[];
  onQuizInteraction: (interactionData: {
    questionTitle: string;
    questionText: string;
    userAnswer: string;
    isCorrect: boolean;
    correctAnswerDisplay: string;
  }) => void;
}

export default function QuizPlayer({ questions, onQuizInteraction }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];

  // Function to extract the correct option text from the explanation.
  // This is a heuristic and might need refinement based on actual explanation formats.
  const getCorrectOptionFromExplanation = (explanation: string, options: string[]): string | null => {
    const lowerExplanation = explanation.toLowerCase();
    for (const option of options) {
        if (lowerExplanation.includes(option.toLowerCase())) {
            // More robust check: ensure it's likely the intended answer, not just a mention
            // e.g., "The correct answer is: Option A." or "Option A is correct because..."
            if (lowerExplanation.includes(`correct answer is: ${option.toLowerCase()}`) ||
                lowerExplanation.includes(`${option.toLowerCase()} is correct`)) {
                 return option;
            }
        }
    }
    // Fallback: if no clear indicator, try to find the option most prominently mentioned.
    // This is less reliable.
    let bestMatch: string | null = null;
    let bestMatchCount = 0;
    for (const option of options) {
        const count = (lowerExplanation.match(new RegExp(option.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (count > bestMatchCount) {
            bestMatch = option;
            bestMatchCount = count;
        }
    }
    if (bestMatchCount > 0) return bestMatch;

    console.warn("Could not reliably determine correct option from explanation:", explanation, "Options:", options);
    return options[0]; // Default to first option if unable to determine, or handle error
  };


  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      toast({ title: 'Select an Answer', description: 'Please choose an option before submitting.', variant: 'default' });
      return;
    }

    const correctAnswerOptionText = getCorrectOptionFromExplanation(currentQuestion.correctAnswerText, currentQuestion.options);
    if (!correctAnswerOptionText) {
        toast({ title: "Quiz Error", description: "Could not determine the correct answer for this question.", variant: "destructive"});
        // Potentially skip or mark as ungradable
        setIsAnswered(true); // Allow moving to next question
        return;
    }

    const isCorrect = selectedAnswer.trim().toLowerCase() === correctAnswerOptionText.trim().toLowerCase();

    if (isCorrect) {
      setScore(score + 1);
    } else {
      setIncorrectAnswers(incorrectAnswers + 1);
    }
    setIsAnswered(true);

    onQuizInteraction({
      questionTitle: currentQuestion.questionTitle,
      questionText: currentQuestion.questionText,
      userAnswer: selectedAnswer,
      isCorrect,
      correctAnswerDisplay: correctAnswerOptionText, // Send the identified correct option
    });
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        // Reset answer state for the previous question, or load stored answer if implemented
        setIsAnswered(false); // For now, just reset.
        setSelectedAnswer(null);
        setShowResults(false); // If user goes back, hide results
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIncorrectAnswers(0);
    setShowResults(false);
    toast({ title: 'Quiz Restarted', description: 'Good luck!' });
  };


  if (showResults) {
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    return (
      <Card className="w-full max-w-2xl animate-fade-in bg-card/80 backdrop-blur-md border border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary header-glow">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Award className={cn("w-24 h-24 mx-auto", percentage >= 70 ? "text-green-500" : percentage >= 40 ? "text-yellow-500" : "text-destructive")} />
          <p className="text-2xl font-semibold">
            You scored {score} out of {totalQuestions} ({percentage.toFixed(0)}%)
          </p>
          <div className="flex justify-around">
            <div className="text-green-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-1" />
              <p className="text-lg font-medium">{score} Correct</p>
            </div>
            <div className="text-destructive">
              <XCircle className="w-8 h-8 mx-auto mb-1" />
              <p className="text-lg font-medium">{incorrectAnswers} Incorrect</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {percentage >= 70 ? "Great job! You have a strong understanding." : percentage >= 40 ? "Good effort! Review the material to improve." : "Keep practicing! Review the concepts to build your knowledge."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleRestartQuiz} size="lg" className="glow-button">
            <RotateCcw className="mr-2 h-5 w-5" /> Restart Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-md text-center p-6 bg-card/80 backdrop-blur-md border border-border/30 shadow-lg">
        <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">No quiz questions available for this lesson.</p>
      </Card>
    );
  }

  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card className="w-full max-w-2xl flex flex-col h-full bg-card/90 backdrop-blur-lg border border-primary/20 shadow-2xl transform-style-3d transition-all duration-500 hover:shadow-primary/30 hover:rotate-y-1">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-xl font-semibold text-primary header-glow">{currentQuestion.questionTitle}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progressValue} className="w-full h-2 [&>div]:bg-primary" />
      </CardHeader>

      <CardContent className="flex-grow p-6 space-y-6 overflow-y-auto">
        <p className="text-lg text-foreground leading-relaxed">{currentQuestion.questionText}</p>
        <RadioGroup
          value={selectedAnswer || ''}
          onValueChange={setSelectedAnswer}
          className="space-y-3"
          disabled={isAnswered}
        >
          {currentQuestion.options.map((option, index) => {
            const optionId = `option-${currentQuestion.id}-${index}`;
            const correctAnswerOptionText = getCorrectOptionFromExplanation(currentQuestion.correctAnswerText, currentQuestion.options);
            const isCorrectOption = option.trim().toLowerCase() === correctAnswerOptionText?.trim().toLowerCase();
            const isSelectedOption = selectedAnswer === option;

            return (
              <Label
                key={optionId}
                htmlFor={optionId}
                className={cn(
                  "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200",
                  isAnswered ? "cursor-not-allowed opacity-80" : "hover:bg-muted/40 hover:border-primary/50",
                  isSelectedOption && !isAnswered && "bg-primary/10 border-primary ring-2 ring-primary/70",
                  isAnswered && isCorrectOption && "bg-green-500/10 border-green-500 ring-2 ring-green-500/70 text-green-700",
                  isAnswered && isSelectedOption && !isCorrectOption && "bg-destructive/10 border-destructive ring-2 ring-destructive/70 text-destructive-700",
                  isAnswered && !isSelectedOption && !isCorrectOption && "border-border/30"
                )}
              >
                <RadioGroupItem value={option} id={optionId} className="border-primary text-primary focus:ring-primary"/>
                <span className="flex-1 text-base">{option}</span>
                {isAnswered && isSelectedOption && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                {isAnswered && isSelectedOption && !isCorrectOption && <XCircle className="w-5 h-5 text-destructive" />}
                {isAnswered && !isSelectedOption && isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500 opacity-50" />}
              </Label>
            );
          })}
        </RadioGroup>

        {isAnswered && (
          <div className="mt-6 p-4 border-t border-border/50 animate-fade-in">
            <h4 className="text-md font-semibold mb-2 text-foreground">Explanation:</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentQuestion.correctAnswerText}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/30 pt-6 flex justify-between items-center">
        <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || showResults}
            className="flex items-center gap-2"
        >
            <ChevronLeft className="w-5 h-5" /> Previous
        </Button>
        {isAnswered ? (
          <Button onClick={handleNextQuestion} size="lg" className="glow-button">
            {currentQuestionIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button onClick={handleAnswerSubmit} size="lg" className="glow-button" disabled={!selectedAnswer}>
            Submit Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

