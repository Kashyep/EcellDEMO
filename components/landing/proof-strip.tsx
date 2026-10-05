"use client";

import React from "react";
import { Num } from "@/components/num";

export function ProofStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/20 py-8" aria-label="Key Highlights">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {/* Metric 1: Re-established */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground flex items-center justify-center gap-1">
              <Num value={2021} className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Re-established
            </p>
          </div>

          {/* Metric 2: NEC, IIT Bombay */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground flex items-center justify-center">
              <Num value={16} className="text-2xl sm:text-3xl" />
              <span className="text-xl sm:text-2xl font-bold ml-0.5">th</span>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              NEC, IIT Bombay
            </p>
          </div>

          {/* Metric 3: IIT National stages */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground flex items-center justify-center">
              <Num value={2} className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              IIT National Stages
            </p>
          </div>

          {/* Metric 4: Core team members */}
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground flex items-center justify-center">
              <Num value={10} className="text-2xl sm:text-3xl" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Core Team Members
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProofStrip;
