// Tests for the TechLift server: accounts, roles, and who may change what.
// Run with: npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createServer } = require("../server.js");

const SKILLS = ["Responsive UI", "Visual hierarchy", "Interaction design"];

// Each test gets its own server and data file.
const start = async () => {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "techlift-")),
    "data.json",
  );
  const server = createServer({ file });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    file,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};

const request = async (app, method, url, { body, cookie } = {}) => {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${app.base}${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  const setCookie = response.headers.get("set-cookie") || "";
  const cookieHeader = setCookie.split(";")[0];
  return {
    status: response.status,
    json,
    text,
    cookie: cookieHeader.startsWith("techlift_session=") ? cookieHeader : null,
  };
};

const signupLearner = (app, email, path = "frontend") =>
  request(app, "POST", "/api/auth/signup", {
    body: {
      name: email.split("@")[0],
      email,
      password: "correct-horse",
      role: "learner",
      path,
      goal: "Switch",
      availability: "5h",
    },
  });

const signupMentor = (app, email, name) =>
  request(app, "POST", "/api/auth/signup", {
    body: { name, email, password: "correct-horse", role: "mentor" },
  });

const submitWork = (app, cookie, accountId, challengeId, body) =>
  request(
    app,
    "PUT",
    `/api/kv/${encodeURIComponent(`techliftChallenge:${accountId}::${challengeId}`)}`,
    {
      body: { description: "My work", url: "", challengeId, ...body },
      cookie,
    },
  );

const approveRecord = (app, mentorCookie, key, record) =>
  request(app, "PUT", `/api/kv/${encodeURIComponent(key)}`, {
    body: {
      ...record,
      review: {
        status: "approved",
        feedback: "Solid work.",
        rubric: SKILLS.map((skill) => ({ skill, score: 4, note: "" })),
      },
    },
    cookie: mentorCookie,
  });

test("anonymous visitors see the public mentor directory and no account", async () => {
  const app = await start();
  try {
    const state = await request(app, "GET", "/api/state");
    assert.equal(state.status, 200);
    assert.deepEqual(state.json.techliftMentorDirectory, []);
    assert.equal(state.json.techliftAccount, undefined);
    assert.equal(state.json.techliftUser, undefined);
  } finally {
    await app.close();
  }
});

test("signup validates input and rejects duplicate emails", async () => {
  const app = await start();
  try {
    assert.equal(
      (
        await request(app, "POST", "/api/auth/signup", {
          body: { name: "A", email: "not-an-email", password: "correct-horse" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(app, "POST", "/api/auth/signup", {
          body: { name: "A", email: "a@example.com", password: "short" },
        })
      ).status,
      400,
    );

    const first = await signupLearner(app, "ana@example.com");
    assert.equal(first.status, 201);
    assert.ok(first.cookie, "signup starts a session");

    const duplicate = await signupLearner(app, "ANA@example.com");
    assert.equal(duplicate.status, 409);
  } finally {
    await app.close();
  }
});

test("passwords are stored hashed, never in plain text", async () => {
  const app = await start();
  try {
    await signupLearner(app, "ana@example.com");
    const onDisk = fs.readFileSync(app.file, "utf8");
    assert.equal(onDisk.includes("correct-horse"), false);
    assert.match(onDisk, /"passwordHash"/);
  } finally {
    await app.close();
  }
});

test("login rejects a wrong password and starts a session for the right one", async () => {
  const app = await start();
  try {
    await signupLearner(app, "ana@example.com");
    const wrong = await request(app, "POST", "/api/auth/login", {
      body: { email: "ana@example.com", password: "nope-nope" },
    });
    assert.equal(wrong.status, 401);

    const right = await request(app, "POST", "/api/auth/login", {
      body: { email: "ana@example.com", password: "correct-horse" },
    });
    assert.equal(right.status, 200);
    const state = await request(app, "GET", "/api/state", {
      cookie: right.cookie,
    });
    assert.equal(state.json.techliftAccount.email, "ana@example.com");
  } finally {
    await app.close();
  }
});

test("logout ends the session", async () => {
  const app = await start();
  try {
    const { cookie } = await signupLearner(app, "ana@example.com");
    await request(app, "POST", "/api/auth/logout", { cookie });
    const state = await request(app, "GET", "/api/state", { cookie });
    assert.equal(state.json.techliftAccount, undefined);
  } finally {
    await app.close();
  }
});

test("writes need a session and JSON", async () => {
  const app = await start();
  try {
    const anonymous = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { fullName: "X" },
    });
    assert.equal(anonymous.status, 401);

    const { cookie } = await signupLearner(app, "ana@example.com");
    const plain = await fetch(`${app.base}/api/kv/techliftUser`, {
      method: "PUT",
      headers: { Cookie: cookie },
      body: "{}",
    });
    assert.equal(plain.status, 415);
  } finally {
    await app.close();
  }
});

test("learners cannot write mentor records, and mentors cannot write learner profiles", async () => {
  const app = await start();
  try {
    const learner = await signupLearner(app, "ana@example.com");
    const mentor = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");

    const learnerAsMentor = await request(
      app,
      "PUT",
      "/api/kv/techliftMentorProfile",
      {
        body: { name: "Impostor" },
        cookie: learner.cookie,
      },
    );
    assert.equal(learnerAsMentor.status, 403);

    const mentorAsLearner = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { path: "design" },
      cookie: mentor.cookie,
    });
    assert.equal(mentorAsLearner.status, 403);
  } finally {
    await app.close();
  }
});

