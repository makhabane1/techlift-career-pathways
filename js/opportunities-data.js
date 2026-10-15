// Places to look for work, study, and support in South Africa and online.
// This is a directory, not a job feed: TechLift does not hold live listings.
// Each link is a general site; search there for current roles. Check that a
// link still works before sharing it.
const TechLiftOpportunities = (() => {
  const sources = [
    { name: "PNet", url: "https://www.pnet.co.za", type: "jobs", region: "South Africa", use: "Job search across many sectors" },
    { name: "CareerJunction", url: "https://www.careerjunction.co.za", type: "jobs", region: "South Africa", use: "Job search and recruiter listings" },
    { name: "Indeed South Africa", url: "https://za.indeed.com", type: "jobs", region: "South Africa", use: "Entry-level and graduate roles" },
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs", type: "jobs", region: "South Africa and remote", use: "Roles, internships, and company pages" },
    { name: "National Youth Development Agency (NYDA)", url: "https://www.nyda.gov.za", type: "support", region: "South Africa", use: "Youth programmes, funding, and opportunities" },
    { name: "gov.za", url: "https://www.gov.za", type: "support", region: "South Africa", use: "Official government information, including training and learnership schemes" },
    { name: "We Work Remotely", url: "https://weworkremotely.com", type: "remote", region: "Remote", use: "Remote roles in tech and design" },
    { name: "Remote OK", url: "https://remoteok.com", type: "remote", region: "Remote", use: "Remote roles across tech" },
    { name: "Google Career Certificates", url: "https://grow.google/certificates", type: "learning", region: "Online", use: "Certificates in IT support, data, UX and project management" },
  ];

  const types = {
    jobs: "Job boards",
    support: "Government and youth support",
    remote: "Remote work",
    learning: "Certificates and courses",
  };

  // Tips that do not depend on any one site.
  const tips = [
    "Learnerships and graduate programmes are usually advertised on each company's own careers page, and through the SETA for your sector. Search the company name plus 'graduate programme' or 'learnership'.",
    "Use the Opportunity decoder on a real advert to see which skills it asks for, then check your route for gaps.",
    "Keep a list of the sites you searched and when. Job adverts close quickly.",
  ];

  return { sources, types, tips };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftOpportunities;
