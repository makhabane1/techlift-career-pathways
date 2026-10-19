// Challenge Lab content: what each challenge teaches and how a finished piece of work is judged.
// Acceptance criteria describe what a reviewer looks for. They are not automatic tests.
// Mentors score the skills listed in the challenge library against the rubric.
const TechLiftChallengeLab = (() => {
  const lab = {
    "frontend-foundation": {
      objectives: ["Write semantic HTML for a repeated component", "Use CSS to set spacing and hierarchy", "Add a visible hover state"],
      acceptance: ["The card uses headings, a list or paragraph, and a link", "Spacing is consistent across all cards", "Hover and focus states are visible"],
    },
    "frontend-core": {
      objectives: ["Lay out a hero with a clear hierarchy", "Make the layout respond to phone and desktop widths", "Write a call to action that is easy to find"],
      acceptance: ["The page reads correctly at 390px and 1280px wide", "The main message and button are visually dominant", "No horizontal scrolling at either width"],
    },
    "frontend-stretch": {
      objectives: ["Build a multi-step form with keyboard navigation", "Announce validation errors to screen readers", "Keep progress when the user goes back"],
      acceptance: ["Every step can be completed with the keyboard alone", "Errors are linked to their fields and announced", "Going back does not lose entered values"],
    },
    "design-foundation": {
      objectives: ["Map the steps of a first-run experience", "Sketch one wireframe per screen", "Explain one decision per screen"],
      acceptance: ["Each screen shows one clear next action", "Labels say what will happen next", "Decisions are written as short notes beside the screens"],
    },
    "design-core": {
      objectives: ["Map an enrolment journey from discovery to application", "Find and remove friction in the flow", "Explain the trade-offs behind each change"],
      acceptance: ["The flow covers discovery, decision, and application", "At least three friction points are identified with evidence", "Each proposed change names the problem it solves"],
    },
    "design-stretch": {
      objectives: ["Plan a usability test with a clear question", "Run it with three people", "Rank findings by severity and report them"],
      acceptance: ["The test question and tasks are written before the sessions", "Findings cite what participants did, not opinions", "Each finding has a severity and a suggested fix"],
    },
    "data-foundation": {
      objectives: ["Clean a messy export and document each fix", "Answer one question with a SQL query", "Chart the answer with a clear takeaway"],
      acceptance: ["Duplicates, blanks, and wrong types are handled and listed", "The query result matches a hand-checked total", "The chart has labelled axes and one sentence of takeaway"],
    },
    "data-core": {
      objectives: ["Choose a small set of metrics that answer a business question", "Build a dashboard around one decision", "Write the story a stakeholder needs"],
      acceptance: ["Each metric has a written definition", "The dashboard leads with the metric that drives the decision", "The written story states what to do and why"],
    },
    "data-stretch": {
      objectives: ["Check whether an A/B test difference is meaningful", "State the assumptions behind the conclusion", "Write the limits of the result"],
      acceptance: ["The test used is named and its assumptions are checked", "The conclusion says whether the result is significant", "At least two limits of the data are stated"],
    },
    "product-foundation": {
      objectives: ["Describe one customer problem with evidence", "Name who is affected", "Define how success would be measured"],
      acceptance: ["The problem is stated without a solution in it", "At least one piece of evidence is cited", "The success measure is specific and can be checked"],
    },
    "product-core": {
      objectives: ["Write a product brief for an onboarding improvement", "Balance customer value against team capacity", "Set the first release scope"],
      acceptance: ["The brief names the customer problem and success measure", "The release scope states what is left out and why", "Capacity assumptions are written down"],
    },
    "product-stretch": {
      objectives: ["Score candidate features with a stated model", "Choose a scope that fits capacity", "Explain what was deliberately left out"],
      acceptance: ["The scoring criteria and weights are written", "The chosen scope matches the stated capacity", "Each excluded feature has a reason"],
    },
  };

  // Difficulty follows the challenge level
  const difficulty = { foundation: "Starter", core: "Intermediate", stretch: "Advanced" };

  const forChallenge = (id) => lab[id] || { objectives: [], acceptance: [] };

  return { lab, difficulty, forChallenge };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftChallengeLab;