test("a learner cannot change another learner's submission", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const ben = await signupLearner(app, "ben@example.com");
    const attempt = await submitWork(
      app,
      ben.cookie,
      ana.json.id,
      "frontend-core",
      {},
    );
    assert.equal(attempt.status, 403);
  } finally {
    await app.close();
  }
});

test("a learner cannot write a submission for a challenge outside their track", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com", "frontend");
    const attempt = await submitWork(
      app,
      ana.cookie,
      ana.json.id,
      "design-core",
      {},
    );
    assert.equal(attempt.status, 403);
  } finally {
    await app.close();
  }
});

test("learner submissions ignore client-supplied reviews and rounds", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const sent = await submitWork(
      app,
      ana.cookie,
      ana.json.id,
      "frontend-core",
      {
        review: {
          status: "approved",
          feedback: "I approved myself",
          rubric: [],
        },
        round: 9,
        history: [{ fake: true }],
      },
    );
    assert.equal(sent.status, 204);

    const state = await request(app, "GET", "/api/state", {
      cookie: ana.cookie,
    });
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;
    assert.equal(state.json[key].review, null);
    assert.equal(state.json[key].round, 1);
    assert.deepEqual(state.json[key].history, []);
    assert.equal(state.json[key].email, "ana@example.com");
  } finally {
    await app.close();
  }
});

test("resubmitting after feedback needs a change note and starts round 2", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;

    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    const reviewed = await request(app, "GET", "/api/state", {
      cookie: nomsa.cookie,
    });
    await request(app, "PUT", `/api/kv/${encodeURIComponent(key)}`, {
      body: {
        ...reviewed.json[key],
        review: {
          status: "changes",
          feedback: "Add labels.",
          rubric: SKILLS.map((skill) => ({ skill, score: 2, note: "" })),
        },
      },
      cookie: nomsa.cookie,
    });

    const missingNote = await submitWork(
      app,
      ana.cookie,
      ana.json.id,
      "frontend-core",
      { description: "Second try" },
    );
    assert.equal(missingNote.status, 400);

    const withNote = await submitWork(
      app,
      ana.cookie,
      ana.json.id,
      "frontend-core",
      { description: "Second try", changeNote: "Added labels." },
    );
    assert.equal(withNote.status, 204);

    const after = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json[key];
    assert.equal(after.round, 2);
    assert.equal(after.history.length, 1);
    assert.equal(after.history[0].review.status, "changes");
    assert.equal(after.review, null);
  } finally {
    await app.close();
  }
});

