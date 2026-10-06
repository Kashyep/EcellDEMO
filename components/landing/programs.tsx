"use client";

import React from "react";

const PROGRAMS_DATA = [
  {
    stage: "Idea",
    title: "Ideathons",
    description:
      "Short, fast sessions that turn a problem you care about into a sharp thesis you can test.",
    step: "01",
  },
  {
    stage: "Validate",
    title: "Workshops & labs",
    description:
      "Market research, customer interviews and unit economics, taught by people who have done it.",
    step: "02",
  },
  {
    stage: "Build",
    title: "Hackathons",
    description:
      "Ship a working prototype in a weekend with designers and engineers from every branch.",
    step: "03",
  },
  {
    stage: "Pitch",
    title: "E-Summit & expos",
    description:
      "Pitch to founders, investors and alumni. The annual E-Summit is what we are building towards.",
    step: "04",
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="py-20 sm:py-28 bg-muted/15" aria-labelledby="programs-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
            Programs
          </div>
          <h2
            id="programs-title"
            className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground"
          >
            What we run
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every format maps to a stage of building a company. Join once and you can take part in all of them.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROGRAMS_DATA.map((prog) => (
            <article
              key={prog.title}
              className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                    {prog.stage}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground/60">
                    {prog.step}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {prog.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prog.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProgramsSection;
