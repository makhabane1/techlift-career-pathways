const TechLiftCareerData = {
  career_paths: [
    {
      id: "frontend",
      label: "Frontend Engineer",
      color: "#5b7cff",
      summary:
        "Design responsive interfaces, write clean front-end logic, and ship launch-ready features.",
      milestones: [
        { id: "fe-html", label: "HTML", x: 80, y: 150, needs: {"skills":["Semantic HTML"],"challenges":[]} },
        { id: "fe-css", label: "CSS", x: 180, y: 110, needs: {"skills":["CSS layout","Visual hierarchy"],"challenges":[]} },
        { id: "fe-js", label: "JavaScript", x: 285, y: 170, needs: {"skills":["JavaScript state","Form validation"],"challenges":[]} },
        { id: "fe-react", label: "React", x: 390, y: 120, needs: {"skills":["Interaction design","Responsive UI"],"challenges":[]} },
        { id: "fe-portfolio", label: "Portfolio", x: 515, y: 210, needs: {"skills":[],"challenges":["frontend-core"]} },
      ],
    },
    {
      id: "product",
      label: "Product Designer",
      color: "#8b5cf6",
      summary:
        "Create user-centered experiences, sharpen flows, and test ideas with real customer feedback.",
      milestones: [
        { id: "pd-research", label: "Research", x: 90, y: 170, needs: {"skills":["Research planning","Synthesis"],"challenges":[]} },
        { id: "pd-wireframes", label: "Wireframes", x: 210, y: 110, needs: {"skills":["Wireframing","Information architecture"],"challenges":[]} },
        { id: "pd-ui", label: "UI", x: 330, y: 170, needs: {"skills":["Visual hierarchy","Clear labelling"],"challenges":[]} },
        { id: "pd-prototyping", label: "Prototype", x: 450, y: 110, needs: {"skills":["Interaction design","User flows"],"challenges":[]} },
        { id: "pd-launch", label: "Launch", x: 520, y: 200, needs: {"skills":[],"challenges":["design-core"]} },
      ],
    },
    {
      id: "data",
      label: "Data Analyst",
      color: "#23b26d",
      summary:
        "Translate raw information into decisions, dashboards, and meaningful business insight.",
      milestones: [
        { id: "da-sql", label: "SQL", x: 90, y: 180, needs: {"skills":["SQL basics","Data cleaning"],"challenges":[]} },
        { id: "da-dashboard", label: "Dashboard", x: 200, y: 120, needs: {"skills":["Dashboard design","Chart choice"],"challenges":[]} },
        { id: "da-metrics", label: "Metrics", x: 315, y: 180, needs: {"skills":["Metric selection","Hypothesis testing"],"challenges":[]} },
        { id: "da-storytelling", label: "Storytelling", x: 430, y: 120, needs: {"skills":["Data storytelling","Caveat writing"],"challenges":[]} },
        { id: "da-case-study", label: "Case Study", x: 520, y: 200, needs: {"skills":[],"challenges":["data-core"]} },
      ],
    },
  ],
};
