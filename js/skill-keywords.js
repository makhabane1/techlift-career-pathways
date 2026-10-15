// Words that suggest a skill in a job advert. The decoder is keyword-based:
// it finds what is written, so it can miss a skill described in other words.
const TechLiftSkillKeywords = (() => {
  const skills = {
    "Semantic HTML": ["semantic html", "html5", "html", "accessible markup"],
    "CSS layout": ["css", "flexbox", "css grid", "layout"],
    "Visual hierarchy": ["visual hierarchy", "typography", "visual design"],
    "Responsive UI": ["responsive", "mobile-first", "breakpoints", "cross-browser"],
    "Interaction design": ["interaction design", "interactive", "micro-interactions", "prototype"],
    "Accessibility": ["accessibility", "accessible", "wcag", "screen reader", "a11y"],
    "JavaScript state": ["javascript", "state management", "typescript", "react", "vue"],
    "Form validation": ["form validation", "validation", "forms"],
    "Information architecture": ["information architecture", "navigation design", "content structure"],
    "Wireframing": ["wireframe", "wireframing", "low-fidelity"],
    "Clear labelling": ["content design", "microcopy", "clear labelling"],
    "User flows": ["user flow", "user journey", "customer journey", "journey mapping"],
    "Usability thinking": ["usability", "user-centred", "user-centered", "ux"],
    "Research planning": ["user research", "research plan", "interviews", "research"],
    "Synthesis": ["synthesis", "affinity mapping", "thematic analysis"],
    "Prioritizing problems": ["prioritise", "prioritize", "prioritisation", "prioritization"],
    "Data cleaning": ["data cleaning", "data quality", "data wrangling", "clean data"],
    "SQL basics": ["sql", "database", "queries", "postgres", "mysql"],
    "Chart choice": ["charts", "data visualisation", "data visualization", "visualisation", "visualization"],
    "Data storytelling": ["storytelling", "data story", "present insights", "stakeholder presentations"],
    "Dashboard design": ["dashboard", "power bi", "tableau", "looker", "reporting"],
    "Metric selection": ["metrics", "kpis", "kpi", "key performance"],
    "Hypothesis testing": ["a/b test", "ab testing", "hypothesis", "statistical significance", "statistics"],
    "Caveat writing": ["written communication", "report writing"],
    "Decision framing": ["decision-making", "decision making", "recommendations"],
    "Problem framing": ["problem definition", "problem statement", "discovery"],
    "Customer evidence": ["customer interviews", "customer feedback", "customer research"],
    "Success measures": ["okrs", "success metrics", "outcomes"],
    "Prioritization": ["roadmap", "backlog", "prioritisation", "product roadmap"],
    "Product strategy": ["product strategy", "product vision", "go-to-market"],
    "Scoring models": ["rice", "scoring", "weighted scoring"],
    "Trade-off reasoning": ["trade-offs", "trade-off", "tradeoffs"],
    "Stakeholder communication": ["stakeholder", "stakeholders", "communicate with"],
  };

  // Tools are shown as they are written, not mapped to skills.
  const tools = ["figma", "sketch", "adobe xd", "react", "vue", "angular", "typescript", "javascript", "html", "css", "git", "github", "excel", "power bi", "tableau", "looker", "sql", "python", "r", "jira", "notion", "miro", "google analytics"];

  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Finds each keyword as a whole word or phrase, so "r" does not match inside "research".
  const matches = (text, keyword) =>
    new RegExp(`(^|[^a-z0-9])${escape(keyword)}($|[^a-z0-9])`, "i").test(text);

  const decode = (text) => {
    const source = String(text || "").toLowerCase();
    const foundSkills = Object.entries(skills)
      .filter(([, words]) => words.some((word) => matches(source, word)))
      .map(([skill]) => skill);
    const foundTools = tools.filter((tool) => matches(source, tool));
    return { skills: foundSkills, tools: foundTools };
  };

  return { skills, tools, decode };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftSkillKeywords;
