"use client";

// AnimatedStepper — fluid multi-step wizard (Framer Motion), adapted from the
// reference to the DHARA leaf-green theme. Used for voice-first record entry.

import React, { useState, Children, useRef, useLayoutEffect, ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check } from "lucide-react";

export function AnimatedStepper({
  children,
  onFinalStepCompleted = () => {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  completeText = "Save",
  canProceed = () => true,
}: {
  children: ReactNode;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  completeText?: string;
  canProceed?: (step: number) => boolean;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full overflow-hidden rounded-[2rem] bg-surface border border-line card-elevate">
        {/* indicators */}
        <div className="flex w-full items-center p-6 pb-3">
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const status = currentStep === stepNumber ? "active" : currentStep < stepNumber ? "inactive" : "complete";
            return (
              <React.Fragment key={stepNumber}>
                <div className="relative flex items-center justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-display font-bold text-sm transition-colors duration-300 ${
                      status === "complete"
                        ? "bg-leaf border-leaf text-white"
                        : status === "active"
                          ? "bg-surface border-leaf text-leaf"
                          : "bg-bg-soft border-line text-ink-faint"
                    }`}
                  >
                    {status === "complete" ? <Check className="h-4 w-4" /> : stepNumber}
                  </div>
                  {status === "active" && (
                    <motion.div layoutId="active-glow" className="absolute -inset-1 rounded-full bg-lime/25 blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div className="relative mx-3 h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className="absolute inset-0 bg-leaf origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: currentStep > stepNumber ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* content */}
        <StepContentWrapper isCompleted={isCompleted} currentStep={currentStep} direction={direction} className="px-6">
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* footer */}
        {!isCompleted && (
          <div className="px-6 pb-6 pt-3">
            <div className={`flex items-center ${currentStep !== 1 ? "justify-between" : "justify-end"}`}>
              {currentStep !== 1 && (
                <button
                  onClick={() => {
                    setDirection(-1);
                    updateStep(currentStep - 1);
                  }}
                  className="text-sm font-medium text-ink-faint hover:text-ink-soft transition-colors"
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={() => {
                  if (!canProceed(currentStep)) return;
                  setDirection(1);
                  updateStep(currentStep + 1);
                }}
                disabled={!canProceed(currentStep)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-leaf px-8 text-sm font-semibold text-white transition-all duration-300 hover:bg-forest active:scale-95 disabled:opacity-50"
              >
                {isLastStep ? completeText : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = "",
}: {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}) {
  const [parentHeight, setParentHeight] = useState(0);
  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight || "auto" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeightReady }: { children: ReactNode; direction: number; onHeightReady: (h: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (ref.current) onHeightReady(ref.current.offsetHeight);
  }, [children, onHeightReady]);
  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -20 : 20, opacity: 0 }),
};

export function Step({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="py-3">
      {title && <h2 className="mb-3 font-display text-xl font-bold text-forest">{title}</h2>}
      <div className="text-ink-soft leading-relaxed text-sm">{children}</div>
    </div>
  );
}

export default AnimatedStepper;
