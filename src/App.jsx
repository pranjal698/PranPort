import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Section from "./components/Section";
import {
  person,
  professionalSummary,
  coreSkills,
  aiSkills,
  careerHighlights,
  experience,
  pastRoles,
  fallbackProjects,
  certifications,
  achievements,
  education,
  contact,
} from "./data";
import {
  fetchGitHubProfile,
  fetchGitHubRepos,
  fetchMotivationalQuote,
} from "./services/portfolioApi";

const FALLBACK_QUOTE =
  "Data becomes powerful when insight is turned into meaningful action.";

const THEME_COUNT = 24;
const COLORFUL_HUE_STEPS = [284, 326, 18, 36, 58, 88, 162, 196, 222, 254, 140, 300];
const THEME_NAME_PREFIX = [
  "Dawn",
  "Lagoon",
  "Mist",
  "Meadow",
  "Cloud",
  "Harbor",
  "Sand",
  "Velvet",
];
const THEME_NAME_SUFFIX = ["Calm", "Breeze", "Hush"];
const THEME_ORDER_KEY = "portfolio-theme-order-v2";
const THEME_INDEX_KEY = "portfolio-theme-index-v2";
const THEME_LAST_KEY = "portfolio-theme-last-v2";
const COLOR_MODE_KEY = "portfolio-color-mode-v1";

function normalizeHue(hue) {
  return ((Math.round(hue) % 360) + 360) % 360;
}

function hsl(hue, saturation, lightness) {
  return `hsl(${normalizeHue(hue)} ${saturation}% ${lightness}%)`;
}

function hsla(hue, saturation, lightness, alpha) {
  return `hsl(${normalizeHue(hue)} ${saturation}% ${lightness}% / ${alpha})`;
}

function buildThemePreset(index) {
  const baseHue = COLORFUL_HUE_STEPS[index % COLORFUL_HUE_STEPS.length];
  const cycle = Math.floor(index / COLORFUL_HUE_STEPS.length);
  const accentHue = normalizeHue(baseHue + cycle * 7);
  const accentAltHue = normalizeHue(accentHue + 34);
  const tertiaryHue = normalizeHue(accentHue + 72);
  const bgHueA = normalizeHue(accentHue + 178);
  const bgHueB = normalizeHue(bgHueA + 18);
  const bgHueC = normalizeHue(bgHueA - 16);
  const accentSat = 76 - (cycle % 3) * 4;
  const accentStrongSat = 72 - (cycle % 2) * 5;
  const accentLight = 67 + (index % 2 === 0 ? 2 : -1);
  const label = `${THEME_NAME_PREFIX[index % THEME_NAME_PREFIX.length]} ${
    THEME_NAME_SUFFIX[Math.floor(index / THEME_NAME_PREFIX.length)]
  }`;

  return {
    id: `theme-${index + 1}`,
    label,
    varsByMode: {
      dark: {
        "--surface-1": hsla(bgHueA, 40, 18, 0.66),
        "--surface-2": hsla(bgHueB, 44, 22, 0.8),
        "--line-soft": hsla(accentHue, 74, 84, 0.24),
        "--text-main": hsl(bgHueB + 140, 34, 96),
        "--text-dim": hsl(bgHueA + 136, 28, 82),
        "--accent": hsl(accentHue, accentSat, accentLight),
        "--accent-strong": hsl(accentHue, accentStrongSat, 57),
        "--accent-strong-2": hsl(accentAltHue, accentStrongSat - 3, 55),
        "--bg-start": hsl(bgHueA, 54, 12),
        "--bg-mid": hsl(bgHueB, 56, 16),
        "--bg-end": hsl(bgHueC, 52, 12),
        "--halo-1": hsla(accentHue, 72, 64, 0.2),
        "--halo-2": hsla(accentAltHue, 68, 62, 0.17),
        "--halo-3": hsla(tertiaryHue, 66, 60, 0.17),
        "--orb-1": hsla(accentHue, 70, 58, 0.46),
        "--orb-2": hsla(accentAltHue, 66, 56, 0.42),
        "--orb-3": hsla(tertiaryHue, 64, 56, 0.4),
        "--swirl-1": hsla(accentHue, 64, 60, 0.08),
        "--swirl-2": hsla(accentAltHue, 60, 58, 0.08),
        "--swirl-3": hsla(tertiaryHue, 58, 56, 0.08),
      },
      light: {
        "--surface-1": hsla(bgHueA, 52, 30, 0.72),
        "--surface-2": hsla(bgHueB, 56, 37, 0.8),
        "--line-soft": hsla(accentHue, 72, 94, 0.3),
        "--text-main": hsl(bgHueB + 138, 34, 97),
        "--text-dim": hsl(bgHueA + 134, 28, 89),
        "--accent": hsl(accentHue, Math.min(accentSat + 5, 88), 70),
        "--accent-strong": hsl(accentHue, accentStrongSat, 62),
        "--accent-strong-2": hsl(accentAltHue, accentStrongSat - 1, 60),
        "--bg-start": hsl(bgHueA, 58, 24),
        "--bg-mid": hsl(bgHueB, 58, 32),
        "--bg-end": hsl(bgHueC, 56, 24),
        "--halo-1": hsla(accentHue, 72, 74, 0.28),
        "--halo-2": hsla(accentAltHue, 70, 72, 0.24),
        "--halo-3": hsla(tertiaryHue, 68, 70, 0.24),
        "--orb-1": hsla(accentHue, 74, 70, 0.5),
        "--orb-2": hsla(accentAltHue, 70, 68, 0.46),
        "--orb-3": hsla(tertiaryHue, 68, 66, 0.44),
        "--swirl-1": hsla(accentHue, 66, 72, 0.1),
        "--swirl-2": hsla(accentAltHue, 62, 70, 0.1),
        "--swirl-3": hsla(tertiaryHue, 60, 68, 0.1),
      },
    },
  };
}