test("mentors record their own name on reviews and must score every skill", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    const record = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json[key];

    const incomplete = await request(
      app,
      "PUT",
      `/api/kv/${encodeURIComponent(key)}`,
      {
        body: {
          ...record,
          review: {
            status: "approved",
            feedback: "Good",
            rubric: [{ skill: SKILLS[0], score: 4 }],
          },
        },
        cookie: nomsa.cookie,
      },
    );
    assert.equal(incomplete.status, 400);

    const outOfRange = await request(
      app,
      "PUT",
      `/api/kv/${encodeURIComponent(key)}`,
      {
        body: {
          ...record,
          review: {
            status: "approved",
            feedback: "Good",
            rubric: SKILLS.map((skill) => ({ skill, score: 5 })),
          },
        },
        cookie: nomsa.cookie,
      },
    );
    assert.equal(outOfRange.status, 400);

    const ok = await approveRecord(app, nomsa.cookie, key, record);
    assert.equal(ok.status, 204);
    const saved = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json[key].review;
    assert.equal(saved.reviewerId, nomsa.json.id);
    assert.equal(saved.reviewerName, "Nomsa Dube");
  } finally {
    await app.close();
  }
});

test("mentor reviews cannot change the learner's work", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {
      description: "Original",
    });
    const record = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json[key];

    await approveRecord(app, nomsa.cookie, key, {
      ...record,
      description: "Rewritten by mentor",
    });
    const after = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json[key];
    assert.equal(after.description, "Original");
  } finally {
    await app.close();
  }
});

test("state shows learners only their own work, and peers' work after approval", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const ben = await signupLearner(app, "ben@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const anaKey = `techliftChallenge:${ana.json.id}::frontend-core`;
    const benKey = `techliftChallenge:${ben.json.id}::frontend-core`;

    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    await submitWork(app, ben.cookie, ben.json.id, "frontend-core", {
      description: "Ben's hero",
    });

    let view = (await request(app, "GET", "/api/state", { cookie: ana.cookie }))
      .json;
    assert.equal(
      view[benKey],
      undefined,
      "peer work is hidden before Ana's own work is approved",
    );

    const anaRecord = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json[anaKey];
    await approveRecord(app, nomsa.cookie, anaKey, anaRecord);

    view = (await request(app, "GET", "/api/state", { cookie: ana.cookie }))
      .json;
    assert.ok(view[benKey], "peer work appears after approval");
    assert.equal(view[benKey].email, undefined, "peer view hides email");
    assert.equal(view[benKey].review, undefined, "peer view hides reviews");
  } finally {
    await app.close();
  }
});

test("peer reviews unlock after approval, cannot be edited or deleted, and reviewers are recorded by account", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const ben = await signupLearner(app, "ben@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const anaKey = `techliftChallenge:${ana.json.id}::frontend-core`;
    const benKey = `techliftChallenge:${ben.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    await submitWork(app, ben.cookie, ben.json.id, "frontend-core", {});

    const peerReview = {
      id: "peer-1",
      submissionKey: benKey,
      challengeId: "frontend-core",
      rubric: SKILLS.map((skill) => ({ skill, score: 3, note: "" })),
      comment: "Clear.",
    };

    const early = await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [peerReview],
      cookie: ana.cookie,
    });
    assert.equal(early.status, 403, "locked before Ana's approval");

    await approveRecord(
      app,
      nomsa.cookie,
      anaKey,
      (await request(app, "GET", "/api/state", { cookie: nomsa.cookie })).json[
        anaKey
      ],
    );

    const ok = await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [peerReview],
      cookie: ana.cookie,
    });
    assert.equal(ok.status, 204);

    const stored = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftPeerReviews;
    assert.equal(stored[0].reviewerId, ana.json.id);
    assert.equal(stored[0].reviewerName, "ana");

    const edited = await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [{ ...peerReview, comment: "Changed later" }],
      cookie: ana.cookie,
    });
    assert.equal(edited.status, 403);

    const deleted = await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [],
      cookie: ana.cookie,
    });
    assert.equal(deleted.status, 403);
  } finally {
    await app.close();
  }
});

test("learners cannot review their own work and mentors can only add spot-checks", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const ben = await signupLearner(app, "ben@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const anaKey = `techliftChallenge:${ana.json.id}::frontend-core`;
    const benKey = `techliftChallenge:${ben.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    await submitWork(app, ben.cookie, ben.json.id, "frontend-core", {});
    await approveRecord(
      app,
      nomsa.cookie,
      anaKey,
      (await request(app, "GET", "/api/state", { cookie: nomsa.cookie })).json[
        anaKey
      ],
    );

    const selfReview = await request(
      app,
      "PUT",
      "/api/kv/techliftPeerReviews",
      {
        body: [
          {
            id: "self",
            submissionKey: anaKey,
            challengeId: "frontend-core",
            rubric: SKILLS.map((skill) => ({ skill, score: 4, note: "" })),
            comment: "Me",
          },
        ],
        cookie: ana.cookie,
      },
    );
    assert.equal(selfReview.status, 403);

    await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [
        {
          id: "peer-1",
          submissionKey: benKey,
          challengeId: "frontend-core",
          rubric: SKILLS.map((skill) => ({ skill, score: 3, note: "" })),
          comment: "Clear.",
        },
      ],
      cookie: ana.cookie,
    });

    const spotCheck = await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [{ id: "peer-1", spotCheck: { verdict: "agree", note: "Fair." } }],
      cookie: nomsa.cookie,
    });
    assert.equal(spotCheck.status, 204);

    const newFromMentor = await request(
      app,
      "PUT",
      "/api/kv/techliftPeerReviews",
      {
        body: [
          { id: "peer-1", spotCheck: null },
          {
            id: "mentor-made",
            submissionKey: benKey,
            challengeId: "frontend-core",
            rubric: [],
            comment: "",
          },
        ],
        cookie: nomsa.cookie,
      },
    );
    assert.equal(newFromMentor.status, 403);

    const view = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json.techliftPeerReviews;
    assert.equal(view[0].spotCheck.verdict, "agree");
    assert.equal(view[0].spotCheck.mentorId, nomsa.json.id);
  } finally {
    await app.close();
  }
});

