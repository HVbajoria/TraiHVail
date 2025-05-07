
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RotateCcw, Zap, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface QuizQuestionData {
  id: string; 
  questionTitle: string;
  questionText: string;
  options: string[];
  correctAnswerText: string; 
}

interface QuizInteractionData {
  questionId: string;
  questionTitle: string;
  questionText: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswerDisplay: string; 
  incorrectAttemptsCount?: number; 
}

interface QuizPlayerProps {
  questions: QuizQuestionData[];
  onQuizInteraction: (interactionData: QuizInteractionData) => void;
  onNextSubmodule?: (markCompleted?: boolean) => void;
}

export default function QuizPlayer({ questions, onQuizInteraction, onNextSubmodule }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [incorrectAttempts, setIncorrectAttempts] = useState<{ [questionId: string]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];

  const getCorrectOptionFromExplanation = (explanation: string, options: string[]): string | null => {
    const lowerExplanation = explanation.toLowerCase();
    for (const option of options) {
        const lowerOption = option.toLowerCase();
        const correctPatterns = [
            `correct answer is: ${lowerOption}`,
            `the answer is ${lowerOption}`,
            `${lowerOption} is correct`,
            `is: ${lowerOption}.`, 
        ];
        if (correctPatterns.some(pattern => lowerExplanation.includes(pattern))) {
            return option;
        }
    }

    let bestMatch: string | null = null;
    let bestMatchScore = -1;

    for (const option of options) {
        const lowerOption = option.toLowerCase();
        const regex = new RegExp(lowerOption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const count = (lowerExplanation.match(regex) || []).length;

        let currentScore = count;
        if (lowerExplanation.includes(`answer: ${lowerOption}`)) currentScore += 5; 
        if (lowerExplanation.startsWith(lowerOption)) currentScore += 2; 

        if (currentScore > 0 && currentScore > bestMatchScore) {
            bestMatch = option;
            bestMatchScore = currentScore;
        }
    }
    if (bestMatch) return bestMatch;

    console.warn("Could not reliably determine correct option from explanation:", explanation, "Options:", options);
    return options.length > 0 ? options[0] : null;
  };


  const handleAnswerSubmit = () => {
    if (!selectedAnswer) {
      toast({ title: 'Select an Answer', description: 'Please choose an option before submitting.', variant: 'default' });
      return;
    }

    const correctAnswerOptionText = getCorrectOptionFromExplanation(currentQuestion.correctAnswerText, currentQuestion.options);
    if (!correctAnswerOptionText) {
        toast({ title: "Quiz Error", description: "Could not determine the correct answer for this question.", variant: "destructive"});
        setIsAnswered(true);
        setIsCorrectAnswer(false);
        return;
    }

    const isCorrect = selectedAnswer.trim().toLowerCase() === correctAnswerOptionText.trim().toLowerCase();
    let currentIncorrectAttempts = incorrectAttempts[currentQuestion.id] || 0;

    if (!isCorrect && !isCorrectAnswer) { 
        currentIncorrectAttempts += 1;
        setIncorrectAttempts(prev => ({
            ...prev,
            [currentQuestion.id]: currentIncorrectAttempts
        }));
    }

    setIsAnswered(true);
    setIsCorrectAnswer(isCorrect);

    const interactionPayload: QuizInteractionData = {
      questionId: currentQuestion.id,
      questionTitle: currentQuestion.questionTitle,
      questionText: currentQuestion.questionText,
      userAnswer: selectedAnswer,
      isCorrect,
      correctAnswerDisplay: correctAnswerOptionText,
    };

    if (isCorrect) {
      interactionPayload.incorrectAttemptsCount = incorrectAttempts[currentQuestion.id] || 0;
    }
    onQuizInteraction(interactionPayload);
  };

  const handleNextQuestion = () => {
    if (!isCorrectAnswer) {
        toast({ title: "Incorrect Answer", description: "Please select the correct answer to proceed.", variant: "default" });
        return;
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrectAnswer(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsCorrectAnswer(false);
        setShowResults(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrectAnswer(false);
    setIncorrectAttempts({});
    setShowResults(false);
    toast({ title: 'Quiz Restarted', description: 'Good luck!' });
  };

  const handleOptionChange = (value: string) => {
    setSelectedAnswer(value);
    if (isAnswered && !isCorrectAnswer) {
        setIsAnswered(false); 
    }
  };


  if (showResults) {
    const topicsToReview = questions.filter(q => (incorrectAttempts[q.id] || 0) > 0);

    return (
      <Card className="w-full max-w-2xl animate-fade-in bg-card/80 backdrop-blur-md border border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary header-glow">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Lightbulb className="w-20 h-20 mx-auto text-primary" />
          {topicsToReview.length > 0 ? (
            <>
              <p className="text-xl font-semibold text-foreground">Here are some topics you might want to review:</p>
              <ul className="list-disc list-inside text-left space-y-1 text-muted-foreground max-w-md mx-auto">
                {topicsToReview.map(topic => (
                  <li key={topic.id}>{topic.questionTitle}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xl font-semibold text-green-500">Excellent! You've shown a strong understanding of all topics.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
          <Button onClick={handleRestartQuiz} variant="outline" size="lg" className="glow-button">
            <RotateCcw className="mr-2 h-5 w-5" /> Restart Quiz
          </Button>
          {onNextSubmodule && (
            <Button onClick={() => onNextSubmodule(true)} size="lg" className="glow-button">
              Next Submodule <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
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
          onValueChange={handleOptionChange}
          className="space-y-3"
          disabled={isAnswered && isCorrectAnswer}
        >
          {currentQuestion.options.map((option, index) => {
            const optionId = `option-${currentQuestion.id}-${index}`;
            const isThisSelectedOption = selectedAnswer === option;
            const isTheCorrectAnswerOption = isAnswered && isCorrectAnswer && selectedAnswer === option;
            const actualCorrectOptionText = getCorrectOptionFromExplanation(currentQuestion.correctAnswerText, currentQuestion.options);
            const isActuallyCorrect = option.trim().toLowerCase() === actualCorrectOptionText?.trim().toLowerCase();


            return (
              <Label
                key={optionId}
                htmlFor={optionId}
                className={cn(
                  "flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200",
                  isAnswered && isCorrectAnswer && isActuallyCorrect && "bg-green-500/15 border-green-500 ring-2 ring-green-500/70 text-green-700", 
                  isAnswered && !isCorrectAnswer && isThisSelectedOption && "bg-destructive/15 border-destructive ring-2 ring-destructive/70 text-destructive-700", 
                  !isAnswered && isThisSelectedOption && "bg-primary/10 border-primary ring-2 ring-primary/70", 
                  !(isAnswered && isCorrectAnswer) ? "hover:bg-muted/40 hover:border-primary/50" : "opacity-80",
                  (isAnswered && isCorrectAnswer && !isActuallyCorrect) && "opacity-60 cursor-not-allowed", 
                   "border-border/40"
                )}
              >
                <RadioGroupItem value={option} id={optionId} className="border-primary text-primary focus:ring-primary" disabled={isAnswered && isCorrectAnswer}/>
                <span className="flex-1 text-base">{option}</span>
                {isAnswered && isCorrectAnswer && isThisSelectedOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                {isAnswered && !isCorrectAnswer && isThisSelectedOption && <XCircle className="w-5 h-5 text-destructive" />}
              </Label>
            );
          })}
        </RadioGroup>

        {isAnswered && isCorrectAnswer && (
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

        {isAnswered && isCorrectAnswer ? (
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

