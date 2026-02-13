
const CONFIG = {
  blockedChannels: [
    "LankyBox",
    "hooplakidz",
    "shappysway",
    "9meoww",
    "artinyange",
    "ogmomothecat"
  ],

  blockedKeywords: [
    "sora",
    "nursery rhyme",
    "kids song",
    "baby song",
    "learn colors",
    "abc song",
    "phonics song",
    "pop mart",
    "cartoon for kids"
  ]
};



const style = document.createElement("style");
style.textContent = `
  .yt-blocked-overlay {
    position: absolute;
    top:0; left:0;
    width:100%; height:100%;
    background:rgba(0,0,0,0.85);
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:20px;
    font-family:sans-serif;
    z-index:9999;
    pointer-events: all;
    text-align:center;
    padding:10px;
    box-sizing:border-box;
  }
`;
document.head.appendChild(style);



const normalize = str => (str || "").toLowerCase().trim();

function containsBlockedChannel(text) {
  const value = normalize(text);
  return CONFIG.blockedChannels.some(ch => value.includes(normalize(ch)));
}

function containsBlockedKeyword(text) {
  const value = normalize(text);
  return CONFIG.blockedKeywords.some(keyword => value.includes(normalize(keyword)));
}

function hasEmojiSpam(text) {
  const emojiMatches = text.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];
  return emojiMatches.length >= 5;
}



function getVideoData(el) {
  const title =
    el.querySelector("#video-title")?.textContent ||
    el.querySelector("a#video-title-link")?.textContent ||
    el.querySelector("h3")?.textContent ||
    "";

  const channelText =
    el.querySelector("#byline-container a")?.textContent ||
    el.querySelector("ytd-channel-name a")?.textContent ||
    "";

  const channelURL =
    el.querySelector("a.yt-simple-endpoint.yt-formatted-string")
      ?.href || "";

  return {
    title: normalize(title),
    channelText: normalize(channelText),
    channelURL: normalize(channelURL)
  };
}



function shouldBlock(el) {
  const { title, channelText, channelURL } = getVideoData(el);

  if (!title && !channelText) return false;

  if (containsBlockedChannel(channelText)) return true;
  if (containsBlockedChannel(channelURL)) return true;
  if (containsBlockedKeyword(title)) return true;
  if (hasEmojiSpam(title)) return true;

  return false;
}



const SELECTORS = [
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-reel-video-renderer"
];



function blockVideo(el) {
  // Pause any <video>
  const videos = el.querySelectorAll("video");
  videos.forEach(v => {
    v.pause();
    v.currentTime = 0;
    v.muted = true;
    v.controls = false;
  });

  // Overlay to prevent watching
  if (!el.querySelector(".yt-blocked-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "yt-blocked-overlay";
    overlay.textContent = "🚫 Blocked by AI Slop Blocker";
    el.style.position = "relative";
    el.appendChild(overlay);
  }
}



function scan(root = document) {
  SELECTORS.forEach(selector => {
    root.querySelectorAll(selector).forEach(el => {
      if (shouldBlock(el)) {
        const container = el.closest(SELECTORS.join(",")) || el;
        blockVideo(container);
      }
    });
  });
}



function blockChannelPage() {
  const url = normalize(location.href);
  if (CONFIG.blockedChannels.some(ch => url.includes(ch))) {
    document.documentElement.innerHTML = `
      <div style="
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#111;
        color:#fff;
        font-size:28px;
        font-family:sans-serif;
        text-align:center;
        padding: 20px;
      ">
        🚫 This channel is permanently blocked by AI Slop Blocker
      </div>
    `;
  }
}



function blockShortsPlayer() {
  const player = document.querySelector("ytd-reel-video-renderer");
  if (!player) return;
  const video = player.querySelector("video");
  if (video) {
    video.pause();
    video.currentTime = 0;
    video.muted = true;
    video.controls = false;

    if (!player.querySelector(".yt-blocked-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "yt-blocked-overlay";
      overlay.textContent = "🚫 Blocked by AI Slop Blocker";
      player.style.position = "relative";
      player.appendChild(overlay);
    }
  }
}


function attach() {
  const runAll = () => {
    scan();
    blockChannelPage();
    blockShortsPlayer();
  };

  document.addEventListener("yt-navigate-finish", runAll);
  document.addEventListener("yt-page-data-updated", runAll);

  const app = document.querySelector("ytd-app");
  if (app) {
    new MutationObserver(() => runAll()).observe(app, {
      childList: true,
      subtree: true
    });
  }

  runAll();
}


function wait() {
  const i = setInterval(() => {
    if (document.querySelector("ytd-app")) {
      clearInterval(i);
      attach();
    }
  }, 200);
}

wait();
