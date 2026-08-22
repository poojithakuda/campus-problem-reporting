document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page: must be logged in AND role = admin ----
    if (!isLoggedIn() || getUserRole() !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const tableBody = document.getElementById('recentComplaintsBody');
    const pendingStaffBody = document.getElementById('pendingStaffBody');

    // ---- 2. Fetch all complaints from the backend ----
    let allComplaints = [];
    try {
        allComplaints = await apiRequest('/complaints/', {
            method: 'GET'
        });
    } catch (err) {
        console.error('Failed to load complaints:', err);
        if (err.status === 401) {
            logout();
            return;
        }
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-message">Failed to load complaints.</td></tr>';
        return;
    }

    // ---- 3. Calculate and display stats ----
    const stats = {
        total: allComplaints.length,
        pending: allComplaints.filter(c => c.status === 'Pending').length,
        assigned: allComplaints.filter(c => c.status === 'Assigned').length,
        inProgress: allComplaints.filter(c => c.status === 'In Progress').length,
        resolved: allComplaints.filter(c => c.status === 'Resolved').length,
        rejected: allComplaints.filter(c => c.status === 'Rejected').length
    };

    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('assignedCount').textContent = stats.assigned;
    document.getElementById('progressCount').textContent = stats.inProgress;
    document.getElementById('resolvedCount').textContent = stats.resolved;
    document.getElementById('rejectedCount').textContent = stats.rejected;

    // ---- 4. Show the 5 most recent complaints in the table ----
    function getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s/g, '');
    }

    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    tableBody.innerHTML = '';

    if (allComplaints.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-message">No complaints yet.</td></tr>';
    } else {
        allComplaints.slice(0, 5).forEach(function (c) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.complaint_code}</td>
                <td>Student #${c.student_id}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
                <td><a href="admin-complaints.html" class="btn-secondary">View</a></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ---- 5. Load pending staff approval requests ----
    let departmentsList = [];

    async function loadDepartments() {
        try {
            departmentsList = await apiRequest('/departments/', { method: 'GET' });
        } catch (err) {
            console.error('Failed to load departments:', err);
            departmentsList = [];
        }
    }

    function departmentOptionsHtml() {
        if (departmentsList.length === 0) {
            return '<option value="">No departments found</option>';
        }
        return departmentsList.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }

    async function loadPendingStaff() {
        pendingStaffBody.innerHTML = '<tr><td colspan="5" class="empty-message">Loading...</td></tr>';

        let pendingStaff = [];
        try {
            pendingStaff = await apiRequest('/admin/pending-staff', {
                method: 'GET'
            });
        } catch (err) {
            console.error('Failed to load pending staff:', err);
            pendingStaffBody.innerHTML = '<tr><td colspan="5" class="empty-message">Failed to load pending staff.</td></tr>';
            return;
        }

        if (pendingStaff.length === 0) {
            pendingStaffBody.innerHTML = '<tr><td colspan="5" class="empty-message">No pending staff requests.</td></tr>';
            return;
        }

        pendingStaffBody.innerHTML = '';
        pendingStaff.forEach(function (u) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${u.id}</td>
                <td>${u.full_name}</td>
                <td>${u.email}<br><small>${u.block || '—'}</small></td>
                <td>
                    <select class="dept-select" data-id="${u.id}">
                        ${departmentOptionsHtml()}
                    </select>
                </td>
                <td>
                    <button class="btn-approve" data-id="${u.id}">Approve</button>
                    <button class="btn-reject" data-id="${u.id}">Reject</button>
                </td>
            `;
            pendingStaffBody.appendChild(row);
        });

        // wire up Approve buttons
        pendingStaffBody.querySelectorAll('.btn-approve').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const id = btn.getAttribute('data-id');
                const deptSelect = pendingStaffBody.querySelector(`.dept-select[data-id="${id}"]`);
                const departmentId = deptSelect.value;

                if (!departmentId) {
                    alert('Please select a department before approving.');
                    return;
                }

                btn.disabled = true;
                try {
                    // Step 1: assign department
                    await apiRequest('/departments/assign-staff', {
                        method: 'POST',
                        body: JSON.stringify({
                            user_id: parseInt(id, 10),
                            department_id: parseInt(departmentId, 10)
                        })
                    });

                    // Step 2: approve the account
                    await apiRequest(`/admin/approve-staff/${id}`, { method: 'PATCH' });

                    loadPendingStaff();
                } catch (err) {
                    console.error('Approve failed:', err);
                    const message = err.data?.detail || 'Failed to approve staff member.';
                    alert(message);
                    btn.disabled = false;
                }
            });
        });

        // wire up Reject buttons
        pendingStaffBody.querySelectorAll('.btn-reject').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                const id = btn.getAttribute('data-id');
                btn.disabled = true;
                try {
                    await apiRequest(`/admin/reject-staff/${id}`, { method: 'PATCH' });
                    loadPendingStaff();
                } catch (err) {
                    console.error('Reject failed:', err);
                    alert('Failed to reject staff member.');
                    btn.disabled = false;
                }
            });
        });
    }

    await loadDepartments();
    await loadPendingStaff();

    // ---- 6. Logout ----
    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

});