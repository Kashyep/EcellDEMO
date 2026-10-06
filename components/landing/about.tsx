"use client";

import React from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { DotPattern } from "@/components/ui/dot-pattern";

export function AboutSection() {
  return (
    <section id="about" className="relative isolate overflow-hidden py-20 sm:py-28" aria-labelledby="about-title">
      <DotPattern className="-z-10 [mask-image:radial-gradient(ellipse_60%_55%_at_15%_20%,black,transparent)] [-webkit-mask-image:radial-gradient(ellipse_60%_55%_at_15%_20%,black,transparent)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <BlurFade inView>
          <div className="max-w-3xl space-y-4">
            <div className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
              About E-Cell
            </div>
            <h2
              id="about-title"
              className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground"
            >
              More than a club. A launchpad.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              The SMVIT Entrepreneurship Cell was re-established in 2021. Since then it has represented
              SMVIT at the National Entrepreneurship Challenge by IIT Madras and IIT Bombay, and run
              competitions, expos and networking events on campus.
            </p>
          </div>
        </BlurFade>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Purpose */}
          <BlurFade inView delay={0.05} className="h-full">
            <article className="h-full rounded-xl border border-border/70 bg-card p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-primary/40 transition-colors">
              <span className="inline-block px-2.5 py-1 rounded bg-primary/10 text-primary font-mono text-xs font-semibold uppercase tracking-wider">
                Purpose
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                A self-sustaining campus hub for founders
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                We connect students with industry leaders, decode what the market needs, and run
                hands-on training so you can start your startup journey with confidence.
              </p>
            </article>
          </BlurFade>

          {/* Vision */}
          <BlurFade inView delay={0.12} className="h-full">
            <article className="h-full rounded-xl border border-border/70 bg-card p-6 sm:p-8 space-y-3.5 shadow-sm hover:border-primary/40 transition-colors">
              <span className="inline-block px-2.5 py-1 rounded bg-primary/10 text-primary font-mono text-xs font-semibold uppercase tracking-wider">
                Vision
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                An ecosystem that outlasts four years
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Innovation labs, workshops, ideathons and hackathons, an annual E-Summit, strong
                industry partnerships, and an alumni network that offers mentorship and funding well
                beyond campus.
              </p>
            </article>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
