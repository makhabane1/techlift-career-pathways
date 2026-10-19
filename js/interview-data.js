const TechLiftInterview = (() => {
  const behavioral = [
    [
      "team-disagreement",
      "Tell me about a time you worked through a disagreement with someone on a team.",
    ],
    [
      "learned-from-mistake",
      "Describe a mistake you made and what you changed afterward.",
    ],
    [
      "competing-priorities",
      "Tell me about a time you had to prioritise competing responsibilities.",
    ],
  ].map(([id, prompt]) => ({ id, prompt }));

  const questions = {
    frontend: {
      technical: [
        [
          "accessible-form",
          "How would you make a form usable with a keyboard and screen reader?",
        ],
        [
          "responsive-layout",
          "How would you investigate a layout that breaks on a small screen?",
        ],
      ],
      scenario: [
        [
          "slow-page",
          "A page feels slow on a learner's phone. What would you inspect and improve first?",
        ],
      ],
    },
    backend: {
      technical: [
        [
          "api-validation",
          "What should an API validate before it stores a new record?",
        ],
        [
          "api-errors",
          "How would you design useful error responses for a client using your API?",
        ],
      ],
      scenario: [
        [
          "duplicate-request",
          "A client retries a request and creates duplicate records. How would you investigate and prevent it?",
        ],
      ],
    },
    fullstack: {
      technical: [
        [
          "request-lifecycle",
          "Walk through what happens from a form submission to a saved database record.",
        ],
        [
          "api-contract",
          "How do you keep the frontend and backend aligned when an API response changes?",
        ],
      ],
      scenario: [
        [
          "feature-delivery",
          "A feature works locally but fails after deployment. How would you narrow down the cause?",
        ],
      ],
    },
    uiux: {
      technical: [
        [
          "usability-evidence",
          "How would you test whether a redesigned checkout flow is easier to use?",
        ],
        [
          "design-tradeoff",
          "How do you explain a design decision when accessibility and visual preference conflict?",
        ],
      ],
      scenario: [
        [
          "confusing-flow",
          "Users abandon a signup flow at step two. What would you learn before changing the design?",
        ],
      ],
    },
    data: {
      technical: [
        [
          "data-quality",
          "What checks would you make before analysing a new dataset?",
        ],
        [
          "chart-choice",
          "How would you choose a chart to compare changes over time across several groups?",
        ],
      ],
      scenario: [
        [
          "conflicting-metrics",
          "Two dashboards show different totals for the same measure. How would you investigate?",
        ],
      ],
    },
    cybersecurity: {
      technical: [
        [
          "suspicious-login",
          "What evidence would you review after a report of suspicious account logins?",
        ],
        [
          "least-privilege",
          "Explain least privilege and one practical way to apply it.",
        ],
      ],
      scenario: [
        [
          "security-alert",
          "A monitoring alert may indicate exposed credentials. What defensive steps would you take first?",
        ],
      ],
    },
    cloud: {
      technical: [
        [
          "cloud-access",
          "How would you limit access to a cloud storage bucket containing private files?",
        ],
        [
          "service-health",
          "Which signals would you check when a cloud service becomes unreliable?",
        ],
      ],
      scenario: [
        [
          "unexpected-cost",
          "A cloud bill rises unexpectedly. How would you find the cause without disrupting users?",
        ],
      ],
    },
    devops: {
      technical: [
        [
          "deployment-pipeline",
          "What checks would you include before a change is deployed to production?",
        ],
        [
          "rollback",
          "How would you plan a safe rollback for a release that causes errors?",
        ],
      ],
      scenario: [
        [
          "failing-build",
          "A deployment pipeline starts failing after a dependency update. How would you diagnose it?",
        ],
      ],
    },
    testing: {
      technical: [
        [
          "test-cases",
          "How would you choose test cases for a form with several validation rules?",
        ],
        [
          "bug-report",
          "What makes a bug report reproducible and useful to a developer?",
        ],
      ],
      scenario: [
        [
          "intermittent-bug",
          "A defect happens only occasionally and cannot be reproduced on demand. What would you do next?",
        ],
      ],
    },
    itsupport: {
      technical: [
        [
          "network-troubleshooting",
          "How would you troubleshoot a user's intermittent network connection?",
        ],
        [
          "account-access",
          "What checks would you make when a user cannot access a work account?",
        ],
      ],
      scenario: [
        [
          "urgent-support",
          "Several people report the same outage while one person has an urgent deadline. How would you respond?",
        ],
      ],
    },
    businessanalysis: {
      technical: [
        [
          "requirements-clarity",
          "How do you turn an ambiguous request into testable requirements?",
        ],
        [
          "process-mapping",
          "What would you include in a process map before recommending a change?",
        ],
      ],
      scenario: [
        [
          "stakeholder-conflict",
          "Two stakeholders want conflicting outcomes from a feature. How would you help them reach a decision?",
        ],
      ],
    },
  };

  const questionsFor = (careerId, category) => {
    if (category === "behavioral") return behavioral;
    return (
      questions[careerId]?.[category] ||
      questions.frontend[category] ||
      []
    ).map(([id, prompt]) => ({ id, prompt }));
  };

  return { questionsFor };
})();

if (typeof module !== "undefined" && module.exports)
  module.exports = TechLiftInterview;
