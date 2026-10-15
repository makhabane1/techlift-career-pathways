// Rubric anchors: what each score (1-4) looks like for every skill.
// Mentors and peers read these before scoring so that "3" means the same
// thing to everyone. Keep each line about something a reviewer can see in the work.
const TechLiftRubric = (() => {
  const levelNames = { 1: "Not yet", 2: "Developing", 3: "Proficient", 4: "Exemplary" };

  const anchors = {
    "Semantic HTML": [
      "Page is built from generic containers, or headings and landmarks are missing.",
      "Some correct elements, but headings skip levels or lists and buttons are misused.",
      "Headings, landmarks, lists, and buttons are used correctly throughout.",
      "Structure is clean and screen readers can navigate it by landmark and heading.",
    ],
    "CSS layout": [
      "Layout relies on fixed positions or floats that break when content changes.",
      "Flexbox or grid is used, but spacing is inconsistent or needs manual fixes.",
      "Flexbox or grid handles the layout, with consistent spacing and no overlapping.",
      "Layout adapts cleanly to different sizes with a clear, reusable system behind it.",
    ],
    "Visual hierarchy": [
      "Everything has similar weight, so it is hard to tell what to read first.",
      "There is a heading and a button, but size or colour does not clearly guide the eye.",
      "Size, weight, and spacing clearly show the main message and next action.",
      "Hierarchy is deliberate at every level, and removing any element would weaken it.",
    ],
    "Responsive UI": [
      "Layout breaks or needs horizontal scrolling on a phone-sized screen.",
      "Works on phone and desktop, but some content is cramped or hidden.",
      "Layout reflows cleanly at phone, tablet, and desktop widths, with no scrolling.",
      "Responsive behaviour is tested at several widths and content lengths, with sensible fallbacks.",
    ],
    "Interaction design": [
      "Controls do nothing visible when used, or their purpose is unclear.",
      "Basic hover or click feedback exists, but states such as focus or disabled are missing.",
      "Hover, focus, active, and disabled states are present and consistent.",
      "Interactions give timely, clear feedback and recover gracefully from mistakes.",
    ],
    "Accessibility": [
      "Images, controls, or colours are missing labels or have too little contrast.",
      "Some labels and contrast are right, but keyboard use or focus order is not checked.",
      "Keyboard navigation, focus, labels, and contrast all meet WCAG AA in the parts shown.",
      "Accessibility is tested with a keyboard and a screen reader, and issues are documented.",
    ],
    "JavaScript state": [
      "State is scattered across the page, so changes often leave the UI out of sync.",
      "State lives in one place, but some updates are missed or repeated.",
      "State is kept in one place and every change updates the UI correctly.",
      "State changes are predictable, easy to follow, and survive reloads where needed.",
    ],
    "Form validation": [
      "Forms accept empty or invalid input, or give no message when something is wrong.",
      "Some fields are checked, but error messages are vague or appear in the wrong place.",
      "Each field is checked, with a clear message next to the field that needs fixing.",
      "Errors are announced to screen readers, and the form guides the person to fix them.",
    ],
    "Information architecture": [
      "Content is organised by how it was written rather than how people look for it.",
      "Main sections are clear, but some pages or labels overlap or are hard to find.",
      "Content is grouped by user goals, with labels that match how people think about it.",
      "Structure is tested against real tasks, and people find things without help.",
    ],
    "Wireframing": [
      "Screens are missing key elements or show no clear layout decisions.",
      "Every screen is present, but layouts are rough or the decisions are not explained.",
      "Each screen is sketched with a clear layout, and the key decisions are noted.",
      "Wireframes show alternatives and trade-offs, and they connect to the user flow.",
    ],
    "Clear labelling": [
      "Labels are vague or use internal jargon, so people cannot tell what will happen.",
      "Most labels are understandable, but some buttons or headings are unclear.",
      "Labels are short, specific, and say what will happen next.",
      "Labels are tested with people and match the words they use.",
    ],
    "User flows": [
      "Steps are missing, out of order, or lead to dead ends.",
      "The main path works, but edge cases such as errors or going back are missing.",
      "The main path and key edge cases are mapped, with a clear start and end.",
      "Flows cover alternatives, errors, and recovery, and are checked against real use.",
    ],
    "Usability thinking": [
      "Design decisions are not connected to what users need or struggle with.",
      "Some decisions cite user needs, but the reasoning is thin or untested.",
      "Decisions are tied to specific user needs and evidence, and the reasoning is clear.",
      "Trade-offs are weighed explicitly and the design is revised after feedback.",
    ],
    "Research planning": [
      "No clear question or method; the plan would not answer anything specific.",
      "A question and method are named, but participants or tasks are vague.",
      "Clear questions, a suitable method, and a defined participant group are planned.",
      "The plan states how findings will be judged and what would change the design.",
    ],
    "Synthesis": [
      "Notes are listed without grouping, so no patterns are visible.",
      "Some themes are named, but they are not backed by specific observations.",
      "Observations are grouped into themes, each linked to evidence.",
      "Themes are ranked by impact and clearly connected to recommendations.",
    ],
    "Prioritizing problems": [
      "Problems are listed without any ranking or reason for the order.",
      "Problems are ranked, but the criteria are unclear or inconsistent.",
      "Problems are ranked by severity and frequency, with the criteria stated.",
      "Ranking is explained clearly and mapped to fixes with effort and impact estimates.",
    ],
    "Data cleaning": [
      "Data is used as exported, with duplicates, nulls, and wrong types left in place.",
      "Some issues are fixed, but others that change the results are missed.",
      "Duplicates, nulls, and types are fixed, and each change is documented.",
      "Cleaning is repeatable, checked against source totals, and records what was dropped and why.",
    ],
    "SQL basics": [
      "Queries fail or return results that do not match the question.",
      "Queries run and return results, but joins or filters are sometimes wrong.",
      "Queries use correct joins, filters, and grouping for the question asked.",
      "Queries are clear, efficient, and checked against a known answer.",
    ],
    "Chart choice": [
      "Chart type does not suit the data, such as a pie chart with many categories.",
      "A workable chart is used, but it hides the trend or adds clutter.",
      "Chart type matches the question, with clear axes and labels.",
      "Chart choice is justified, shows the key comparison directly, and avoids distortion.",
    ],
    "Data storytelling": [
      "Charts are shown with no explanation of what they mean.",
      "A takeaway is given, but it is generic or not tied to the chart.",
      "A clear takeaway is stated and supported by the chart.",
      "The story has a clear problem, evidence, and a specific recommendation for the audience.",
    ],
    "Dashboard design": [
      "Dashboard shows many numbers with no clear purpose or hierarchy.",
      "Key numbers are visible, but layout and filters make it hard to act on.",
      "Key metrics lead, filters are relevant, and the layout supports a clear decision.",
      "Dashboard is designed for a specific audience and decision, and is tested with them.",
    ],
    "Metric selection": [
      "Metrics are chosen without linking them to the goal they measure.",
      "Metrics relate to the goal, but some are vanity measures or ambiguous.",
      "Metrics are tied to the goal, with definitions stated and a clear rationale.",
      "Metrics balance leading and lagging indicators and guard against gaming.",
    ],
    "Hypothesis testing": [
      "Results are reported with no test, or the wrong test is used.",
      "A test is run, but assumptions or sample size are not checked.",
      "The right test is chosen, assumptions are checked, and the result is interpreted correctly.",
      "Power, effect size, and multiple comparisons are considered, with clear conclusions.",
    ],
    "Caveat writing": [
      "Results are presented as certain, with no limits mentioned.",
      "A caveat is mentioned, but it is vague or does not change the conclusion.",
      "Specific limits of the data and method are stated and linked to the conclusion.",
      "Caveats are ranked by impact, and the write-up says what would settle each one.",
    ],
    "Decision framing": [
      "The write-up ends with results and does not say what to do.",
      "A recommendation is given, but the options or criteria are not clear.",
      "Options, criteria, and a recommendation are set out for the decision-maker.",
      "The decision is framed with costs, risks, and a clear next step with an owner.",
    ],
    "Problem framing": [
      "The problem is stated as a solution, or it is not clear who is affected.",
      "The problem is named, but the evidence or the affected group is thin.",
      "The problem is clear, the affected group is named, and evidence supports it.",
      "The problem is sized, its causes are separated from symptoms, and alternatives are considered.",
    ],
    "Customer evidence": [
      "Claims about customers have no source.",
      "Some evidence is given, but it is anecdotal or from a single source.",
      "Several sources support the claims, and their limits are noted.",
      "Evidence is triangulated across sources and tested with real customers.",
    ],
    "Success measures": [
      "No measure of success is given, or it cannot be checked.",
      "A measure is given, but no target or time frame is set.",
      "A measurable target and time frame are set, linked to the problem.",
      "Measures include guardrails, and the team agrees how a miss would be handled.",
    ],
    "Prioritization": [
      "Items are listed with no reason for the order.",
      "Some reasons are given, but the order is inconsistent with them.",
      "Items are ordered with stated criteria such as value and effort.",
      "Trade-offs are explicit, and the order is tested against capacity and risk.",
    ],
    "Product strategy": [
      "Work is described as features with no link to a goal.",
      "A goal is named, but the plan does not clearly serve it.",
      "The plan links the goal, the customer problem, and the chosen scope.",
      "The strategy explains what is not being done and why, and how it will be reviewed.",
    ],
    "Scoring models": [
      "Items are scored with no stated method or inconsistent scales.",
      "A method is used, but the criteria or weights are unclear.",
      "Criteria, scales, and weights are stated and applied consistently.",
      "The model is tested for sensitivity, and its assumptions are shared with stakeholders.",
    ],
    "Trade-off reasoning": [
      "Choices are made without naming what is given up.",
      "Some costs are named, but the reasoning for the choice is weak.",
      "Costs and benefits of each option are named, and the choice follows from them.",
      "Trade-offs are compared against clear priorities, and the reasoning is open to challenge.",
    ],
    "Stakeholder communication": [
      "The update is unclear about the ask, the decision, or the timing.",
      "The main message is there, but it is long or mixes the audience's needs.",
      "The message is short, names the decision needed, and suits the audience.",
      "The message anticipates objections and gives each stakeholder what they need to act.",
    ],
  };

  // Full wording for a skill and score, or the plain level name if none is written.
  const anchor = (skill, score) => {
    const lines = anchors[skill];
    const index = Number(score) - 1;
    return lines && lines[index] ? lines[index] : levelNames[score] || "";
  };

  const levelName = (score) => levelNames[score] || "";

  return { anchors, anchor, levelName };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftRubric;
