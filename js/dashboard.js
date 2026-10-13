document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(
    localStorage.getItem("techliftUser") || "null",
  ) || {
    fullName: "Maya Patel",
    path: "frontend",
    goal: "Switch careers",
    availability: "10 hours/week",
  };

  const firstName =
    (userData.fullName || "Maya Patel").trim().split(" ")[0] || "Maya";
  const pathConfig = {
    frontend: {
      label: "Frontend",
      headline: "You’re on track for a frontend career.",
      goal: "Build interfaces that people love using.",
      streak: "18 days",
      courses: "3 / 7",
      nextSession: "Wed 7:30 PM",
      mentor: "4.9 / 5",
      milestone: "Portfolio Sprint",
      milestonePercent: "72%",
      roadmap: [
        { title: "HTML foundations", status: "Complete" },
        { title: "CSS design systems", status: "Complete" },
        { title: "JavaScript interactivity", status: "In progress" },
        { title: "React fundamentals", status: "Next" },
        { title: "Portfolio review", status: "Coming up" },
      ],
      challenge: "Build a responsive hero section",
      challengeBrief:
        "Create a landing page for a new learning product with a clear hierarchy, a strong call to action, and a responsive layout.",
      challengeSkills: [
        "Responsive UI",
        "Visual hierarchy",
        "Interaction design",
      ],
      mentorNote:
        "Focus on clarity. Your strongest improvement area is simplifying your layout structure before adding animation.",
    },
    design: {
      label: "Design",
      headline: "You’re shaping thoughtful experiences for real users.",
      goal: "Turn research into product clarity and polished design systems.",
      streak: "14 days",
      courses: "2 / 6",
      nextSession: "Thu 6:00 PM",
      mentor: "5.0 / 5",
      milestone: "UX Sprint",
      milestonePercent: "68%",
      roadmap: [
        { title: "Research foundations", status: "Complete" },
        { title: "Wireframing flows", status: "Complete" },
        { title: "Design systems", status: "In progress" },
        { title: "Prototype testing", status: "Next" },
        { title: "Portfolio critique", status: "Coming up" },
      ],
      challenge: "Create a conversion-focused landing flow",
      challengeBrief:
        "Improve the enrollment journey for a learning platform. Show how a new learner discovers a program and confidently applies.",
      challengeSkills: ["User flows", "Wireframing", "Usability thinking"],
      mentorNote:
        "Your strongest work is in clarity and tone. Keep simplifying the interaction flow before layering visual polish.",
    },
    data: {
      label: "Data",
      challengeBrief:
        "Turn a small set of business metrics into a dashboard that helps a team spot a trend and decide what to do next.",
      challengeSkills: [
        "Data storytelling",
        "Dashboard design",
        "Metric selection",
      ],
      headline: "You’re building the skill to turn numbers into decisions.",
      goal: "Translate insight into dashboards and better product decisions.",
      streak: "21 days",
      courses: "4 / 8",
      nextSession: "Tue 8:00 PM",
      mentor: "4.8 / 5",
      milestone: "Insight Sprint",
      milestonePercent: "76%",
      roadmap: [
        { title: "SQL essentials", status: "Complete" },
        { title: "Dashboard building", status: "Complete" },
        { title: "Analytic storytelling", status: "In progress" },
        { title: "A/B testing", status: "Next" },
        { title: "Portfolio review", status: "Coming up" },
      ],
      challenge: "Map a business dashboard that turns data into action",
      mentorNote:
        "Your reporting is strong. Keep refining the narrative so stakeholders can act on the insight quickly.",
    },
    product: {
      label: "Product",
      headline: "You’re building the product lens that brings teams together.",
      goal: "Lead roadmap decisions, customer insight, and execution across teams.",
      streak: "16 days",
      courses: "2 / 5",
      nextSession: "Fri 5:30 PM",
      mentor: "4.9 / 5",
      milestone: "Roadmap Sprint",
      milestonePercent: "70%",
      roadmap: [
        { title: "Customer discovery", status: "Complete" },
        { title: "Problem framing", status: "Complete" },
        { title: "Roadmap design", status: "In progress" },
        { title: "Prioritization", status: "Next" },
        { title: "Case study", status: "Coming up" },
      ],
      challenge:
        "Define a product brief that balances customer value and team capacity",
      challengeBrief:
        "Write a concise product brief for a learner onboarding improvement, including the customer problem, success measure, and first release scope.",
      challengeSkills: [
        "Problem framing",
        "Prioritization",
        "Product strategy",
      ],
      mentorNote:
        "Your product thinking is structured and strategic. Next, tighten your decision criteria so priorities feel sharper.",
    },
  };

  const config = pathConfig[userData.path] || pathConfig.frontend;

  const dashboardName = document.getElementById("dashboardName");
  const dashboardSummary = document.getElementById("dashboardSummary");
  const dashboardTrackStat = document.getElementById("dashboardTrackStat");
  const dashboardTrackBadge = document.getElementById("dashboardTrackBadge");
  const dashboardMilestone = document.getElementById("dashboardMilestone");
  const dashboardPercent = document.getElementById("dashboardPercent");
  const dashboardGoal = document.getElementById("dashboardGoal");
  const dashboardStreak = document.getElementById("dashboardStreak");
  const dashboardCourses = document.getElementById("dashboardCourses");
  const dashboardSession = document.getElementById("dashboardSession");
  const dashboardMentor = document.getElementById("dashboardMentor");
  const roadmapList = document.getElementById("roadmapList");
  const challengeTitle = document.getElementById("challengeTitle");
  const challengeBrief = document.getElementById("challengeBrief");
  const challengeSkills = document.getElementById("challengeSkills");
  const mentorNoteText = document.getElementById("mentorNoteText");

  if (dashboardName)
    dashboardName.textContent = `${firstName}, your next step is ready.`;
  if (dashboardSummary) dashboardSummary.textContent = config.headline;
  if (dashboardTrackStat)
    dashboardTrackStat.textContent = `${config.label} track`;
  if (dashboardTrackBadge) dashboardTrackBadge.textContent = config.label;
  if (dashboardMilestone) dashboardMilestone.textContent = config.milestone;
  if (dashboardPercent) dashboardPercent.textContent = config.milestonePercent;
  if (dashboardGoal) dashboardGoal.textContent = config.goal;
  if (dashboardStreak) dashboardStreak.textContent = config.streak;
  if (dashboardCourses) dashboardCourses.textContent = config.courses;
  if (dashboardSession) dashboardSession.textContent = config.nextSession;
  if (dashboardMentor) dashboardMentor.textContent = config.mentor;

  if (roadmapList) {
    roadmapList.innerHTML = config.roadmap
      .map(
        (item) => `
          <li class="${item.status === "Complete" ? "done" : item.status === "In progress" ? "active" : ""}">
            <span class="dot"></span>
            <div>
              <strong>${item.title}</strong>
              <small>${item.status}</small>
            </div>
          </li>
        `,
      )
      .join("");
  }

  if (challengeTitle) challengeTitle.textContent = config.challenge;
  if (challengeBrief) challengeBrief.textContent = config.challengeBrief;
  if (challengeSkills) {
    challengeSkills.innerHTML = config.challengeSkills
      .map((skill) => `<span>${skill}</span>`)
      .join("");
  }
  if (mentorNoteText) mentorNoteText.textContent = config.mentorNote;

  const userGoalEl = document.getElementById("userGoal");
  if (userGoalEl) userGoalEl.textContent = userData.goal || "Switch careers";

  const userAvailability = document.getElementById("userAvailability");
  if (userAvailability)
    userAvailability.textContent = userData.availability || "10 hours/week";

  const challengeForm = document.getElementById("challengeForm");
  const challengeSubmission = document.getElementById("challengeSubmission");
  const challengeUrl = document.getElementById("challengeUrl");
  const challengeStatus = document.getElementById("challengeStatus");
  const challengeSubmit = document.getElementById("challengeSubmit");
  const submissionFeedback = document.getElementById("submissionFeedback");
  const submissionKey = `techliftChallenge:${userData.email || "guest"}`;

  const savedSubmission = JSON.parse(
    localStorage.getItem(submissionKey) || "null",
  );
  if (savedSubmission) {
    challengeSubmission.value = savedSubmission.description;
    challengeUrl.value = savedSubmission.url || "";
    if (savedSubmission.review?.status === "approved") {
      challengeStatus.textContent = "Approved";
      challengeStatus.classList.add("is-approved");
      challengeSubmit.textContent = "Update submission";
      submissionFeedback.textContent = `Mentor feedback: ${savedSubmission.review.feedback}`;
    } else if (savedSubmission.review?.status === "changes") {
      challengeStatus.textContent = "Changes requested";
      challengeStatus.classList.add("is-changes-requested");
      challengeSubmit.textContent = "Resubmit work";
      submissionFeedback.textContent = `Mentor feedback: ${savedSubmission.review.feedback}`;
    } else {
      challengeStatus.textContent = "In mentor review";
      challengeStatus.classList.add("is-submitted");
      challengeSubmit.textContent = "Update submission";
      submissionFeedback.textContent =
        "Submitted. Your mentor will review this work and add verified skills to your portfolio.";
    }
  }

  challengeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!challengeForm.reportValidity()) return;

    const submission = {
      description: challengeSubmission.value.trim(),
      url: challengeUrl.value.trim(),
      challenge: config.challenge,
      path: userData.path || "frontend",
      fullName: userData.fullName || firstName,
      email: userData.email || "",
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(submissionKey, JSON.stringify(submission));
    challengeStatus.textContent = "In mentor review";
    challengeStatus.classList.add("is-submitted");
    challengeStatus.classList.remove("is-approved", "is-changes-requested");
    challengeSubmit.textContent = "Update submission";
    submissionFeedback.textContent =
      "Submitted. Your mentor will review this work and add verified skills to your portfolio.";
  });
});
