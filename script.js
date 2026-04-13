const body = document.body;
const toggleBtn = document.getElementById("darkToggle");
const scrollBtn = document.getElementById("scrollTopBtn");
const courseForm = document.querySelector(".course-form");
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_KEY = "themePreference";

function readStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

function applyTheme(theme, options = {}) {
  const { persist = false } = options;
  const isDark = theme === "dark";

  body.classList.toggle("dark", isDark);

  if (toggleBtn) {
    toggleBtn.checked = isDark;
  }

  if (persist) {
    localStorage.setItem(THEME_KEY, theme);
  }
}

function syncThemeFromPreference() {
  const storedTheme = readStoredTheme();
  const preferredTheme = storedTheme || (themeMedia.matches ? "dark" : "light");
  applyTheme(preferredTheme);
}

syncThemeFromPreference();

if (toggleBtn) {
  toggleBtn.addEventListener("change", () => {
    applyTheme(toggleBtn.checked ? "dark" : "light", { persist: true });
  });
}

if (typeof themeMedia.addEventListener === "function") {
  themeMedia.addEventListener("change", () => {
    if (!readStoredTheme()) {
      syncThemeFromPreference();
    }
  });
} else if (typeof themeMedia.addListener === "function") {
  themeMedia.addListener(() => {
    if (!readStoredTheme()) {
      syncThemeFromPreference();
    }
  });
}

function handleScrollButton() {
  if (!scrollBtn) return;
  scrollBtn.classList.toggle("show", window.scrollY > 240);
}

window.addEventListener("scroll", handleScrollButton, { passive: true });
handleScrollButton();

if (scrollBtn) {
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const revealElements = document.querySelectorAll(".reveal");

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("show"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

function showToast(message, type = "success") {
  const oldToast = document.querySelector(".custom-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }, 2600);
}

if (courseForm) {
  courseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = courseForm.querySelector('button[type="submit"]');
    const action = courseForm.getAttribute("action") || "";
    const formData = new FormData(courseForm);

    if (!action || action.includes("YOUR_FORM_ID")) {
      showToast(
        "Bạn cần thay YOUR_FORM_ID bằng Formspree ID thật trước khi dùng form.",
        "error",
      );
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent || "Gửi đăng ký";
      submitBtn.textContent = "Đang gửi...";
      submitBtn.setAttribute("aria-busy", "true");
    }

    try {
      const response = await fetch(action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        courseForm.reset();
        showToast(
          "Đăng ký thành công! Mình sẽ liên hệ với bạn sớm nhé.",
          "success",
        );
      } else {
        let errorMessage = "Gửi đăng ký chưa thành công. Bạn thử lại nhé.";

        try {
          const data = await response.json();
          if (Array.isArray(data.errors) && data.errors[0]?.message) {
            errorMessage = data.errors[0].message;
          }
        } catch (jsonError) {
          // keep fallback
        }

        showToast(errorMessage, "error");
      }
    } catch (error) {
      showToast("Có lỗi kết nối. Bạn kiểm tra mạng rồi thử lại nhé.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "Gửi đăng ký";
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
}
