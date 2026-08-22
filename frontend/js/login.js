document.addEventListener('DOMContentLoaded', function () {

    const loginForm = document.getElementById('loginForm');
    const selectedRoleInput = document.getElementById('selectedRole');
    const roleButtons = document.querySelectorAll('.role-btn');

    // --- Role toggle ---
    roleButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRoleInput.value = btn.dataset.role;
        });
    });

    // --- Login submit ---
    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const selectedRole = selectedRoleInput.value;

        try {
            const result = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // Safety check: does the account's real role match what they selected?
            if (result.user.role !== selectedRole) {
                alert(`This account is registered as "${result.user.role}", not "${selectedRole}". Please select the correct login type.`);
                return;
            }

            localStorage.setItem('token', result.access_token);
            localStorage.setItem('userRole', result.user.role);
            localStorage.setItem('userName', result.user.full_name);
            localStorage.setItem('userId', result.user.id);

            const redirects = {
                student: 'student-dashboard.html',
                admin: 'admin-dashboard.html',
                staff: 'staff-dashboard.html'
            };

            window.location.href = redirects[result.user.role] || 'login.html';

        } catch (err) {
            const message = err.data?.detail || 'Invalid email or password.';
            alert(message);
        }
    });

});