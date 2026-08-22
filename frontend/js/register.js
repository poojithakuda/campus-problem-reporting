document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const roleSelect = document.getElementById('role');
    const staffFields = document.getElementById('staffFields');

    // Show/hide staff-only fields based on role selection
    roleSelect.addEventListener('change', function () {
        staffFields.style.display = roleSelect.value === 'staff' ? 'block' : 'none';
    });

    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = roleSelect.value;

        // ---- Basic validation ----
        if (fullname === '' || email === '' || password === '' || confirmPassword === '') {
            alert('Please fill in all fields.');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const payload = {
            full_name: fullname,
            email: email,
            password: password,
            role: role
        };

        if (role === 'staff') {
            const block = document.getElementById('block').value;
            payload.block = block;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (role === 'staff') {
                alert('Registration successful! Your staff account is pending admin approval before you can log in.');
            } else {
                alert('Registration successful! Please log in.');
            }
            window.location.href = 'login.html';

        } catch (err) {
            console.error('Registration failed:', err);
            const message = err.data?.detail || 'Registration failed. Please try again.';
            alert(message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    });
});