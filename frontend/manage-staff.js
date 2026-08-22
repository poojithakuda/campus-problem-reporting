document.addEventListener('DOMContentLoaded', async function () {

    if (!isLoggedIn() || getUserRole() !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
    });

    const form = document.getElementById('createStaffForm');
    const formMessage = document.getElementById('formMessage');
    const staffListBody = document.getElementById('staffListBody');

    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editStaffForm');
    const editModalMessage = document.getElementById('editModalMessage');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    const currentUserId = Number(localStorage.getItem('userId'));

    async function loadStaffList() {
        try {
            const users = await apiRequest('/users/staff');
            if (!users.length) {
                staffListBody.innerHTML = '<tr><td colspan="5" class="empty-message">No staff or admin accounts yet.</td></tr>';
                return;
            }
            staffListBody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.full_name}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>
                        <button class="btn-secondary edit-btn" data-id="${u.id}" data-name="${u.full_name}" data-email="${u.email}" data-role="${u.role}">Edit</button>
                        ${u.id === currentUserId ? '' : `<button class="btn-secondary delete-btn" data-id="${u.id}" data-email="${u.email}">Delete</button>`}
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => openEditModal(btn.dataset));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => handleDelete(btn.dataset.id, btn.dataset.email));
            });

        } catch (err) {
            staffListBody.innerHTML = '<tr><td colspan="5" class="empty-message">Failed to load staff list.</td></tr>';
        }
    }

    function openEditModal(data) {
        editModalMessage.textContent = '';
        document.getElementById('editUserId').value = data.id;
        document.getElementById('editFullName').value = data.name;
        document.getElementById('editEmail').value = data.email;
        document.getElementById('editPassword').value = '';
        document.getElementById('editRole').value = data.role;
        editModal.style.display = 'flex';
    }

    cancelEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    editForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        editModalMessage.textContent = '';

        const userId = document.getElementById('editUserId').value;
        const payload = {
            full_name: document.getElementById('editFullName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            role: document.getElementById('editRole').value
        };
        const password = document.getElementById('editPassword').value;
        if (password) {
            payload.password = password;
        }

        try {
            await apiRequest(`/users/staff/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            editModal.style.display = 'none';
            loadStaffList();
        } catch (err) {
            editModalMessage.textContent = err.data?.detail || 'Failed to update account.';
            editModalMessage.style.color = 'red';
        }
    });

    async function handleDelete(userId, email) {
        if (!confirm(`Delete the account for ${email}? This cannot be undone.`)) {
            return;
        }
        try {
            await apiRequest(`/users/staff/${userId}`, { method: 'DELETE' });
            loadStaffList();
        } catch (err) {
            alert(err.data?.detail || 'Failed to delete account.');
        }
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        formMessage.textContent = '';

        const full_name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            await apiRequest('/auth/register-staff', {
                method: 'POST',
                body: JSON.stringify({ full_name, email, password, role })
            });

            formMessage.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully for ${email}.`;
            formMessage.style.color = 'green';
            form.reset();
            loadStaffList();

        } catch (err) {
            const message = err.data?.detail || 'Failed to create account.';
            formMessage.textContent = message;
            formMessage.style.color = 'red';
        }
    });

    loadStaffList();
});