test("mentor profiles are public, derived into the directory, and do not expose email", async () => {
  const app = await start();
  try {
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const saved = await request(app, "PUT", "/api/kv/techliftMentorProfile", {
      body: {
        name: "Nomsa Dube",
        role: "Frontend lead",
        expertise: ["React"],
        experience: "8",
      },
      cookie: nomsa.cookie,
    });
    assert.equal(saved.status, 204);

    const anonymous = (await request(app, "GET", "/api/state")).json;
    assert.equal(anonymous.techliftMentorDirectory.length, 1);
    assert.equal(anonymous.techliftMentorDirectory[0].id, nomsa.json.id);
    assert.equal(anonymous.techliftMentorDirectory[0].email, undefined);
  } finally {
    await app.close();
  }
});

test("learner profile changes are validated against tracks and mentors", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const badTrack = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { path: "astronomy" },
      cookie: ana.cookie,
    });
    assert.equal(badTrack.status, 400);

    const badMentor = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { mentorId: "nobody" },
      cookie: ana.cookie,
    });
    assert.equal(badMentor.status, 400);

    const ok = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { goal: "Get hired" },
      cookie: ana.cookie,
    });
    assert.equal(ok.status, 204);
    const state = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json;
    assert.equal(state.techliftUser.goal, "Get hired");
    assert.equal(state.techliftUser.email, "ana@example.com");
  } finally {
    await app.close();
  }
});

