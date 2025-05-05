
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, ArrowLeft, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react'; // Import Loader2
import { cn } from '@/lib/utils';

// Use z.any() on server, refine on client for FileList/File type checks
const FormSchema = z.object({
  courseName: z.string().min(3, { message: 'Course name must be at least 3 characters long.' }).max(100, { message: 'Course name cannot exceed 100 characters.'}),
  courseFile: z
    .any()
    // Client-side refinement
    .refine(
      (files): files is FileList => typeof window !== 'undefined' && files instanceof FileList && files.length > 0,
      'Course structure file is required.'
    )
    .refine(
      (files: FileList | unknown): files is FileList =>
        typeof window !== 'undefined' &&
        files instanceof FileList &&
        files.length > 0 &&
        (
            files[0].type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
            files[0].type === 'application/vnd.ms-excel' || // .xls
            files[0].type === 'text/csv' || // .csv (standard MIME type)
            files[0].type === 'application/csv' || // another common MIME type
            files[0].name.toLowerCase().endsWith('.csv') // Fallback check by extension
        ),
      'File must be an Excel (.xlsx, .xls) or CSV (.csv).' // Updated message
    )
     .refine(
       (files: FileList | unknown): files is FileList =>
        typeof window !== 'undefined' &&
        files instanceof FileList &&
        files.length > 0 &&
        files[0].size <= 5 * 1024 * 1024, // 5MB limit
        'File size must be less than 5MB.'
     )
    .nullable(),
});


type FormValues = z.infer<typeof FormSchema>;

interface CourseSetupFormProps {
  onSubmit: (courseName: string, file: File | null) => void;
  onBack: () => void;
}

export default function CourseSetupForm({ onSubmit, onBack }: CourseSetupFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      courseName: '',
      courseFile: null,
    },
     mode: 'onChange', // Validate on change for better UX
  });

  const fileRef = form.register("courseFile");
  const watchedFile = form.watch('courseFile');
  const hasFile = typeof window !== 'undefined' && watchedFile instanceof FileList && watchedFile.length > 0;
  const fileName = hasFile ? watchedFile[0].name : null;
  const fileError = form.formState.errors.courseFile;

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
     // We know courseFile is a FileList due to zod refinement on client
     const file = data.courseFile ? data.courseFile[0] : null;
     onSubmit(data.courseName, file);
  };

  return (
    <Card className="w-full max-w-lg bg-card/80 backdrop-blur-md border-primary/20 shadow-xl animate-fade-in transform-style-3d transition-transform duration-500 hover:scale-[1.01] hover:rotate-x-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-2xl text-primary header-glow">
          Setup Your Course
           <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back" className="text-muted-foreground hover:text-primary">
             <ArrowLeft className="w-5 h-5" />
           </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground pt-1 text-base"> {/* Ensure readable text size */}
          Provide a name and upload the course structure (XLSX/XLS/CSV, max 5MB).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base">Course Name</FormLabel> {/* Ensure readable text size */}
                  <FormControl>
                    <Input
                        placeholder="e.g., Advanced Python Hashing"
                        {...field}
                        className="bg-input/80 border-input focus:border-primary text-base" // Ensure readable text size
                    />
                  </FormControl>
                   <FormDescription className="text-xs text-muted-foreground pt-1">
                       A descriptive name for your course.
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base">Course Structure File</FormLabel> {/* Ensure readable text size */}
                   <FormControl>
                     <Label
                       htmlFor="courseFile"
                       className={cn(
                         "flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300",
                         "bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/50",
                         hasFile && !fileError && "border-green-500/70 bg-green-500/10 hover:bg-green-500/20", // Valid file selected
                         fileError && "border-destructive/70 bg-destructive/10 hover:bg-destructive/20" // Error state
                       )}
                     >
                       <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                         {hasFile && !fileError ? (
                           <>
                             <CheckCircle className="w-10 h-10 mb-3 text-green-500" />
                             <p className="mb-1 text-sm font-semibold text-foreground">File Ready:</p>
                             <p className="text-xs text-muted-foreground truncate max-w-[90%]">
                               {fileName}
                             </p>
                           </>
                         ) : fileError ? (
                            <>
                               <Upload className="w-8 h-8 mb-3 text-destructive" />
                               <p className="mb-1 text-sm font-semibold text-destructive">Upload Issue</p>
                               {/* Display the specific Zod error message */}
                               <p className="text-xs text-destructive/90 px-4">{typeof fileError.message === 'string' ? fileError.message : 'Invalid file selected.'}</p>
                            </>
                         ) : (
                           <>
                             <Upload className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-primary" />
                             <p className="mb-1 text-sm text-muted-foreground">
                               <span className="font-semibold text-foreground">Click to upload</span> or drag & drop
                             </p>
                             <p className="text-xs text-muted-foreground">
                               Excel (.xlsx, .xls) or CSV (.csv, max 5MB) {/* Updated text */}
                             </p>
                           </>
                         )}
                       </div>
                       <Input
                         id="courseFile"
                         type="file"
                         className="hidden"
                         accept=".xlsx, .xls, .csv" // Updated accept attribute
                         {...fileRef} // Use the registered ref directly
                         // The value is controlled by react-hook-form, onChange is handled
                       />
                     </Label>
                   </FormControl>
                   <FormDescription className="text-xs text-muted-foreground pt-1">
                       {/* Updated description for Module/Sub Module */}
                       Must contain columns: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Content</code>, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Type</code> ('Module' or 'Sub Module'), <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Details</code> (optional). First row must be headers.
                   </FormDescription>
                   <FormMessage /> {/* Display validation errors (also handled inside dropzone) */}
                 </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    className="glow-button relative overflow-hidden group"
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                 >
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <span className="absolute inset-0 translate-x-0 translate-y-0 bg-primary transition-transform duration-500 ease-out group-hover:translate-x-full group-hover:translate-y-full"></span>
                    <span className="absolute inset-0 translate-x-full translate-y-full bg-primary/80 transition-transform duration-500 ease-out group-hover:translate-x-0 group-hover:translate-y-0"></span>
                  </span>
                  <span className="relative z-10 flex items-center">
                     {/* Use Loader2 when submitting, FileSpreadsheet otherwise */}
                     {form.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                     )}
                    {form.formState.isSubmitting ? 'Parsing...' : 'Parse & Proceed'}
                  </span>
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
