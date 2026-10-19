// Challenge Lab content: what each challenge teaches and how a finished piece of work is judged.
// Acceptance criteria describe what a reviewer looks for. They are not automatic tests.
// Mentors score the skills listed in the challenge library against the rubric.
const TechLiftChallengeLab = (() => {
  const lab = {
    "frontend-foundation": {
      objectives: [
        "Write semantic HTML for a repeated component",
        "Use CSS to set spacing and hierarchy",
        "Add a visible hover state",
      ],
      acceptance: [
        "The card uses headings, a list or paragraph, and a link",
        "Spacing is consistent across all cards",
        "Hover and focus states are visible",
      ],
    },
    "frontend-core": {
      objectives: [
        "Lay out a hero with a clear hierarchy",
        "Make the layout respond to phone and desktop widths",
        "Write a call to action that is easy to find",
      ],
      acceptance: [
        "The page reads correctly at 390px and 1280px wide",
        "The main message and button are visually dominant",
        "No horizontal scrolling at either width",
      ],
    },
    "frontend-stretch": {
      objectives: [
        "Build a multi-step form with keyboard navigation",
        "Announce validation errors to screen readers",
        "Keep progress when the user goes back",
      ],
      acceptance: [
        "Every step can be completed with the keyboard alone",
        "Errors are linked to their fields and announced",
        "Going back does not lose entered values",
      ],
    },
    "design-foundation": {
      objectives: [
        "Map the steps of a first-run experience",
        "Sketch one wireframe per screen",
        "Explain one decision per screen",
      ],
      acceptance: [
        "Each screen shows one clear next action",
        "Labels say what will happen next",
        "Decisions are written as short notes beside the screens",
      ],
    },
    "design-core": {
      objectives: [
        "Map an enrolment journey from discovery to application",
        "Find and remove friction in the flow",
        "Explain the trade-offs behind each change",
      ],
      acceptance: [
        "The flow covers discovery, decision, and application",
        "At least three friction points are identified with evidence",
        "Each proposed change names the problem it solves",
      ],
    },
    "design-stretch": {
      objectives: [
        "Plan a usability test with a clear question",
        "Run it with three people",
        "Rank findings by severity and report them",
      ],
      acceptance: [
        "The test question and tasks are written before the sessions",
        "Findings cite what participants did, not opinions",
        "Each finding has a severity and a suggested fix",
      ],
    },
    "data-foundation": {
      objectives: [
        "Clean a messy export and document each fix",
        "Answer one question with a SQL query",
        "Chart the answer with a clear takeaway",
      ],
      acceptance: [
        "Duplicates, blanks, and wrong types are handled and listed",
        "The query result matches a hand-checked total",
        "The chart has labelled axes and one sentence of takeaway",
      ],
    },
    "data-core": {
      objectives: [
        "Choose a small set of metrics that answer a business question",
        "Build a dashboard around one decision",
        "Write the story a stakeholder needs",
      ],
      acceptance: [
        "Each metric has a written definition",
        "The dashboard leads with the metric that drives the decision",
        "The written story states what to do and why",
      ],
    },
    "data-stretch": {
      objectives: [
        "Check whether an A/B test difference is meaningful",
        "State the assumptions behind the conclusion",
        "Write the limits of the result",
      ],
      acceptance: [
        "The test used is named and its assumptions are checked",
        "The conclusion says whether the result is significant",
        "At least two limits of the data are stated",
      ],
    },
    "product-foundation": {
      objectives: [
        "Describe one customer problem with evidence",
        "Name who is affected",
        "Define how success would be measured",
      ],
      acceptance: [
        "The problem is stated without a solution in it",
        "At least one piece of evidence is cited",
        "The success measure is specific and can be checked",
      ],
    },
    "product-core": {
      objectives: [
        "Write a product brief for an onboarding improvement",
        "Balance customer value against team capacity",
        "Set the first release scope",
      ],
      acceptance: [
        "The brief names the customer problem and success measure",
        "The release scope states what is left out and why",
        "Capacity assumptions are written down",
      ],
    },
    "product-stretch": {
      objectives: [
        "Score candidate features with a stated model",
        "Choose a scope that fits capacity",
        "Explain what was deliberately left out",
      ],
      acceptance: [
        "The scoring criteria and weights are written",
        "The chosen scope matches the stated capacity",
        "Each excluded feature has a reason",
      ],
    },
    "backend-foundation": {
      prerequisites: [
        "Comfort reading JSON",
        "No server deployment is required",
      ],
      objectives: [
        "Define a small API contract",
        "Validate incoming data",
        "Return safe, useful responses",
      ],
      instructions: [
        "Write the endpoint and example request/response shapes",
        "List required fields and reject malformed input",
        "Show success, validation-error, and not-found responses",
      ],
      acceptance: [
        "The contract documents method, path, and fields",
        "Invalid input is rejected with a clear 4xx response",
        "Errors do not reveal secrets or internal stack details",
      ],
    },
    "backend-core": {
      prerequisites: [
        "Basic API and data-structure knowledge",
        "Use a local or fictional data store",
      ],
      objectives: [
        "Design CRUD endpoints",
        "Model task ownership",
        "Document access-control decisions",
      ],
      instructions: [
        "Define a task record and its owner",
        "Document list, create, update, and delete operations",
        "Describe how one user is prevented from changing another user's task",
      ],
      acceptance: [
        "Each endpoint has a request and response example",
        "Ownership is checked on every write",
        "Missing records and invalid fields have defined responses",
      ],
    },
    "backend-stretch": {
      prerequisites: [
        "Complete the backend foundation challenge",
        "Keep the work in a local test environment",
      ],
      objectives: [
        "Describe password and session handling",
        "Set expiry and logout behavior",
        "Test unauthorised requests",
      ],
      instructions: [
        "Sketch a sign-up and sign-in request flow",
        "State where password hashes and session tokens are stored",
        "Write tests for expiry, logout, and access without a session",
      ],
      acceptance: [
        "Plain-text passwords are never stored",
        "Sessions expire and can be revoked",
        "Private routes reject missing or invalid sessions",
      ],
    },
    "security-foundation": {
      prerequisites: [
        "Use only the fictional event log supplied by your mentor or create clearly labelled sample rows",
      ],
      objectives: [
        "Find unusual patterns in a log",
        "Separate evidence from assumptions",
        "Write a useful triage note",
      ],
      instructions: [
        "Record the event fields you reviewed",
        "List suspicious patterns and benign explanations",
        "Request the next piece of evidence that would help confirm the alert",
      ],
      acceptance: [
        "Every claim refers to a log field or timestamp",
        "Uncertainty is clearly labelled",
        "No real accounts, systems, or credentials are tested",
      ],
    },
    "security-core": {
      prerequisites: ["Understand basic account security and incident triage"],
      objectives: [
        "Prioritise containment",
        "Preserve evidence",
        "Plan recovery and communication",
      ],
      instructions: [
        "Use the fictional exposed test credential scenario",
        "Write actions for the first hour and following day",
        "Include owner, communication, and verification steps",
      ],
      acceptance: [
        "Containment does not destroy evidence unnecessarily",
        "Credential rotation and access review are included",
        "Recovery is verified before normal use resumes",
      ],
    },
    "security-stretch": {
      prerequisites: [
        "Use a fictional learning app design; do not scan or attack real systems",
      ],
      objectives: [
        "Identify assets and trust boundaries",
        "Describe plausible misuse",
        "Select practical mitigations",
      ],
      instructions: [
        "Draw the main data flows and trust boundaries",
        "List threats with affected assets and likely impact",
        "Map each priority threat to one preventive or detective control",
      ],
      acceptance: [
        "Threats are specific to the described system",
        "Controls address the stated threat",
        "The report is defensive and contains no real exploitation steps",
      ],
    },
    "testing-foundation": {
      prerequisites: [
        "No coding is required; use the supplied form requirements",
      ],
      objectives: [
        "Cover valid and invalid input",
        "Check boundaries and keyboard access",
        "Write repeatable test cases",
      ],
      instructions: [
        "List the important form fields and constraints",
        "Write steps, test data, and expected results",
        "Include at least one keyboard-only check and one boundary case",
      ],
      acceptance: [
        "Cases cover success, invalid data, and boundaries",
        "Each case can be repeated by another tester",
        "Expected results are observable and unambiguous",
      ],
    },
    "testing-core": {
      prerequisites: [
        "Work from the fictional defect prompt; no access to a production service is needed",
      ],
      objectives: [
        "Make the defect reproducible",
        "Separate expected from actual behavior",
        "Explain user impact",
      ],
      instructions: [
        "Record environment and starting state",
        "Write numbered reproduction steps with exact inputs",
        "Attach expected/actual behavior and severity rationale",
      ],
      acceptance: [
        "A second person can reproduce the issue from the report",
        "Evidence avoids personal or sensitive data",
        "Severity is explained by impact, not preference",
      ],
    },
    "testing-stretch": {
      prerequisites: [
        "Complete a basic manual test plan",
        "Do not claim tests execute unless you used a real runner",
      ],
      objectives: [
        "Prioritise release risk",
        "Choose regression coverage",
        "Distinguish manual and automatable checks",
      ],
      instructions: [
        "List changed areas and likely failure impact",
        "Rank checks by likelihood and consequence",
        "Mark proposed automation separately from tests actually run",
      ],
      acceptance: [
        "High-risk user paths receive coverage",
        "Trade-offs are recorded",
        "No unrun automated tests are reported as passing",
      ],
    },
  };

  // Difficulty follows the challenge level
  const difficulty = {
    foundation: "Starter",
    core: "Intermediate",
    stretch: "Advanced",
  };

  const forChallenge = (id) =>
    lab[id] || {
      prerequisites: [],
      objectives: [],
      instructions: [],
      acceptance: [],
    };

  return { lab, difficulty, forChallenge };
})();

if (typeof module !== "undefined" && module.exports)
  module.exports = TechLiftChallengeLab;
