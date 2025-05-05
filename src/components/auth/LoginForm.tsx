
'use client';

import React, { useState, useContext } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext'; // Import AuthContext
import { useToast } from '@/hooks/use-toast';

// Define Zod schema for the login form
const LoginSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }).max(100),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }), // Example password validation
});

type LoginValues = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  onLoginSuccess: () => void;
  onBack: () => void; // Function to go back to landing page
}

export default function LoginForm({ onLoginSuccess, onBack }: LoginFormProps) {
  const { login } = useContext(AuthContext);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      fullName: '',
      password: '',
    },
    mode: 'onChange',
  });

  const handleFormSubmit: SubmitHandler<LoginValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.fullName, data.password);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.fullName.split(' ')[0]}!`,
      });
      onLoginSuccess(); // Callback to parent component
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred during login.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-md border-primary/20 shadow-xl animate-fade-in transform-style-3d transition-transform duration-500 hover:scale-[1.01] hover:rotate-x-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-2xl text-primary header-glow">
          Login to TraiHVail
           <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back" className="text-muted-foreground hover:text-primary">
             <ArrowLeft className="w-5 h-5" />
           </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1 text-base">
          Enter your details to access your learning journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base">Full Name</FormLabel>
                  <FormControl>
                    <Input
                        placeholder="e.g., Ada Lovelace"
                        {...field}
                        className="bg-input/80 border-input focus:border-primary text-base"
                        disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      className="bg-input/80 border-input focus:border-primary text-base"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    className="glow-button relative overflow-hidden group"
                    disabled={isSubmitting || !form.formState.isValid}
                 >
                   <span className="relative z-10 flex items-center">
                     {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                     )}
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </span>
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
