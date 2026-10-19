# TechLift

TechLift is a front-end prototype for a guided tech-learning experience. It helps learners explore career pathways, work through practical challenges, and get mentor feedback on portfolio projects.

## Features

- Career program catalog and course detail page
- Multi-step learner onboarding with track selection
- Learner dashboard with track-specific roadmap and challenge
- Weekly project challenge with project-link submission, in three levels per track (foundation, core, stretch)
- Rubric-based mentor review: each skill is scored 1–4 with a note, and a skill scored 3 or higher counts as verified. Every score has written wording per skill (`js/rubric-anchors.js`) so reviewers score against the same standard
- Revision history: resubmissions keep earlier rounds, require a "what changed" note, and show score changes against the last round
- Notifications: learners hear about reviews and peer feedback, mentors hear about new submissions, and the panel updates every 30 seconds
- Recommended next challenge, chosen from the learner's lowest-rated skill
- Skills passport with verified skills, evidence links, and print or save-as-PDF
- Proof Wall portfolio with editable project stories, optional public sharing, and separate labels for self-described work and mentor-reviewed evidence
- Interview Gym with role-specific questions, STAR answer practice, private self-review history, and saved-opportunity context
- Peer review circles, unlocked after a learner's own work is approved; mentors spot-check peer reviews
- Mentor matching by expertise, with badges for turnaround, feedback depth, and calibration
- Mentor calibration: compares mentors who score the same challenge and flags outliers
- Mentor profiles with optional photos, education, certifications, experience, and expertise
- Learner and mentor accounts with email and password sign-in
- Role-based access: learners see only their own work and the peer work they are allowed to see, and mentors review submissions and publish profiles
- Dark mode with a saved browser preference
- Responsive layouts for desktop and mobile

## Getting Started

TechLift uses plain HTML, CSS, and JavaScript, with a small Node server for shared data. The server has no dependencies, so there is nothing to install. It needs Node.js 18 or newer.

1. Clone or download this repository.
2. Run `npm start` (or `node server/server.js`) from the project folder.
3. Open http://127.0.0.1:3000 in a browser and create an account. Learners sign up at `signup.html`, and mentors at `mentor-signup.html`.

Run `npm test` to check the server.

Data is stored in `data/techlift-data.json`, which is git-ignored. Pages that need an account will not work when opened straight from disk, because the server is needed for sign-in and shared data.

Google Fonts are loaded from a CDN, so an internet connection is needed for the intended typography.

## Pages

- `index.html` — TechLift overview and mentor directory
- `programs.html` — program catalog
- `detail.html` — Frontend Foundations course details
- `signup.html` — learner onboarding
- `login.html` — sign-in prototype
- `dashboard.html` — learner dashboard and weekly challenge
- `mentor-dashboard.html` — mentor profile editor, rubric review queue, calibration, and peer spot-checks
- `passport.html` — learner skills passport
- `portfolio.html` — private portfolio editor and optional public Proof Wall link
- `interview.html` — learner-private interview practice and saved sessions
- `career-dna.html` — Career DNA: six questions match your interests, working style, existing skills, time, and budget to career profiles. Each match explains why it came up. Careers without TechLift challenges are labelled as such
- `bridge.html` — My roadmap (The Bridge): your chosen career on the existing career map. A milestone is complete when its skills are verified and its challenges are approved
- `route.html` — route builder: track, known skills, weekly hours, and budget give an ordered challenge route, time estimate, skill gaps, and resources; signed-in learners save progress
- `decode.html` — job advert decoder: finds the skills and tools a pasted advert names (keyword-based)
- `compare.html` — side-by-side comparison of the four tracks, using figures from the challenge library and the live mentor directory
- `opportunities.html` — directory of job boards, government support, remote work, and certificate sites. It is not a job feed

## Prototype Limitations

- Career profiles are general summaries, not salary or demand data. Career DNA scores answers; it does not predict success.
- Learning resources, job sites, and course providers are listed as starting points. Their content, prices, and links have not been checked live.
- The decoder reads keywords, so it can miss skills described in other words.
- The comparison shows no course prices or job-outcome figures, because TechLift holds no verified data for them.
- Interview Gym uses curated prompts and private self-review; it does not provide AI scoring, audio recording, or hiring predictions.

This project is a front-end demonstration, not a production learning platform.

- Accounts are local to this server. Passwords are hashed with scrypt, but there is no email verification, password reset, or lockout after repeated failed attempts.
- Learner, mentor, and review data is stored on the local server in `data/techlift-data.json`. Data is shared by everyone who uses that server.
- Accessibility was checked with an automated WCAG tool (axe-core) and a keyboard pass. It has not been checked with a screen reader or with people who use assistive technology.
- Sessions are kept in memory, so restarting the server signs everyone out. The server listens on 127.0.0.1 only. Before exposing it beyond this machine, serve it over HTTPS and add the Secure flag to the session cookie.
- The server stores one JSON document, and each save rewrites every record. This is fine for a prototype but will not scale or handle many people editing at once.
- Dashboard metrics and some learning content are sample data.
- Mentor qualifications are displayed as entered and are not independently verified.
- Peer reviews and mentor calibration now see everyone's records on the same server, but there is still only one mentor per login, and nothing stops a person from reviewing their own work across accounts.
- Submissions saved before challenge levels were added still load as the core challenge for their track.
- The Skill Passport is account-private; the opt-in Proof Wall shares selected profile fields, learner-authored projects, and approved challenge evidence through a random share token.

Do not use real passwords or sensitive personal information with this prototype. A production version would need a backend, account authentication, access controls, shared data storage, and a process for verifying mentor credentials.

## Built With

- HTML
- CSS
- JavaScript
- Google Fonts

## Roadmap

- Test the complete learner-to-mentor experience in browser automation
- Replace remaining sample dashboard figures with real learning progress
- Verify mentor credentials
- Add email verification, password reset, and durable session storage before production use
- Add verified live opportunity sources before presenting listings as current vacancies

## License

No license has been added yet. Add a license before allowing others to reuse or distribute this project.
