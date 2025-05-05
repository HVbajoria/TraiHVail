
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import type { SlidesOutput } from '@/ai/flows/generate-slides'; // Import the main output type

// Accept individual slide type directly now
type Slide = SlidesOutput['slides'][number];

interface SlideDisplayProps {
    slides: Slide[]; // Accept the array of slides
}

// Define colors for charts (Tailwind theme colors preferred, but static for simplicity here)
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

// Helper to render chart based on type
const renderChart = (slide: Extract<Slide, { type: 'chart_slide' }>) => {
    const dataWithFill = slide.data.map((entry, index) => ({
        ...entry,
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            {slide.chartType === 'bar' && (
                <RechartsBarChart data={dataWithFill}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="label" stroke="hsl(var(--foreground) / 0.7)" />
                    <YAxis stroke="hsl(var(--foreground) / 0.7)" />
                    <Tooltip
                        contentStyle={{
                            background: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--popover-foreground))',
                            borderRadius: 'var(--radius)',
                        }}
                    />
                    <Bar dataKey="value" fill="var(--color-chart-1)" />
                </RechartsBarChart>
            )}
            {slide.chartType === 'line' && (
                <RechartsLineChart data={dataWithFill}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="label" stroke="hsl(var(--foreground) / 0.7)" />
                    <YAxis stroke="hsl(var(--foreground) / 0.7)" />
                    <Tooltip
                         contentStyle={{
                            background: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--popover-foreground))',
                            borderRadius: 'var(--radius)',
                        }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-chart-1)' }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
            )}
            {slide.chartType === 'pie' && (
                 <RechartsPieChart>
                    <Pie data={dataWithFill} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
                         {dataWithFill.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                    </Pie>
                     <Tooltip
                         contentStyle={{
                            background: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--popover-foreground))',
                            borderRadius: 'var(--radius)',
                        }}
                     />
                     <Legend />
                </RechartsPieChart>
            )}
        </ResponsiveContainer>
    );
};


export default function SlideDisplay({ slides }: SlideDisplayProps) {
    if (!slides || slides.length === 0) {
        return (
            <Card className="m-4 bg-card/80 backdrop-blur-sm border-border/30 shadow-lg">
                <CardHeader>
                    <CardTitle>No Slides Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Slides could not be generated or are empty.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            {slides.map((slide) => (
                <Card
                    key={slide.slideNumber}
                    className={cn(
                        "bg-card/90 backdrop-blur-lg border border-border/40 shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-primary/20 hover:border-primary/30 hover:-translate-y-1",
                         // Add transition classes based on slide.transition if needed
                    )}
                >
                    <CardHeader className="pb-4 bg-muted/20 border-b border-border/20">
                         <div className="flex justify-between items-center">
                            <CardTitle className="text-xl font-semibold text-primary">{slide.title}</CardTitle>
                            <span className="text-xs font-mono text-muted-foreground px-2 py-1 bg-background/50 rounded border border-border/30">
                                Slide {slide.slideNumber} / {slides.length} ({slide.type.replace('_', ' ')})
                            </span>
                         </div>
                         {/* Render subtitle only for title_slide */}
                         {slide.type === 'title_slide' && slide.subtitle && (
                            <CardDescription className="text-base text-muted-foreground pt-1">{slide.subtitle}</CardDescription>
                         )}
                    </CardHeader>
                    <CardContent className="pt-6 text-base leading-relaxed">
                        {/* Render content based on slide type */}
                        {slide.type === 'title_slide' && <p>{slide.content}</p>}
                        {slide.type === 'content_slide' && <p>{slide.content}</p>}

                        {slide.type === 'unordered_list_slide' && (
                            <ul className="list-disc space-y-2 pl-6">
                                {slide.points.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        )}

                        {slide.type === 'code_slide' && (
                            <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm font-mono border border-border/50 shadow-inner">
                                {slide.lexer && <code className="block text-muted-foreground mb-2 text-xs font-semibold">{slide.lexer}</code>}
                                <code>{slide.code}</code>
                            </pre>
                        )}

                        {slide.type === 'quiz_slide' && (
                            <div className="space-y-4">
                                <p className="font-medium text-lg mb-4">{slide.question}</p>
                                <div className="space-y-3">
                                    {slide.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 border border-border/30 rounded-md hover:bg-muted/30 transition-colors">
                                            {/* Basic checkbox example - interactivity needs state management */}
                                            <Checkbox id={`option-${slide.slideNumber}-${index}`} />
                                            <Label htmlFor={`option-${slide.slideNumber}-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {slide.type === 'chart_slide' && renderChart(slide)}

                        {slide.type === 'formula_slide' && (
                             <div className="space-y-3">
                                 <div className="text-center text-lg font-medium bg-muted/30 p-4 rounded border border-border/40 shadow-inner font-mono tracking-wider">
                                     {slide.formula} {/* Display formula string */}
                                 </div>
                                 {slide.explanation && <p className="text-sm text-muted-foreground pt-2">{slide.explanation}</p>}
                            </div>
                        )}

                         {/* Optional Voiceover Display */}
                         {slide.voiceover && (
                            <div className="mt-4 pt-3 border-t border-dashed border-border/30">
                                <p className="text-xs text-muted-foreground italic">🎤 {slide.voiceover}</p>
                            </div>
                         )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

