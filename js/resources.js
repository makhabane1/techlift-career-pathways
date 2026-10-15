// Learning resources, grouped by track. These are well-known public sites,
// listed as starting points. They have NOT been checked live for current
// content or price, so verify the link and cost before relying on them.
const TechLiftResources = (() => {
  const note = "Check the price and content on the site before you commit.";

  const tracks = {
    frontend: [
      { name: "MDN Web Docs", url: "https://developer.mozilla.org", cost: "Free", use: "HTML, CSS, JavaScript and accessibility reference", note },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org", cost: "Free", use: "Guided front-end practice with projects", note },
      { name: "The Odin Project", url: "https://www.theodinproject.com", cost: "Free", use: "A full web-development path with projects", note },
      { name: "W3C Web Accessibility Initiative", url: "https://www.w3.org/WAI/", cost: "Free", use: "Accessibility guidance (WCAG)", note },
    ],
    design: [
      { name: "Nielsen Norman Group articles", url: "https://www.nngroup.com/articles/", cost: "Free articles", use: "Usability and UX research", note },
      { name: "Interaction Design Foundation", url: "https://www.interaction-design.org", cost: "Some free, some paid", use: "UX and interaction design courses", note },
      { name: "Coursera", url: "https://www.coursera.org", cost: "Some free to audit, some paid", use: "Design courses from universities and companies", note },
    ],
    data: [
      { name: "Khan Academy statistics", url: "https://www.khanacademy.org/math/statistics-probability", cost: "Free", use: "Statistics and probability fundamentals", note },
      { name: "SQLBolt", url: "https://sqlbolt.com", cost: "Free", use: "Interactive SQL lessons", note },
      { name: "Kaggle Learn", url: "https://www.kaggle.com/learn", cost: "Free", use: "Short hands-on courses in data and Python", note },
      { name: "Coursera", url: "https://www.coursera.org", cost: "Some free to audit, some paid", use: "Data analytics courses and certificates", note },
    ],
    product: [
      { name: "Nielsen Norman Group articles", url: "https://www.nngroup.com/articles/", cost: "Free articles", use: "Customer research and usability", note },
      { name: "Coursera", url: "https://www.coursera.org", cost: "Some free to audit, some paid", use: "Product management courses", note },
    ],
  };

  // Resources listed for one track.
  const forTrack = (track) => tracks[track] || [];

  return { tracks, forTrack };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TechLiftResources;
