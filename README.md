# TechLift

TechLift is a front-end prototype for a guided tech-learning experience. It helps learners explore career pathways, work through practical challenges, and get mentor feedback on portfolio projects.

## Features

- Career program catalog and course detail page
- Multi-step learner onboarding with track selection
- Learner dashboard with track-specific roadmap and challenge
- Weekly project challenge with project-link submission
- Mentor workspace for reviewing submissions and giving feedback
- Mentor profiles with optional photos, education, certifications, experience, and expertise
- Dark mode with a saved browser preference
- Responsive layouts for desktop and mobile

## Getting Started

TechLift uses plain HTML, CSS, and JavaScript. There is no build step or package installation.

1. Clone or download this repository.
2. Open `index.html` in a browser.

Google Fonts are loaded from a CDN, so an internet connection is needed for the intended typography.

## Pages

- `index.html` — TechLift overview and mentor directory
- `programs.html` — program catalog
- `detail.html` — Frontend Foundations course details
- `signup.html` — learner onboarding
- `login.html` — sign-in prototype
- `dashboard.html` — learner dashboard and weekly challenge
- `mentor-dashboard.html` — mentor profile editor and submission review queue

## Prototype Limitations

This project is a front-end demonstration, not a production learning platform.

- Sign-in does not authenticate users.
- Learner, mentor, and review data are stored in the current browser using `localStorage`.
- Data is not shared between different users, browsers, or devices.
- Dashboard metrics and some learning content are sample data.
- Mentor qualifications are displayed as entered and are not independently verified.

Do not use real passwords or sensitive personal information with this prototype. A production version would need a backend, account authentication, access controls, shared data storage, and a process for verifying mentor credentials.

## Built With

- HTML
- CSS
- JavaScript
- Google Fonts

## Roadmap

- Add real learner and mentor accounts with role-based access
- Store learner profiles, submissions, and mentor reviews in a shared backend
- Verify mentor credentials
- Replace sample dashboard data with real learning progress
- Test the complete experience with learners and mentors

## License

No license has been added yet. Add a license before allowing others to reuse or distribute this project.
