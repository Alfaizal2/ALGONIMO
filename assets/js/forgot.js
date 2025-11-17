const fpEmail = document.getElementById("fpEmail");
const fpNewPass = document.getElementById("fpNewPass");
const newPassSection = document.getElementById("newPassSection");
const fpBtn = document.getElementById("fpBtn");

let step = 1;

/* Step 1 — verify email */
fpBtn.addEventListener("click", () => {
    const savedUser = JSON.parse(localStorage.getItem("alg_user_data"));
    
    if (step === 1) {
        if (!fpEmail.value) {
            alert("Enter your email.");
            return;
        }

        if (!savedUser || savedUser.email !== fpEmail.value) {
            alert("Email not found!");
            return;
        }

        // Show new password field
        newPassSection.style.display = "block";
        fpBtn.textContent = "Reset Password";
        step = 2;
    }

    /* Step 2 — set new password */
    else if (step === 2) {
        if (fpNewPass.value.trim().length < 4) {
            alert("Password must be at least 4 characters.");
            return;
        }

        localStorage.setItem("alg_user_password", fpNewPass.value.trim());
        alert("✅ Password reset successfully!");
        window.location.href = "./login.html";
    }
});
