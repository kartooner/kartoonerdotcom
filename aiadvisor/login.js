// SHA-256 hash of "greatscott"
const correctPasswordHash = '6b07f7ecaf72ae5acc240e02e23768cf390ab7291d7743c182b1eb701597ba51';

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isSessionValid() {
    const authTime = sessionStorage.getItem('aiadvisor_auth_time');
    if (!authTime) return false;
    const elapsed = Date.now() - parseInt(authTime);
    return elapsed < 1800000; // 30 minutes
}

const form = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error');

if (form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.textContent;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Checking...';
        submitButton.classList.add('opacity-75', 'cursor-wait');

        const password = passwordInput.value;
        const passwordHash = await hashPassword(password);

        if (passwordHash === correctPasswordHash) {
            sessionStorage.setItem('aiadvisor_auth', 'true');
            sessionStorage.setItem('aiadvisor_auth_time', Date.now().toString());
            submitButton.textContent = 'Success!';
            window.location.href = '/aiadvisor/app.html';
        } else {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = buttonText;
            submitButton.classList.remove('opacity-75', 'cursor-wait');

            errorMsg.classList.remove('hidden');
            passwordInput.classList.add('border-red-500', 'animate-shake');
            passwordInput.value = '';
            passwordInput.focus();

            setTimeout(() => {
                passwordInput.classList.remove('animate-shake');
            }, 500);
        }
    });
}

// Check if already authenticated and redirect
if (sessionStorage.getItem('aiadvisor_auth') === 'true' && isSessionValid()) {
    window.location.href = '/aiadvisor/app.html';
} else if (sessionStorage.getItem('aiadvisor_auth') === 'true') {
    // Clear expired session
    sessionStorage.removeItem('aiadvisor_auth');
    sessionStorage.removeItem('aiadvisor_auth_time');
}