test("portfolios stay private until published and show only the learner's approved evidence", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {
      description: "Built a responsive project page.",
      url: "https://github.com/ana/project",
    });
    const mentorState = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json;
    await approveRecord(app, nomsa.cookie, key, mentorState[key]);

    const profile = {
      name: "Ana Learner",
      headline: "Frontend developer building useful interfaces",
      about: "I learn by designing, building, and refining small projects.",
      location: "Cape Town, South Africa",
      published: false,
      links: { github: "https://github.com/ana", linkedin: "", website: "" },
      projects: [
        {
          title: "Community noticeboard",
          description: "A responsive noticeboard for local events.",
          problem: "Finding useful local information was difficult.",
          contribution: "Designed and built the interface.",
          learning: "I practised accessible forms and responsive layout.",
          technologies: ["HTML", "CSS", "JavaScript"],
          url: "https://example.com/noticeboard",
          imageUrl: "",
        },
      ],
    };
    const invalid = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        portfolio: { ...profile, links: { github: "javascript:alert(1)" } },
      },
      cookie: ana.cookie,
    });
    assert.equal(invalid.status, 400);

    assert.equal(
      (
        await request(app, "PUT", "/api/kv/techliftUser", {
          body: { portfolio: profile },
          cookie: ana.cookie,
        })
      ).status,
      204,
    );
    const privateProfile = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftUser.portfolio;
    assert.match(privateProfile.shareId, /^[a-f0-9]{32}$/);
    assert.equal(
      (await request(app, "GET", `/api/portfolio/${privateProfile.shareId}`))
        .status,
      404,
    );

    assert.equal(
      (
        await request(app, "PUT", "/api/kv/techliftUser", {
          body: { portfolio: { ...profile, published: true } },
          cookie: ana.cookie,
        })
      ).status,
      204,
    );
    const publicResponse = await request(
      app,
      "GET",
      `/api/portfolio/${privateProfile.shareId}`,
    );
    assert.equal(publicResponse.status, 200);
    assert.equal(publicResponse.json.email, undefined);
    assert.equal(publicResponse.json.accountId, undefined);
    assert.equal(publicResponse.json.shareId, undefined);
    assert.equal(publicResponse.json.projects.length, 2);
    assert.equal(publicResponse.json.projects[0].source, "self-described");
    assert.equal(publicResponse.json.projects[1].source, "mentor-reviewed");
    assert.ok(
      publicResponse.json.skills.some((item) => item.skill === "Responsive UI"),
    );
    assert.equal(
      publicResponse.json.projects[1].url,
      "https://github.com/ana/project",
    );

    assert.equal(
      (
        await request(app, "PUT", "/api/kv/techliftUser", {
          body: { portfolio: { ...profile, published: false } },
          cookie: ana.cookie,
        })
      ).status,
      204,
    );
    assert.equal(
      (await request(app, "GET", `/api/portfolio/${privateProfile.shareId}`))
        .status,
      404,
    );
  } finally {
    await app.close();
  }
});

test("interview practice validates private STAR sessions and links them to saved opportunities", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const opportunity = {
      id: "opp-interview-test",
      title: "Junior frontend developer",
      organisation: "Example Co",
      type: "Junior developer",
      link: "https://example.com/jobs/123",
      stage: "Preparing",
    };
    assert.equal(
      (
        await request(app, "PUT", "/api/kv/techliftUser", {
          body: { opportunities: [opportunity] },
          cookie: ana.cookie,
        })
      ).status,
      204,
    );

    const session = {
      id: "11111111-1111-4111-8111-111111111111",
      careerId: "frontend",
      questionId: "team-conflict",
      question: "Tell me about a time you worked through a team disagreement.",
      category: "behavioral",
      opportunityId: opportunity.id,
      answers: {
        situation: "A project team disagreed about the navigation structure.",
        task: "I needed to help the group choose a usable direction.",
        action:
          "I gathered examples, mapped the options, and shared tradeoffs.",
        result:
          "We agreed on a simpler navigation and tested it with two users.",
      },
      scores: { clarity: 3, relevance: 4, structure: 3, evidence: 3 },
      reflection: "Next time, I would quantify the user feedback.",
    };

    const missingStar = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        interviewPractice: [
          { ...session, answers: { ...session.answers, result: "" } },
        ],
      },
      cookie: ana.cookie,
    });
    assert.equal(missingStar.status, 400);

    const badOpportunity = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        interviewPractice: [
          { ...session, opportunityId: "someone-elses-role" },
        ],
      },
      cookie: ana.cookie,
    });
    assert.equal(badOpportunity.status, 400);

    const saved = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { interviewPractice: [session], portfolio: null },
      cookie: ana.cookie,
    });
    assert.equal(saved.status, 204);
    const learnerState = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json;
    assert.equal(
      learnerState.techliftUser.interviewPractice[0].questionId,
      "team-conflict",
    );
    assert.equal(
      learnerState.techliftUser.interviewPractice[0].opportunityId,
      opportunity.id,
    );
    assert.equal(
      learnerState.techliftUser.interviewPractice[0].answers.result,
      session.answers.result,
    );

    const removeOpportunity = await request(
      app,
      "PUT",
      "/api/kv/techliftUser",
      {
        body: { opportunities: [], interviewPractice: [session] },
        cookie: ana.cookie,
      },
    );
    assert.equal(removeOpportunity.status, 204);
    const retained = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftUser;
    assert.equal(retained.opportunities.length, 0);
    assert.equal(
      retained.interviewPractice[0].opportunityTitle,
      opportunity.title,
    );

    const mentorWrite = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { interviewPractice: [session] },
      cookie: nomsa.cookie,
    });
    assert.equal(mentorWrite.status, 403);

    const removed = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { interviewPractice: [] },
      cookie: ana.cookie,
    });
    assert.equal(removed.status, 204);
    assert.deepEqual(
      (await request(app, "GET", "/api/state", { cookie: ana.cookie })).json
        .techliftUser.interviewPractice,
      [],
    );
  } finally {
    await app.close();
  }
});

