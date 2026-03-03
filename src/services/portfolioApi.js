const REQUEST_TIMEOUT_MS = 10000;

function withTimeout() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { controller, timeoutId };
}

async function fetchJson(url, options = {}) {
  const { controller, timeoutId } = withTimeout();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchText(url) {
  const { controller, timeoutId } = withTimeout();

  try {
    const response = await fetch(url, {
      headers: { Accept: "text/plain" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function getWeatherLabel(code) {
  const labels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Rain showers",
    81: "Moderate showers",
    82: "Violent showers",
    95: "Thunderstorm",
  };

  return labels[code] || "Variable conditions";
}

export async function fetchGitHubProfile(username) {
  const data = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(username)}`
  );

  return {
    username: data.login || username,
    avatar: data.avatar_url,
    name: data.name || username,
    bio: data.bio || "Building analytics workflows and business insights.",
    publicRepos: data.public_repos ?? 0,
    publicGists: data.public_gists ?? 0,
    followers: data.followers ?? 0,
    following: data.following ?? 0,
    location: data.location || "Not specified",
    company: data.company || "Independent",
    blog: data.blog || "",
    twitter: data.twitter_username || "",
    accountType: data.type || "User",
    joinedAt: data.created_at || null,
    updatedAt: data.updated_at || null,
    profileUrl: data.html_url,
  };
}

export async function fetchGitHubRepos(username, limit = 4) {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(12, limit))
    : 4;

  const data = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(
      username
    )}/repos?sort=updated&per_page=${safeLimit}`
  );

  return data.map((repo) => ({
    title: repo.name,
    desc: repo.description || "Repository containing production-focused work.",
    url: repo.html_url,
    stars: repo.stargazers_count ?? 0,
    language: repo.language || "Mixed",
    updatedAt: repo.updated_at,
    impact: "Live repository data",
  }));
}

export async function fetchMotivationalQuote() {
  const message = await fetchText("https://api.github.com/zen");
  return message || "Data becomes powerful when insight meets action.";
}

export async function fetchIndiaSnapshot() {
  const data = await fetchJson(
    "https://restcountries.com/v3.1/name/india?fields=name,capital,population,region,subregion,timezones,languages,currencies"
  );

  const country = Array.isArray(data) ? data[0] : data;
  const currency =
    country?.currencies &&
    Object.entries(country.currencies)
      .map(([, value]) => value?.name)
      .filter(Boolean)[0];

  const languages = country?.languages
    ? Object.values(country.languages).slice(0, 3).join(", ")
    : "Not available";

  return {
    name: country?.name?.common || "India",
    capital: country?.capital?.[0] || "New Delhi",
    region: country?.region || "Asia",
    subregion: country?.subregion || "Southern Asia",
    population: country?.population ?? 0,
    timezone: country?.timezones?.[0] || "UTC+05:30",
    currency: currency || "Indian Rupee",
    languages,
  };
}

export async function fetchKolkataWeather() {
  const data = await fetchJson(
    "https://api.open-meteo.com/v1/forecast?latitude=22.5726&longitude=88.3639&current=temperature_2m,wind_speed_10m,weather_code&timezone=Asia%2FKolkata"
  );

  const current = data?.current || {};
  return {
    city: "Kolkata",
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    condition: getWeatherLabel(current.weather_code),
  };
}

export async function fetchIndiaTime() {
  const data = await fetchJson("https://worldtimeapi.org/api/timezone/Asia/Kolkata");

  return {
    datetime: data?.datetime || null,
    abbreviation: data?.abbreviation || "IST",
    dayOfWeek: data?.day_of_week,
    weekNumber: data?.week_number,
  };
}

export async function fetchAnalyticsPulse(limit = 4) {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(8, limit))
    : 4;

  const data = await fetchJson(
    `https://hn.algolia.com/api/v1/search_by_date?query=data%20analytics&tags=story&hitsPerPage=${safeLimit}`
  );

  const hits = Array.isArray(data?.hits) ? data.hits : [];

  return hits
    .map((item) => ({
      title: item.title || "Untitled story",
      url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
      source: "Hacker News",
      publishedAt: item.created_at,
      points: item.points ?? 0,
    }))
    .filter((item) => Boolean(item.title) && Boolean(item.url));
}
