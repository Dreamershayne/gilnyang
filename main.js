import {
  auth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "/js/firebase-config.js";

// ===== 다크/라이트 모드 =====
const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// ===== 모바일 햄버거 메뉴 =====
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("main-nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.classList.toggle("open");
    navToggle.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove("open");
      navToggle.classList.remove("open");
    }
  });
}

// ===== Firebase 인증 상태 =====
const loginBtn = document.getElementById("login-btn");
const userMenu = document.getElementById("user-menu");
const userInitial = document.getElementById("user-initial");
const userNameEl = document.getElementById("user-dropdown-name");
const userAvatarBtn = document.getElementById("user-avatar-btn");
const userDropdown = document.getElementById("user-dropdown");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // 로그인 상태: 로그인 버튼 숨기고 아바타 표시
    if (loginBtn) loginBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "flex";

    const name = user.displayName || user.email || "집사";
    if (userInitial) userInitial.textContent = name[0].toUpperCase();
    if (userNameEl) userNameEl.textContent = name;
  } else {
    // 비로그인 상태
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (userMenu) userMenu.style.display = "none";
  }
});

// 로그인 버튼 클릭
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("로그인 오류:", e);
    }
  });
}

// 아바타 클릭 → 드롭다운 토글
if (userAvatarBtn && userDropdown) {
  userAvatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    userDropdown.classList.remove("open");
  });
}

// 로그아웃
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    userDropdown.classList.remove("open");
  });
}

// ===== 현재 페이지 nav 활성화 =====
const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
document.querySelectorAll(".nav__link").forEach((link) => {
  const href = link.getAttribute("href").replace(/\/$/, "") || "/";
  if (href === currentPath) {
    link.classList.add("active");
  }
});