test("planner settings and task progress are validated and saved per learner", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const planner = {
      track: "frontend",
      hoursPerWeek: 5,
      availableDays: ["mon", "thu"],
      energy: "steady",
      confidence: 3,
      priority: "portfolio",
      tasks: [
        {
          id: "task-frontend-core",
          title: "Build the responsive hero",
          day: "thu",
          challengeId: "frontend-core",
          completed: true,
        },
      ],
    };

    const invalidHours = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { planner: { ...planner, hoursPerWeek: 3 } },
      cookie: ana.cookie,
    });
    assert.equal(invalidHours.status, 400);

    const invalidTask = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        planner: {
          ...planner,
          tasks: [{ ...planner.tasks[0], challengeId: "unknown-task" }],
        },
      },
      cookie: ana.cookie,
    });
    assert.equal(invalidTask.status, 400);

    const saved = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { planner },
      cookie: ana.cookie,
    });
    assert.equal(saved.status, 204);
    const state = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftUser;
    assert.equal(state.planner.hoursPerWeek, 5);
    assert.equal(state.planner.availableDays[1], "thu");
    assert.equal(state.planner.tasks[0].completed, true);
    assert.equal(state.planner.tasks[0].challengeId, "frontend-core");

    const mentorWrite = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { planner },
      cookie: nomsa.cookie,
    });
    assert.equal(mentorWrite.status, 403);
  } finally {
    await app.close();
  }
});

test("static pages are served and code and data folders are not", async () => {
  const app = await start();
  try {
    assert.equal((await fetch(`${app.base}/dashboard.html`)).status, 200);
    assert.equal((await fetch(`${app.base}/server/server.js`)).status, 404);
    assert.equal(
      (await fetch(`${app.base}/data/techlift-data.json`)).status,
      404,
    );
    assert.equal(
      (await fetch(`${app.base}/..%2F..%2Fetc%2Fpasswd`)).status,
      404,
    );
  } finally {
    await app.close();
  }
});

const notificationsFor = async (app, cookie) =>
  (await request(app, "GET", "/api/notifications", { cookie })).json;

