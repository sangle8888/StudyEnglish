/**
 * Quản lý trạng thái và giao diện Đăng nhập / Đăng ký
 */

// 1. Hiển thị thông báo trạng thái hoặc lỗi
function showAuthMessage(messageId, message, isError = true) {
  const target = document.getElementById(messageId);
  if (!target) return;
  target.textContent = message;
  target.className = isError
    ? "auth-message text-xs text-red-500 font-medium mt-2 min-h-[1.25rem]"
    : "auth-message text-xs text-emerald-600 font-medium mt-2 min-h-[1.25rem]";
}

// 2. Chuyển đổi giữa Đăng nhập và Đăng ký (Đồng bộ cả Tab và Text chân trang)
function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const switchPrompt = document.getElementById("authSwitchPrompt");
  const switchLink = document.getElementById("authSwitchLink");

  // Xóa sạch thông báo lỗi cũ khi đổi tab
  showAuthMessage("loginMessage", "");
  showAuthMessage("registerMessage", "");

  const activeClass = [
    "bg-white",
    "dark:bg-slate-700",
    "text-slate-900",
    "dark:text-white",
    "shadow-sm",
  ];
  const inactiveClass = ["text-slate-500", "dark:text-slate-400"];

  if (tab === "login") {
    loginForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");

    tabLogin?.classList.add(...activeClass);
    tabLogin?.classList.remove(...inactiveClass);

    tabRegister?.classList.remove(...activeClass);
    tabRegister?.classList.add(...inactiveClass);

    if (switchPrompt) switchPrompt.textContent = "Chưa có tài khoản?";
    if (switchLink) switchLink.textContent = "Bắt đầu miễn phí";
  } else {
    loginForm?.classList.add("hidden");
    registerForm?.classList.remove("hidden");

    tabRegister?.classList.add(...activeClass);
    tabRegister?.classList.remove(...inactiveClass);

    tabLogin?.classList.remove(...activeClass);
    tabLogin?.classList.add(...inactiveClass);

    if (switchPrompt) switchPrompt.textContent = "Đã có tài khoản?";
    if (switchLink) switchLink.textContent = "Đăng nhập ngay";
  }
}

// 3. Hàm đảo tab nhanh từ nút bấm chân trang
function toggleAuthTab() {
  const isLoginActive = !document
    .getElementById("loginForm")
    ?.classList.contains("hidden");
  switchTab(isLoginActive ? "register" : "login");
}

// 4. Bật / Ẩn mật khẩu
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

// 5. Bật / Tắt Dark Mode và ghi nhớ vào LocalStorage
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById("themeIcon");
  const isDark = html.classList.toggle("dark");

  if (icon) {
    if (isDark) {
      icon.classList.replace("fa-sun", "fa-moon");
    } else {
      icon.classList.replace("fa-moon", "fa-sun");
    }
  }
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Khôi phục theme đã lưu khi tải trang
(function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
  const icon = document.getElementById("themeIcon");

  if (isDark) {
    document.documentElement.classList.add("dark");
    if (icon) icon.classList.replace("fa-sun", "fa-moon");
  } else {
    document.documentElement.classList.remove("dark");
    if (icon) icon.classList.replace("fa-moon", "fa-sun");
  }
})();

// 6. Xử lý Đăng nhập Google (OAuth Placeholder)
function beginGoogleSignIn() {
  showAuthMessage(
    "loginMessage",
    "Đăng nhập Google cần được cấu hình OAuth Client ID với hệ thống máy chủ.",
  );
}

// 7. Xử lý Gửi dữ liệu Đăng nhập (AJAX - Fetch API)
document
  .getElementById("loginForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput =
      document.getElementById("loginEmail") ||
      this.querySelector('input[type="email"]');
    const passwordInput = document.getElementById("loginPassword");
    const btnSubmit =
      document.getElementById("btnLoginSubmit") ||
      this.querySelector('button[type="submit"]');

    showAuthMessage("loginMessage", "");

    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Đang đăng nhập...`;

    const payload = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
    };

    try {
      const response = await fetch("/Login/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.redirectUrl || "/";
      } else {
        showAuthMessage(
          "loginMessage",
          data.message || "Email hoặc mật khẩu không chính xác.",
        );
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
      }
    } catch (err) {
      showAuthMessage(
        "loginMessage",
        "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      );
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  });

// 8. Xử lý Gửi dữ liệu Đăng ký (AJAX - Fetch API)
document
  .getElementById("registerForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullNameInput = document.getElementById("regFullName");
    const emailInput = document.getElementById("regEmail");
    const passwordInput = document.getElementById("regPassword");
    const birthYearInput = document.getElementById("regBirthYear");
    const hometownInput = document.getElementById("regHometown");
    const btnSubmit =
      document.getElementById("btnRegisterSubmit") ||
      this.querySelector('button[type="submit"]');

    showAuthMessage("registerMessage", "");

    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Đang xử lý...`;

    const payload = {
      fullName: fullNameInput ? fullNameInput.value.trim() : "",
      email: emailInput ? emailInput.value.trim() : "",
      password: passwordInput ? passwordInput.value : "",
      birthYear:
        birthYearInput && birthYearInput.value
          ? parseInt(birthYearInput.value)
          : null,
      hometown: hometownInput ? hometownInput.value.trim() : null,
    };

    try {
      const response = await fetch("/Login/Register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Đăng ký thành công!");
        this.reset();
        switchTab("login");
      } else {
        showAuthMessage(
          "registerMessage",
          data.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",
        );
      }
    } catch (err) {
      showAuthMessage(
        "registerMessage",
        "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
      );
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
    }
  });

// 9. Tự động mở Tab Đăng ký nếu đường dẫn có hash #register
function handleUrlHash() {
  if (
    window.location.hash === "#registerForm" ||
    window.location.hash === "#register"
  ) {
    switchTab("register");
  }
}

window.addEventListener("load", handleUrlHash);
window.addEventListener("hashchange", handleUrlHash);
