// Career catalogue for Career DNA. Descriptions and typical skills are our
// general summaries, not salary or demand data. A career with a `track` has
// TechLift challenges; a career without one does not yet, and says so.
const TechLiftCareers = (() => {
  const interests = {
    "build-interfaces": "Building things people see and use",
    "understand-people": "Understanding how people think and behave",
    "work-with-numbers": "Finding patterns and answers in data",
    "solve-systems": "Working out how systems fit together and why they break",
    "protect-data": "Keeping information and systems safe",
    "keep-systems-running": "Keeping services available and reliable",
    "plan-projects": "Deciding what to do next and organising the work",
    "check-quality": "Finding problems before users do",
  };

  const styles = {
    building: "Hands-on, making things",
    analysing: "Examining evidence and detail",
    communicating: "Working with people and explaining ideas",
    planning: "Organising, prioritising, and deciding",
  };

  const existing = {
    coding: "I can write code",
    design: "I can sketch or design screens",
    data: "I can use spreadsheets or SQL",
    writing: "I can write clear requirements or briefs",
    troubleshooting: "I can fix computer and network problems",
  };

  const careers = [
    {
      id: "frontend",
      title: "Frontend developer",
      summary: "Builds the parts of websites and apps that people interact with, and makes them work on different screens.",
      interests: ["build-interfaces"],
      styles: ["building"],
      existing: ["coding", "design"],
      skills: ["HTML and CSS", "JavaScript", "Responsive layouts", "Accessibility"],
      track: "frontend",
      mapPath: "frontend",
    },
    {
      id: "backend",
      title: "Backend developer",
      summary: "Builds the server side of applications: the logic, data storage, and interfaces that the frontend relies on.",
      interests: ["solve-systems"],
      styles: ["building"],
      existing: ["coding"],
      skills: ["A server-side language", "Databases", "APIs", "Testing"],
      track: null,
      mapPath: null,
    },
    {
      id: "fullstack",
      title: "Full-stack developer",
      summary: "Works on both the interface and the server, and takes features from idea to working product.",
      interests: ["build-interfaces", "solve-systems"],
      styles: ["building"],
      existing: ["coding"],
      skills: ["HTML and CSS", "JavaScript", "Databases", "APIs"],
      track: null,
      mapPath: null,
    },
    {
      id: "uiux",
      title: "UI/UX designer",
      summary: "Works out what people need, then designs the screens and flows that meet those needs.",
      interests: ["understand-people", "build-interfaces"],
      styles: ["communicating", "building"],
      existing: ["design"],
      skills: ["User research", "Wireframing", "Visual hierarchy", "Usability testing"],
      track: "design",
      mapPath: "product",
    },
    {
      id: "data",
      title: "Data analyst",
      summary: "Turns data into answers and clear reports, dashboards, and recommendations for decisions.",
      interests: ["work-with-numbers"],
      styles: ["analysing"],
      existing: ["data"],
      skills: ["SQL", "Spreadsheets", "Charts and dashboards", "Explaining findings"],
      track: "data",
      mapPath: "data",
    },
    {
      id: "cybersecurity",
      title: "Cybersecurity analyst",
      summary: "Watches for threats, investigates incidents, and helps teams protect systems and information.",
      interests: ["protect-data", "solve-systems"],
      styles: ["analysing"],
      existing: ["troubleshooting"],
      skills: ["Networking basics", "Security fundamentals", "Incident handling", "Logs and monitoring"],
      track: null,
      mapPath: null,
    },
    {
      id: "cloud",
      title: "Cloud engineer",
      summary: "Designs and runs computing services in the cloud, including storage, networks, and access controls.",
      interests: ["keep-systems-running", "solve-systems"],
      styles: ["building"],
      existing: ["troubleshooting"],
      skills: ["Networking basics", "Linux command line", "Cloud platform basics", "Security basics"],
      track: null,
      mapPath: null,
    },
    {
      id: "devops",
      title: "DevOps engineer",
      summary: "Automates how software is built, tested, and released, and keeps those pipelines reliable.",
      interests: ["keep-systems-running"],
      styles: ["building"],
      existing: ["coding", "troubleshooting"],
      skills: ["Version control", "Scripting", "Automation", "Linux command line"],
      track: null,
      mapPath: null,
    },
    {
      id: "testing",
      title: "Software tester",
      summary: "Plans and carries out checks on software, and reports problems clearly so they get fixed.",
      interests: ["check-quality"],
      styles: ["analysing"],
      existing: [],
      skills: ["Test planning", "Bug reporting", "Basic scripting", "Attention to detail"],
      track: null,
      mapPath: null,
    },
    {
      id: "itsupport",
      title: "IT support specialist",
      summary: "Helps people with their computers, accounts, and software, and keeps everyday equipment working.",
      interests: ["keep-systems-running", "understand-people"],
      styles: ["communicating"],
      existing: ["troubleshooting"],
      skills: ["Hardware and operating systems", "Networking basics", "Customer communication", "Ticketing"],
      track: null,
      mapPath: null,
    },
    {
      id: "businessanalysis",
      title: "Business analyst",
      summary: "Works between people and teams to define what a system should do, and checks that it does it.",
      interests: ["understand-people", "plan-projects"],
      styles: ["communicating", "planning"],
      existing: ["writing"],
      skills: ["Requirements writing", "Process mapping", "Stakeholder communication", "Data analysis"],
      track: "product",
      mapPath: null,
    },
  ];

  const find = (id) => careers.find((career) => career.id === id) || null;

  return { careers, interests, styles, existing, find };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftCareers;