test("notifications: a mentor's review tells the learner", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const key = `techliftChallenge:${ana.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    const record = (
      await request(app, "GET", "/api/state", { cookie: nomsa.cookie })
    ).json[key];
    await approveRecord(app, nomsa.cookie, key, record);

    const items = await notificationsFor(app, ana.cookie);
    assert.ok(
      items.some((item) =>
        item.message.includes("Nomsa Dube approved your work"),
      ),
      JSON.stringify(items),
    );
    assert.equal(items.at(-1).read, false);
  } finally {
    await app.close();
  }
});

test("notifications: a learner's submission tells every mentor", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    const items = await notificationsFor(app, nomsa.cookie);
    assert.ok(
      items.some((item) => item.message.includes("sent work for review")),
      JSON.stringify(items),
    );
  } finally {
    await app.close();
  }
});

test("notifications: peer feedback tells the owner, and spot-checks tell the reviewer", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const ben = await signupLearner(app, "ben@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    const anaKey = `techliftChallenge:${ana.json.id}::frontend-core`;
    const benKey = `techliftChallenge:${ben.json.id}::frontend-core`;
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});
    await submitWork(app, ben.cookie, ben.json.id, "frontend-core", {});
    await approveRecord(
      app,
      nomsa.cookie,
      anaKey,
      (await request(app, "GET", "/api/state", { cookie: nomsa.cookie })).json[
        anaKey
      ],
    );

    await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [
        {
          id: "peer-1",
          submissionKey: benKey,
          challengeId: "frontend-core",
          rubric: SKILLS.map((skill) => ({ skill, score: 3, note: "" })),
          comment: "Clear.",
        },
      ],
      cookie: ana.cookie,
    });
    const benItems = await notificationsFor(app, ben.cookie);
    assert.ok(
      benItems.some((item) =>
        item.message.includes("left peer feedback on your work"),
      ),
      JSON.stringify(benItems),
    );

    await request(app, "PUT", "/api/kv/techliftPeerReviews", {
      body: [{ id: "peer-1", spotCheck: { verdict: "agree", note: "" } }],
      cookie: nomsa.cookie,
    });
    const anaItems = await notificationsFor(app, ana.cookie);
    assert.ok(
      anaItems.some((item) =>
        item.message.includes("spot-checked your peer review"),
      ),
      JSON.stringify(anaItems),
    );
  } finally {
    await app.close();
  }
});

test("notifications: marking as read clears the unread flag, and anonymous visitors see none", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");
    await submitWork(app, ana.cookie, ana.json.id, "frontend-core", {});

    assert.ok(
      (await notificationsFor(app, nomsa.cookie)).every(
        (item) => item.read === false,
      ),
    );
    await request(app, "POST", "/api/notifications/read", {
      cookie: nomsa.cookie,
    });
    assert.ok(
      (await notificationsFor(app, nomsa.cookie)).every(
        (item) => item.read === true,
      ),
    );

    assert.deepEqual(await notificationsFor(app, undefined), []);
    assert.equal(
      (await request(app, "POST", "/api/notifications/read")).status,
      401,
    );
  } finally {
    await app.close();
  }
});

test("opportunity tracker: saves what the learner adds, checks it, and keeps it across reads", async () => {
  const app = await start();
  try {
    const ana = await signupLearner(app, "ana@example.com");
    const nomsa = await signupMentor(app, "nomsa@example.com", "Nomsa Dube");

    const badLink = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        opportunities: [{ title: "Junior dev", link: "javascript:alert(1)" }],
      },
      cookie: ana.cookie,
    });
    assert.equal(badLink.status, 400, "non-web links are refused");

    const badDate = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { opportunities: [{ title: "Junior dev", closes: "next Friday" }] },
      cookie: ana.cookie,
    });
    assert.equal(badDate.status, 400, "closing dates must be ISO dates");

    const saved = await request(app, "PUT", "/api/kv/techliftUser", {
      body: {
        opportunities: [
          {
            title: "Junior frontend developer",
            organisation: "Example Co",
            type: "Junior developer",
            link: "https://example.com/careers/123",
            closes: "2026-12-31",
            stage: "Applied",
            notes: "Send the portfolio link.",
            source: "scraped",
          },
        ],
      },
      cookie: ana.cookie,
    });
    assert.equal(saved.status, 204);

    const state = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftUser;
    assert.equal(state.opportunities.length, 1);
    const item = state.opportunities[0];
    assert.equal(item.title, "Junior frontend developer");
    assert.equal(item.stage, "Applied");
    assert.equal(
      item.source,
      "user",
      "the client cannot claim a listing came from a source",
    );

    const unknownStage = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { opportunities: [{ title: "Role", stage: "Hired!" }] },
      cookie: ana.cookie,
    });
    assert.equal(unknownStage.status, 204);
    const fallback = (
      await request(app, "GET", "/api/state", { cookie: ana.cookie })
    ).json.techliftUser.opportunities[0];
    assert.equal(fallback.stage, "Interested");

    const mentorWrite = await request(app, "PUT", "/api/kv/techliftUser", {
      body: { opportunities: [{ title: "Role" }] },
      cookie: nomsa.cookie,
    });
    assert.equal(mentorWrite.status, 403, "only learners have a tracker");
  } finally {
    await app.close();
  }
});
