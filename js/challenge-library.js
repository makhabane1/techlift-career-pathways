// Challenge library: each track has three levels. Every challenge lists the
// skills it verifies; those skills are also the rubric criteria a mentor or
// peer scores (1-4). A skill scored 3 or higher counts as verified.
const TechLiftChallenges = (() => {
  const levels = ["foundation", "core", "stretch"];

  const tracks = {
    frontend: {
      label: "Frontend Engineer",
      keywords: ["html", "css", "javascript", "react", "frontend", "front-end", "ui", "accessibility", "web"],
      challenges: [
        {
          id: "frontend-foundation",
          level: "foundation",
          title: "Style a reusable card component",
          brief: "Build a product card with consistent spacing, a clear title hierarchy, and a hover state, using only HTML and CSS.",
          time: "2-3 hours",
          skills: ["Semantic HTML", "CSS layout", "Visual hierarchy"],
        },
        {
          id: "frontend-core",
          level: "core",
          title: "Build a responsive hero section",
          brief: "Create a landing page for a new learning product with a clear hierarchy, a strong call to action, and a responsive layout.",
          time: "3-5 hours",
          skills: ["Responsive UI", "Visual hierarchy", "Interaction design"],
        },
        {
          id: "frontend-stretch",
          level: "stretch",
          title: "Ship an accessible multi-step form",
          brief: "Build a three-step sign-up form with keyboard navigation, validation messages that screen readers announce, and saved progress.",
          time: "6-8 hours",
          skills: ["Accessibility", "JavaScript state", "Form validation"],
        },
      ],
    },
    design: {
      label: "Product Designer",
      keywords: ["design", "ux", "research", "figma", "usability", "wireframe", "prototype", "design systems"],
      challenges: [
        {
          id: "design-foundation",
          level: "foundation",
          title: "Sketch a three-screen onboarding flow",
          brief: "Map how a new learner moves from sign-up to their first lesson, with one wireframe per screen and a short note on each decision.",
          time: "2-3 hours",
          skills: ["Information architecture", "Wireframing", "Clear labelling"],
        },
        {
          id: "design-core",
          level: "core",
          title: "Create a conversion-focused landing flow",
          brief: "Improve the enrollment journey for a learning platform. Show how a new learner discovers a program and confidently applies.",
          time: "3-5 hours",
          skills: ["User flows", "Wireframing", "Usability thinking"],
        },
        {
          id: "design-stretch",
          level: "stretch",
          title: "Run a usability test and report findings",
          brief: "Test a prototype with three participants, then write a findings report that ranks problems by severity and proposes fixes.",
          time: "6-8 hours",
          skills: ["Research planning", "Synthesis", "Prioritizing problems"],
        },
      ],
    },
    data: {
      label: "Data Analyst",
      keywords: ["data", "sql", "analytics", "analysis", "dashboard", "metrics", "statistics", "excel", "tableau"],
      challenges: [
        {
          id: "data-foundation",
          level: "foundation",
          title: "Clean a dataset and chart one trend",
          brief: "Take a messy sales export, fix its types and duplicates, and produce one clear chart of a trend with a one-sentence takeaway.",
          time: "2-3 hours",
          skills: ["Data cleaning", "SQL basics", "Chart choice"],
        },
        {
          id: "data-core",
          level: "core",
          title: "Map a business dashboard that turns data into action",
          brief: "Turn a small set of business metrics into a dashboard that helps a team spot a trend and decide what to do next.",
          time: "3-5 hours",
          skills: ["Data storytelling", "Dashboard design", "Metric selection"],
        },
        {
          id: "data-stretch",
          level: "stretch",
          title: "Read out an A/B test with honest caveats",
          brief: "Analyse the results of a simple A/B test, state whether the difference is significant, and list the limits of the conclusion.",
          time: "6-8 hours",
          skills: ["Hypothesis testing", "Caveat writing", "Decision framing"],
        },
      ],
    },
    product: {
      label: "Product",
      keywords: ["product", "roadmap", "strategy", "discovery", "prioritization", "prioritisation", "agile", "customer"],
      challenges: [
        {
          id: "product-foundation",
          level: "foundation",
          title: "Write a one-page problem statement",
          brief: "Describe one customer problem with evidence, who is affected, and how you would know it is solved.",
          time: "2-3 hours",
          skills: ["Problem framing", "Customer evidence", "Success measures"],
        },
        {
          id: "product-core",
          level: "core",
          title: "Define a product brief that balances customer value and team capacity",
          brief: "Write a concise product brief for a learner onboarding improvement, including the customer problem, success measure, and first release scope.",
          time: "3-5 hours",
          skills: ["Problem framing", "Prioritization", "Product strategy"],
        },
        {
          id: "product-stretch",
          level: "stretch",
          title: "Prioritize a quarter's roadmap with a scoring model",
          brief: "Score six candidate features with a transparent model, pick a scope that fits capacity, and explain what you deliberately left out.",
          time: "6-8 hours",
          skills: ["Scoring models", "Trade-off reasoning", "Stakeholder communication"],
        },
      ],
    },
  };

  const find = (id) => {
    for (const [track, config] of Object.entries(tracks)) {
      const challenge = config.challenges.find((item) => item.id === id);
      if (challenge) return { ...challenge, track };
    }
    return null;
  };

  const forTrack = (track) => tracks[track]?.challenges || tracks.frontend.challenges;

  const core = (track) => forTrack(track).find((item) => item.level === "core");

  // Next level up, or another stretch challenge when already at the top.
  // Prefers a challenge that targets the learner's weakest skill.
  const recommendNext = (track, currentId, weakestSkill) => {
    const current = find(currentId);
    const currentLevel = current?.level || "foundation";
    const nextLevel = levels[Math.min(levels.indexOf(currentLevel) + 1, levels.length - 1)];
    const candidates = forTrack(track).filter(
      (item) => item.level === nextLevel && item.id !== currentId,
    );
    return (
      candidates.find((item) => item.skills.includes(weakestSkill)) ||
      candidates[0] ||
      null
    );
  };

  const matchesTrack = (track, text) => {
    const lower = String(text || "").toLowerCase();
    return (tracks[track]?.keywords || []).filter((keyword) => lower.includes(keyword));
  };

  return {
    tracks,
    levels,
    find,
    forTrack,
    core,
    recommendNext,
    matchesTrack,
    label: (track) => tracks[track]?.label || "Frontend Engineer",
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftChallenges;
