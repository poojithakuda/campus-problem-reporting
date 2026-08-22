document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page ----
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const blockGroup = document.getElementById('blockFieldGroup');
    const blockSelect = document.getElementById('profileBlock');

    // ---- 2. Fetch real profile info ----
    try {
        const user = await apiRequest('/users/me', { method: 'GET' });

        document.getElementById('profileName').value = user.full_name;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileRole').value =
            user.role.charAt(0).toUpperCase() + user.role.slice(1);

        // only staff have a working block
        if (user.role === 'staff') {
            blockGroup.style.display = 'block';
            if (user.block) {
                blockSelect.value = user.block;
            }
        } else {
            blockGroup.style.display = 'none';
        }

    } catch (err) {
        console.error('Failed to load profile:', err);
        if (err.status === 401) {
            logout();
        }
    }

    // ---- 3. Save changes ----
    document.getElementById('saveProfileBtn').addEventListener('click', async function () {
        const newName = document.getElementById('profileName').value.trim();
        const newPassword = document.getElementById('newPassword').value;

        if (newName === '') {
            alert('Name cannot be empty.');
            return;
        }
        if (newPassword !== '' && newPassword.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }

        const body = { full_name: newName };
        if (newPassword !== '') {
            body.password = newPassword;
        }
        if (blockGroup.style.display !== 'none') {
            body.block = blockSelect.value;
        }

        const saveBtn = document.getElementById('saveProfileBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const updatedUser = await apiRequest('/users/me', {
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            localStorage.setItem('userName', updatedUser.full_name);
            document.getElementById('newPassword').value = '';
            alert('Profile updated successfully!');

        } catch (err) {
            console.error('Failed to update profile:', err);
            const message = err.data?.detail || 'Failed to update profile. Please try again.';
            alert(message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });

    // ---- 4. Logout ----
    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

});