"use client";

import React from "react";

const TEAM_MEMBERS = [
  { name: "Satvik Gupta", linkedin: "https://www.linkedin.com/in/satvik--gupta/" },
  { name: "Anant Srivastava", linkedin: "https://www.linkedin.com/in/anant-srivastava-709174293/" },
  { name: "Bhoomi Nayak", linkedin: "https://www.linkedin.com/in/bhoomi-nayak-943083305/" },
  { name: "Shashwat Shaurya", linkedin: "https://www.linkedin.com/in/shashwat-shaurya-0828a5207/" },
  { name: "Bikesh Kumar", linkedin: "https://www.linkedin.com/in/bikesh-kumar-37b71428b/" },
  { name: "Ayush Thakur", linkedin: "https://www.linkedin.com/in/ayush-thakur015/" },
  { name: "Sarthak Tripathi", linkedin: "https://www.linkedin.com/in/sarthak-tripathi-b11458295/" },
  { name: "Anuj Kumar Dixit", linkedin: "https://www.linkedin.com/in/anuj-kumar-dixit-668437280/" },
  { name: "Mariam Shuaib", linkedin: "https://www.linkedin.com/in/mariam-shuaib-003362328/" },
  { name: "Shashwat Ranjan", linkedin: "https://www.linkedin.com/in/shashwat-ranjan-140908227/" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function TeamSection() {
  return (
    <section id="team" className="py-20 sm:py-28 bg-muted/15" aria-labelledby="team-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
            Team
          </div>
          <h2
            id="team-title"
            className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground"
          >
            The people driving E-Cell
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Students leading through innovation, leadership, creativity and execution. Tap a name to connect on LinkedIn.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {getInitials(member.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {member.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <span>LinkedIn</span>
                  <span aria-hidden="true">↗</span>
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
