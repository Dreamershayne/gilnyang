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

// ===== 모바일 네비게이션 =====
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("main-nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove("open");
    }
  });
}

// ===== Firebase 인증 =====
const loginBtn = document.getElementById("login-btn");

if (loginBtn) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName?.split(" ")[0] || "집사";
      loginBtn.textContent = `${name} ▾`;
    } else {
      loginBtn.textContent = "로그인";
    }
  });

  loginBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (user) {
      await signOut(auth);
    } else {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (e) {
        console.error("로그인 오류:", e);
      }
    }
  });
}

// ===== 현재 페이지 nav 활성화 =====
const currentPath = window.location.pathname;
document.querySelectorAll(".nav__link").forEach((link) => {
  if (link.getAttribute("href") === currentPath) {
    link.classList.add("active");
  }
});
