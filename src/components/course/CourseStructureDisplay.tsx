
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Circle, Rocket, ArrowLeft, ChevronDown, Bot } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

export type CourseModule = {
  id: string;
  type: 'Module' | 'Sub Module';
  content: string; 
  details?: string; 
  completed: boolean;
};

type GroupedModule = CourseModule & { subModules: CourseModule[] };

interface CourseStructureDisplayProps {
  courseName: string;
  modules: CourseModule[];
  onStartLesson: (module: CourseModule) => void; 
  onBack: () => void;
}

export default function CourseStructureDisplay({ courseName, modules, onStartLesson, onBack }: CourseStructureDisplayProps) {
    const defaultOpenModule = useMemo(() => {
        const firstModule = modules.find(m => m.type === 'Module');
        return firstModule ? [firstModule.id] : [];
    }, [modules]);
    const [openModules, setOpenModules] = useState<string[]>(defaultOpenModule);

    const groupedStructure: GroupedModule[] = useMemo(() => {
        const mainModules: GroupedModule[] = [];
        let currentModule: GroupedModule | null = null;

        modules.forEach((item) => {
            if (item.type === 'Module') {
                if (currentModule) {
                    mainModules.push(currentModule);
                }
                currentModule = { ...item, subModules: [] };
            } else if (item.type === 'Sub Module' && currentModule) {
                currentModule.subModules.push(item);
            } else if (item.type === 'Sub Module' && !currentModule) {
                 console.warn(`Orphaned Sub Module found: ${item.content}. Place it under a 'Module' type.`);
                 // Optionally create a default module or assign to the last one if any
                 if (mainModules.length > 0) {
                     mainModules[mainModules.length -1].subModules.push(item);
                 } else {
                     // Create a default module if none exists to house orphaned sub-modules
                     const defaultMod: GroupedModule = {id: 'default-module-orphans', type: 'Module', content: "Other Topics", completed: false, subModules: [item]};
                     mainModules.push(defaultMod);
                     currentModule = defaultMod; // Set currentModule to this new default
                 }
            }
        });

        if (currentModule) {
            mainModules.push(currentModule);
        }

        return mainModules;
    }, [modules]);

    const renderSubModuleItem = (item: CourseModule) => (
         <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-primary/80 flex-shrink-0 mt-0.5" />
                        <p className="font-semibold text-foreground text-base">
                            {item.content} 
                        </p>
                    </div>
                    {item.details && (
                      <p className="text-sm text-muted-foreground pl-8">{item.details}</p>
                    )}
                </div>

                 <div className="flex flex-col items-end gap-2 flex-shrink-0 w-32">
                     {item.completed ? (
                        <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                        </div>
                    ) : (
                         <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                             <Circle className="w-4 h-4" />
                             Pending
                         </div>
                    )}
                     <Button
                         onClick={() => onStartLesson(item)} 
                         variant={item.completed ? "outline" : "default"}
                         size="sm"
                         className={cn(
                             "w-full group",
                             !item.completed && "glow-button relative overflow-hidden"
                         )}
                      >
                          <span className="relative z-10 flex items-center justify-center">
                              <Bot className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
                              {item.completed ? 'Review' : 'Start'}
                          </span>
                      </Button>
                </div>
            </div>
         </div>
    );


  return (
    <div className="w-full max-w-3xl animate-fade-in p-4"> 
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card/80 backdrop-blur-md py-3 px-4 z-10 rounded-t-lg border-b border-border/30">
             <h1 className="text-2xl font-bold text-primary header-glow">{courseName}</h1>
             <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back" className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="w-5 h-5" />
                 </Button>
             </div>
        </div>

       <Accordion
            type="multiple"
            value={openModules}
            onValueChange={setOpenModules}
            className="w-full space-y-4 px-2 pb-4" 
        >
            {groupedStructure.map((moduleGroup) => (
                <AccordionItem key={moduleGroup.id} value={moduleGroup.id} className="border-none">
                    <Card className={cn(
                        "bg-card/80 backdrop-blur-lg border shadow-lg transition-all duration-300 hover:shadow-primary/20 transform hover:-translate-y-px",
                        moduleGroup.subModules.every(sm => sm.completed) ? 'border-green-500/40' : 'border-border/30', 
                        !moduleGroup.subModules.every(sm => sm.completed) && 'hover:border-primary/50'
                    )}>
                        <AccordionTrigger className="w-full p-0 hover:no-underline rounded-t-lg focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                             <CardHeader className={cn(
                                "flex flex-row items-center justify-between p-4 rounded-t-lg w-full cursor-pointer",
                                moduleGroup.subModules.every(sm => sm.completed) ? 'bg-green-500/5 border-b border-green-500/15' : 'bg-muted/20 border-b border-border/20'
                             )}>
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span className="text-lg font-semibold text-foreground text-left">{moduleGroup.content}</span> 
                                </div>
                                <div className="flex items-center gap-4">
                                     <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 accordion-chevron" />
                                </div>
                            </CardHeader>
                        </AccordionTrigger>

                        <AccordionContent className="pt-0">
                             {moduleGroup.subModules.length > 0 ? (
                                moduleGroup.subModules.map((subModule, index) => (
                                    <div key={subModule.id} className={cn(
                                        "border-t border-border/20",
                                        index === 0 && "border-t-0" 
                                        )}>
                                        {renderSubModuleItem(subModule)} 
                                    </div>
                                ))
                             ) : (
                                 <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/20">
                                     No sub-modules defined for this module.
                                 </div>
                             )}
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            ))}
            {groupedStructure.length === 0 && modules.length > 0 && ( 
                <Card className="bg-card/70 backdrop-blur-lg border border-border/30 shadow-lg p-6 text-center">
                    <p className="text-muted-foreground">No modules found. Ensure the 'Type' column contains 'Module'.</p>
                </Card>
            )}
             {modules.length === 0 && ( 
                <Card className="bg-card/70 backdrop-blur-lg border border-border/30 shadow-lg p-6 text-center">
                    <p className="text-muted-foreground">Course structure is empty or could not be parsed.</p>
                </Card>
            )}
       </Accordion>
    </div>
  );
}