function getInitialColorMode() {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const saved = window.localStorage.getItem(COLOR_MODE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function toggleColorMode(mode) {
  return mode === "dark" ? "light" : "dark";
}

const THEME_PRESETS = Array.from({ length: THEME_COUNT }, (_, index) => buildThemePreset(index));

function shuffleThemeIds(ids) {
  const result = [...ids];
  for (let idx = result.length - 1; idx > 0; idx -= 1) {
    const swapIndex = Math.floor(Math.random() * (idx + 1));
    [result[idx], result[swapIndex]] = [result[swapIndex], result[idx]];
  }
  return result;
}

function selectNextTheme(presets) {
  if (typeof window === "undefined") {
    return presets[0];
  }

  const ids = presets.map((theme) => theme.id);

  try {
    const storedOrder = JSON.parse(window.localStorage.getItem(THEME_ORDER_KEY) || "[]");
    const storedIndex = Number.parseInt(window.localStorage.getItem(THEME_INDEX_KEY) || "0", 10);
    const lastThemeId = window.localStorage.getItem(THEME_LAST_KEY) || "";

    const validOrder =
      Array.isArray(storedOrder) &&
      storedOrder.length === ids.length &&
      storedOrder.every((id) => ids.includes(id));

    let order = validOrder ? storedOrder : [];
    let index = Number.isNaN(storedIndex) ? 0 : storedIndex;

    if (!validOrder || index >= order.length) {
      order = shuffleThemeIds(ids);
      if (lastThemeId && order.length > 1 && order[0] === lastThemeId) {
        [order[0], order[1]] = [order[1], order[0]];
      }
      index = 0;
    }

    const selectedId = order[index];
    window.localStorage.setItem(THEME_ORDER_KEY, JSON.stringify(order));
    window.localStorage.setItem(THEME_INDEX_KEY, String(index + 1));
    window.localStorage.setItem(THEME_LAST_KEY, selectedId);

    return presets.find((theme) => theme.id === selectedId) || presets[0];
  } catch {
    return presets[Math.floor(Math.random() * presets.length)];
  }
}

function formatDate(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseGitHubUsername(url) {
  const match = url.match(/github\.com\/([^/?#]+)/i);
  return match?.[1] ?? "";
}

function parseLinkedInHandle(url) {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match?.[1] ?? "";
}

function buildPortfolioChatReply(message, context) {
  const query = message.trim().toLowerCase();
  const {
    personData,
    experienceData,
    pastRolesData,
    coreSkillsData,
    aiSkillsData,
    projectsData,
    contactData,
    githubProfileData,
    loading,
  } = context;

  if (/^(hi|hello|hey|yo|hii)\b/.test(query)) {
    return `Hi! I can help with ${personData.name}'s skills, experience, projects, education, and contact details.`;
  }

  if (/skill|tech|stack|tool|dax|power bi|sql|python|excel|fabric|tableau/.test(query)) {
    const topSkills = [...coreSkillsData, ...aiSkillsData].slice(0, 8).join(", ");
    return `Top strengths: ${topSkills}.`;
  }

  if (/experience|work|company|job|role|schneider|career/.test(query)) {
    const previous =
      pastRolesData.length > 0
        ? ` Previous roles include ${pastRolesData
            .map((item) => `${item.role} at ${item.company}`)
            .slice(0, 2)
            .join(" and ")}.`
        : "";
    return `${personData.name} currently works as ${experienceData.role} at ${experienceData.company} (${experienceData.duration}).${previous}`;
  }

  if (/project|portfolio|repo|github|build|work sample/.test(query)) {
    const topProjects = projectsData.slice(0, 3).map((project) => project.title).join(", ");
    const githubLine = githubProfileData?.publicRepos
      ? ` GitHub has ${githubProfileData.publicRepos} public repos.`
      : "";
    return `Highlighted projects: ${topProjects || "projects are being loaded right now."}.${githubLine}`;
  }

  if (/education|degree|college|institute|study/.test(query)) {
    return "Education includes BE (ECE) at Gandhinagar Institute of Technology, plus data science/business analytics training.";
  }

  if (/contact|email|phone|linkedin|reach|hire/.test(query)) {
    return `You can reach ${personData.name} at ${contactData.email} or connect on LinkedIn: ${contactData.linkedin}`;
  }

  if (/where|location|based/.test(query)) {
    return `${personData.name} is based in ${personData.location}.`;
  }

  if (/resume|cv/.test(query)) {
    return "Use the Resume button in the top navigation to download/view the latest resume.";
  }

  if (loading) {
    return "Live profile data is still syncing. You can still ask me about skills, experience, and contact details.";
  }

  return "I can help with skills, experience, projects, education, and contact info. Try: 'top skills' or 'show experience'.";
}

export default function App() {
  const githubUsername = useMemo(() => parseGitHubUsername(contact.github), []);
  const linkedinHandle = useMemo(() => parseLinkedInHandle(contact.linkedin), []);

  const [githubProfile, setGithubProfile] = useState(null);
  const [projects, setProjects] = useState(fallbackProjects);
  const [quote, setQuote] = useState(FALLBACK_QUOTE);
  const [isLoading, setIsLoading] = useState(true);
  const [_liveErrors, setLiveErrors] = useState([]);
  const [activeTheme] = useState(() => selectNextTheme(THEME_PRESETS));
  const [colorMode, setColorMode] = useState(() => getInitialColorMode());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Hi! I am your AI portfolio assistant. Ask me about skills, experience, projects, or contact details.",
    },
  ]);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const theme = activeTheme || THEME_PRESETS[0];
    const mode = colorMode === "light" ? "light" : "dark";
    const vars = theme.varsByMode?.[mode] || theme.varsByMode.dark;

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.dataset.colorMode = mode;
    root.style.colorScheme = mode;

    try {
      window.localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {
      // Ignore storage write failures
    }
  }, [activeTheme, colorMode]);

  useEffect(() => {
    const root = document.documentElement;
    let nextX = window.innerWidth / 2;
    let nextY = window.innerHeight / 2;
    let frameId = null;

    const commitGlowPosition = () => {
      frameId = null;
      root.style.setProperty("--cursor-x", `${nextX}px`);
      root.style.setProperty("--cursor-y", `${nextY}px`);
    };

    const onPointerMove = (event) => {
      nextX = event.clientX;
      nextY = event.clientY;
      root.style.setProperty("--cursor-active", "1");

      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(commitGlowPosition);
    };

    const onPointerLeave = () => {
      root.style.setProperty("--cursor-active", "0");
    };

    root.style.setProperty("--cursor-x", `${nextX}px`);
    root.style.setProperty("--cursor-y", `${nextY}px`);
    root.style.setProperty("--cursor-active", "0");

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      root.style.removeProperty("--cursor-x");
      root.style.removeProperty("--cursor-y");
      root.style.removeProperty("--cursor-active");
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadLiveData() {
      setIsLoading(true);
      setLiveErrors([]);

      fetchMotivationalQuote()
        .then((message) => {
          if (!isCancelled && message) {
            setQuote(message);
          }
        })
        .catch(() => null);

      const githubProfileTask = githubUsername
        ? fetchGitHubProfile(githubUsername)
        : Promise.reject(new Error("GitHub profile URL is missing"));

      const githubReposTask = githubUsername
        ? fetchGitHubRepos(githubUsername, 4)
        : Promise.reject(new Error("GitHub profile URL is missing"));

      const [githubProfileResult, githubReposResult] = await Promise.allSettled([
        githubProfileTask,
        githubReposTask,
      ]);

      if (isCancelled) {
        return;
      }

      const errors = [];

      if (githubProfileResult.status === "fulfilled") {
        setGithubProfile(githubProfileResult.value);
      } else {
        errors.push("GitHub profile data unavailable");
      }

      if (githubReposResult.status === "fulfilled" && githubReposResult.value.length > 0) {
        setProjects(githubReposResult.value);
      } else {
        errors.push("Using resume project defaults");
      }

      setLiveErrors(errors);
      setIsLoading(false);
    }

    loadLiveData();

    return () => {
      isCancelled = true;
    };
  }, [githubUsername]);
  const latestRepo = projects[0] || null;
  const topLanguages = useMemo(() => {
    const languageCount = projects.reduce((accumulator, repo) => {
      const language = repo.language;
      if (!language || language === "Mixed") {
        return accumulator;
      }

      accumulator[language] = (accumulator[language] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(languageCount)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [projects]);
  const topStarredRepo = useMemo(() => {
    return projects.reduce((bestRepo, currentRepo) => {
      if (!bestRepo) {
        return currentRepo;
      }

      const bestStars = typeof bestRepo.stars === "number" ? bestRepo.stars : -1;
      const currentStars = typeof currentRepo.stars === "number" ? currentRepo.stars : -1;
      return currentStars > bestStars ? currentRepo : bestRepo;
    }, null);
  }, [projects]);
  const jobRoleInsights = useMemo(() => {
    const bulletsText = experience.bullets.join(" ").toLowerCase();
    const focusAreas = [];

    if (/automat|efficien|workflow|report/.test(bulletsText)) {
      focusAreas.push("Workflow automation and reporting optimization");
    }
    if (/kpi|dashboard|monitor/.test(bulletsText)) {
      focusAreas.push("KPI monitoring and executive dashboard storytelling");
    }
    if (/sql|python|analysis|trend/.test(bulletsText)) {
      focusAreas.push("SQL/Python-led analysis for trend and opportunity detection");
    }
    if (/uat|a\/b|test|validation/.test(bulletsText)) {
      focusAreas.push("Experiment validation and impact measurement");
    }
    if (/governance|compliance|privacy/.test(bulletsText)) {
      focusAreas.push("Data governance and compliance-ready analytics");
    }

    const suggestedRoles = [
      "Senior Data Analyst",
      "Business Intelligence Analyst",
      "Analytics Consultant",
    ];

    const tools = [...coreSkills, ...aiSkills]
      .filter((skill) => /power bi|sql|python|dax|power query|prompt|ai/i.test(skill))
      .slice(0, 6);

    return {
      summary:
        "AI-assisted role reading suggests strong fit for hybrid business + technical analytics roles where dashboard ownership, automation, and decision support are core responsibilities.",
      focusAreas: focusAreas.slice(0, 4),
      suggestedRoles,
      tools,
    };
  }, []);
  const blogUrl =
    githubProfile?.blog &&
    (/^https?:\/\//i.test(githubProfile.blog)
      ? githubProfile.blog
      : `https://${githubProfile.blog}`);
  const twitterUrl = githubProfile?.twitter ? `https://x.com/${githubProfile.twitter}` : "";
  const chatbotPrompts = [
    "What are the top skills?",
    "Tell me about current experience",
    "Show key projects",
    "How can I contact Pranjal?",
  ];
  const quickLinks = [
    { id: "insights", label: "Insights" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
  ];

  const sendChatMessage = useCallback(
    (rawMessage) => {
      const message = rawMessage.trim();
      if (!message) {
        return;
      }

      const response = buildPortfolioChatReply(message, {
        personData: person,
        experienceData: experience,
        pastRolesData: pastRoles,
        coreSkillsData: coreSkills,
        aiSkillsData: aiSkills,
        projectsData: projects,
        contactData: contact,
        githubProfileData: githubProfile,
        loading: isLoading,
      });

      const uid = Date.now();
      setChatMessages((previous) => [
        ...previous,
        { id: `user-${uid}`, role: "user", text: message },
        { id: `assistant-${uid}`, role: "assistant", text: response },
      ]);
      setChatInput("");
    },
    [githubProfile, isLoading, projects]
  );

  const sendContactMessage = useCallback(
    (event) => {
      event.preventDefault();
      const message = contactMessage.trim();

      if (!message) {
        return;
      }

      const subject = encodeURIComponent(`Portfolio Contact - ${person.name}`);
      const body = encodeURIComponent(message);
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
      setContactMessage("");
    },
    [contactMessage]
  );

  useEffect(() => {
    if (!chatScrollRef.current) {
      return;
    }

    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  return (
    <div className="portfolio-shell text-slate-100 overflow-x-hidden">
      <div className="fluid-background" aria-hidden="true">
        <span className="cursor-glow" />
        <span className="fluid-orb orb-one" />
        <span className="fluid-orb orb-two" />
        <span className="fluid-orb orb-three" />
      </div>

      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="top-nav fixed top-0 w-full border-b border-white/10 bg-slate-950/40 flex justify-between items-center px-5 md:px-10 py-4 z-50"
      >
        <div className="flex items-center gap-3">
          <span className="brand-dot" aria-hidden="true" />
          <div>
            <p className="brand-name">{person.name}</p>
            <p className="brand-role">{person.headline}</p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-1 nav-links">
          {quickLinks.map((link) => (
            <a key={link.id} href={`#${link.id}`} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTheme?.label && (
            <span className="hidden md:inline-block status-chip">{activeTheme.label}</span>
          )}
          <button
            type="button"
            className="soft-pill"
            onClick={() => setColorMode((currentMode) => toggleColorMode(currentMode))}
          >
            {colorMode === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block soft-pill"
          >
            GitHub
          </a>
          <a
            href="/resume.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            className="soft-pill soft-pill-primary"
          >
            Resume
          </a>
        </div>
      </motion.nav>

      <Section id="home">
        <div className="text-center mt-16 md:mt-20 hero-stage">
          <p className="hero-kicker text-cyan-100/90">
            Resume-Driven Portfolio
          </p>

          <motion.h1
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="font-display hero-title mt-5"
          >
            {person.headline}
          </motion.h1>

          <p className="hero-summary mt-7 text-slate-100/92 max-w-4xl mx-auto">
            {professionalSummary}
          </p>

          <p className="hero-quote mt-5 text-cyan-100/95 italic max-w-3xl mx-auto">"{quote}"</p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerHighlights.map((item) => (
              <div key={item.label} className="glass-panel text-left">
                <p className="metric-label">
                  {item.label}
                </p>
                <p className="metric-value mt-2">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#contact" className="soft-pill soft-pill-primary">
              Contact Me
            </a>
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="soft-pill"
            >
              LinkedIn
            </a>
          </div>

        </div>
      </Section>

      <Section id="insights">
        <h2 className="section-title">GitHub Profile Insights</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-panel">
            <p className="status-chip">GitHub Snapshot</p>
            {githubProfile ? (
              <div className="mt-4">
                <div className="flex items-start gap-4">
                  <img
                    src={githubProfile.avatar}
                    alt={`${githubProfile.name} avatar`}
                    className="w-16 h-16 rounded-full border border-white/20"
                  />
                  <div className="text-left">
                     <p className="card-title">{githubProfile.name}</p>
                     <p className="text-sm text-slate-300 mt-1">{githubProfile.bio}</p>
                    <a
                      href={githubProfile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-cyan-200 hover:text-cyan-100"
                    >
                      Open Profile
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="surface-card rounded-xl p-3">
                    <p className="text-xs text-slate-300">Repos</p>
                    <p className="card-title">{githubProfile.publicRepos}</p>
                  </div>
                  <div className="surface-card rounded-xl p-3">
                    <p className="text-xs text-slate-300">Followers</p>
                    <p className="card-title">{githubProfile.followers}</p>
                  </div>
                  <div className="surface-card rounded-xl p-3">
                    <p className="text-xs text-slate-300">Following</p>
                    <p className="card-title">{githubProfile.following}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">GitHub data unavailable right now.</p>
            )}
          </div>

          <div className="glass-panel">
            <p className="status-chip">About Me (GitHub)</p>
            {githubProfile ? (
              <div className="mt-4 text-left">
                <p className="card-title">
                  {githubProfile.name}
                  <span className="text-sm md:text-base text-slate-300 ml-2">
                    @{githubProfile.username || githubUsername}
                  </span>
                </p>
                <p className="mt-2 text-slate-200">{githubProfile.bio}</p>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-300">Location</p>
                    <p className="font-semibold">{githubProfile.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">Company</p>
                    <p className="font-semibold">{githubProfile.company}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={githubProfile.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-cyan-200 hover:text-cyan-100"
                  >
                    Open GitHub Profile
                  </a>
                  {blogUrl && (
                    <a
                      href={blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-cyan-200 hover:text-cyan-100"
                    >
                      Website
                    </a>
                  )}
                  {twitterUrl && (
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-cyan-200 hover:text-cyan-100"
                    >
                      @{githubProfile.twitter}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">GitHub about details unavailable.</p>
            )}
          </div>

          <div className="glass-panel">
            <p className="status-chip">Skills (GitHub Repos)</p>
            {topLanguages.length > 0 ? (
              <div className="mt-4 text-left">
                <p className="text-slate-200">
                  Derived from your recent public repositories.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topLanguages.map(([language, count]) => (
                    <span key={language} className="status-chip">
                      {language} ({count})
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-slate-300 mt-4">Most Recently Updated Repo</p>
                  <p className="font-semibold">
                    {latestRepo?.title || "Not available"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">GitHub skill data unavailable.</p>
            )}
          </div>

          <div className="glass-panel">
            <p className="status-chip">Achievements (GitHub)</p>
            {githubProfile ? (
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-left">
                <div className="surface-card rounded-xl p-3">
                  <p className="text-xs text-slate-300">Public Repos</p>
                  <p className="card-title">{githubProfile.publicRepos}</p>
                </div>
                <div className="surface-card rounded-xl p-3">
                  <p className="text-xs text-slate-300">Followers</p>
                  <p className="card-title">{githubProfile.followers}</p>
                </div>
                <div className="surface-card rounded-xl p-3">
                  <p className="text-xs text-slate-300">Public Gists</p>
                  <p className="card-title">{githubProfile.publicGists}</p>
                </div>
                <div className="surface-card rounded-xl p-3">
                  <p className="text-xs text-slate-300">Member Since</p>
                  <p className="font-semibold">{formatDate(githubProfile.joinedAt)}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-300">Top Starred Repository</p>
                  {topStarredRepo?.url ? (
                    <a
                      href={topStarredRepo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 text-cyan-200 hover:text-cyan-100"
                    >
                      {topStarredRepo.title} ({topStarredRepo.stars || 0} stars)
                    </a>
                  ) : (
                    <p className="font-semibold">Not available</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-slate-300">GitHub achievements unavailable.</p>
            )}
          </div>
        </div>

        <div className="glass-panel mt-7">
          <p className="status-chip">Professional Profiles</p>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-left">
            <div className="surface-card rounded-xl p-4">
              <p className="text-xs text-slate-300">LinkedIn</p>
                <p className="card-title">
                  {linkedinHandle ? `in/${linkedinHandle}` : "Profile"}
               </p>
              <p className="text-slate-300 mt-2">
                {person.headline} | {person.location}
              </p>
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-cyan-200 hover:text-cyan-100"
              >
                Open LinkedIn
              </a>
            </div>

            <div className="surface-card rounded-xl p-4">
              <p className="text-xs text-slate-300">GitHub</p>
                <p className="card-title">
                  @{githubProfile?.username || githubUsername || "profile"}
               </p>
              <p className="text-slate-300 mt-2">
                {(githubProfile?.publicRepos ?? 0)} repos | {(githubProfile?.followers ?? 0)} followers
              </p>
              <a
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-cyan-200 hover:text-cyan-100"
              >
                Open GitHub
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section id="skills">
        <h2 className="section-title">Skills Matrix</h2>

        <p className="subsection-title mb-4">Core Skills</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreSkills.map((skill) => (
            <motion.div
              key={skill}
              whileHover={{ scale: 1.04 }}
              className="glass-panel text-left"
            >
              {skill}
            </motion.div>
          ))}
        </div>

        <p className="subsection-title mt-10 mb-4">
          AI & Advanced Analytics
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSkills.map((skill) => (
            <motion.div
              key={skill}
              whileHover={{ scale: 1.03 }}
              className="glass-panel text-left"
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="experience">
        <h2 className="section-title">Professional Experience</h2>
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="glass-panel text-left xl:col-span-2">
            <p className="card-title">{experience.role}</p>
            <p className="text-cyan-200 mt-1">{experience.company}</p>
            <p className="text-slate-300 mt-1 text-sm">{experience.duration}</p>

            <ul className="mt-6 space-y-3">
              {experience.bullets.map((point) => (
                <li key={point} className="pl-6 relative leading-7 text-slate-200">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-cyan-300" />
                  {point}
                </li>
              ))}
            </ul>

            {pastRoles.length > 0 && (
              <>
                <p className="subsection-title mt-8">
                  Previous Experience
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  {pastRoles.map((role) => (
                    <div
                      key={`${role.company}-${role.role}-${role.duration}`}
                      className="surface-card rounded-xl p-4"
                    >
                      <p className="font-semibold">{role.role}</p>
                      <p className="text-cyan-200 mt-1">{role.company}</p>
                      <p className="text-slate-300 text-sm mt-1">{role.duration}</p>
                      <p className="text-slate-300 text-sm">{role.location}</p>
                      <ul className="mt-3 space-y-2">
                        {role.highlights.map((point) => (
                          <li key={point} className="pl-5 relative text-sm text-slate-200 leading-6">
                            <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="glass-panel text-left">
            <p className="status-chip">AI Role Highlights</p>
            <p className="mt-4 text-slate-200 leading-7">{jobRoleInsights.summary}</p>

            <p className="subsection-title mt-5">
              Best Fit Focus Areas
            </p>
            <ul className="mt-3 space-y-3">
              {jobRoleInsights.focusAreas.map((item) => (
                <li key={item} className="pl-5 relative text-slate-200 leading-6">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="subsection-title mt-5">
              Suggested Next Roles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {jobRoleInsights.suggestedRoles.map((item) => (
                <span key={item} className="status-chip">
                  {item}
                </span>
              ))}
            </div>

            <p className="subsection-title mt-5">Key Tool Stack</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {jobRoleInsights.tools.map((tool) => (
                <span key={tool} className="status-chip">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="projects">
        <h2 className="section-title">Projects</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.title}
              whileHover={{ scale: 1.02 }}
              className="glass-panel text-left"
            >
              <p className="card-title">{project.title}</p>
              <p className="text-slate-200 mt-3">{project.desc}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-cyan-100">
                {project.language && <span className="status-chip">{project.language}</span>}
                {project.impact && <span className="status-chip">{project.impact}</span>}
                {typeof project.stars === "number" && (
                  <span className="status-chip">{project.stars} stars</span>
                )}
                {project.updatedAt && (
                  <span className="status-chip">Updated {formatDate(project.updatedAt)}</span>
                )}
              </div>

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-5 text-cyan-200 hover:text-cyan-100"
                >
                  View Repository
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="credentials">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-panel text-left">
            <h2 className="section-title text-2xl mb-4">Certifications</h2>
            <ul className="space-y-3">
              {certifications.map((item) => (
                <li key={item} className="pl-5 relative text-slate-200">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel text-left">
            <h2 className="section-title text-2xl mb-4">Achievements</h2>
            <ul className="space-y-3">
              {achievements.map((item) => (
                <li key={item} className="pl-5 relative text-slate-200">
                  <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-amber-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel text-left">
            <h2 className="section-title text-2xl mb-4">Education</h2>
            <div className="space-y-4">
              {education.map((item) => (
                <div key={`${item.title}-${item.period}`} className="surface-card rounded-xl p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-300 mt-1">{item.institute}</p>
                  <p className="text-sm text-slate-300">{item.period}</p>
                  <p className="text-sm text-cyan-100 mt-1">{item.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="contact">
        <h2 className="section-title">Contact</h2>
        <div className="glass-panel text-left contact-panel mx-auto">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-slate-200">Email: {contact.email}</p>
              <p className="text-slate-200 mt-1">Phone: {person.phone}</p>
              <p className="text-slate-200 mt-1">Location: {person.location}</p>

              <div className="flex flex-wrap gap-3 mt-5">
                <a
                  href={`mailto:${contact.email}`}
                  className="soft-pill soft-pill-primary"
                >
                  Email
                </a>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="soft-pill"
                >
                  LinkedIn
                </a>
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="soft-pill"
                >
                  GitHub
                </a>
              </div>
            </div>

            <form className="contact-message-form" onSubmit={sendContactMessage}>
              <label htmlFor="contact-message" className="subsection-title">
                Send A Message
              </label>
              <textarea
                id="contact-message"
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                placeholder="Write your message here..."
                className="contact-message-box"
                rows={5}
                required
              />
              <button type="submit" className="soft-pill soft-pill-primary contact-send-button">
                Send
              </button>
            </form>
          </div>
        </div>
      </Section>

      {!isChatOpen ? (
        <div className="zoha-launcher-wrap">
          <p className="zoha-popup">
            Hi, I am <strong>Zoha</strong>
            <span>AI assistant</span>
          </p>
          <button
            type="button"
            className="zoha-launcher"
            onClick={() => setIsChatOpen(true)}
            aria-label="Open Zoha chatbot"
          >
            <span className="zoha-face" aria-hidden="true">
              <span className="zoha-ear zoha-ear-left" />
              <span className="zoha-ear zoha-ear-right" />
              <span className="zoha-eye zoha-eye-left" />
              <span className="zoha-eye zoha-eye-right" />
              <span className="zoha-nose" />
              <span className="zoha-mouth" />
            </span>
          </button>
        </div>
      ) : (
        <div className="chatbot-widget" aria-live="polite">
          <div className="chatbot-header">
            <div>
              <p className="chatbot-title">Zoha</p>
              <p className="chatbot-status">{isLoading ? "Syncing profile..." : "Ready to answer"}</p>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close Zoha chatbot"
            >
              x
            </button>
          </div>

          <div className="chatbot-prompts">
            {chatbotPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-prompt"
                onClick={() => sendChatMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div ref={chatScrollRef} className="chatbot-messages">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chatbot-bubble chatbot-bubble-${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <form
            className="chatbot-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendChatMessage(chatInput);
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask anything about Pranjal..."
              className="chatbot-input"
            />
            <button type="submit" className="chatbot-send">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
