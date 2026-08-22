document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page: must be logged in AND role = staff ----
    if (!isLoggedIn() || getUserRole() !== 'staff') {
        window.location.href = 'login.html';
        return;
    }

    // ---- 2. Show staff name ----
    const userName = localStorage.getItem('userName') || 'Staff';
    document.getElementById('staffName').textContent = userName;

    const tableBody = document.getElementById('staffComplaintsBody');
    let myComplaints = [];

    // ---- 3. Fetch complaints assigned to this staff's department ----
    async function loadComplaints() {
        try {
            myComplaints = await apiRequest('/complaints/staff/assigned', {
                method: 'GET'
            });
        } catch (err) {
            console.error('Failed to load complaints:', err);
            if (err.status === 401) {
                logout();
                return;
            }
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Failed to load complaints.</td></tr>';
            return;
        }

        renderStats();
        renderTable();
    }

    // ---- 4. Calculate and display stats ----
    function renderStats() {
        document.getElementById('assignedCount').textContent = myComplaints.length;
        document.getElementById('progressCount').textContent =
            myComplaints.filter(c => c.status === 'In Progress').length;
        document.getElementById('resolvedCount').textContent =
            myComplaints.filter(c => c.status === 'Resolved').length;
    }

    // ---- 5. Render table ----
    function getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s/g, '');
    }

    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function renderTable() {
        tableBody.innerHTML = '';

        if (myComplaints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">No complaints assigned yet.</td></tr>';
            return;
        }

        myComplaints.forEach(function (c) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.complaint_code}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
                <td><button class="btn-secondary staff-update-btn" data-id="${c.id}">Update</button></td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.staff-update-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openModal(btn.getAttribute('data-id'));
            });
        });
    }

    // ---- 6. Modal logic ----
    const modal = document.getElementById('updateModal');
    const staffStatus = document.getElementById('staffStatus');
    const staffRemarks = document.getElementById('staffRemarks');
    let currentEditId = null;

    function openModal(complaintId) {
        const complaint = myComplaints.find(c => c.id === Number(complaintId));
        if (!complaint) return;

        currentEditId = complaintId;
        staffStatus.value = complaint.status;
        staffRemarks.value = '';

        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        currentEditId = null;
    }

    document.getElementById('cancelUpdateBtn').addEventListener('click', closeModal);

    document.getElementById('saveUpdateBtn').addEventListener('click', async function () {
        if (!currentEditId) return;

        const saveBtn = document.getElementById('saveUpdateBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            await apiRequest(`/complaints/${currentEditId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: staffStatus.value })
            });

            closeModal();
            await loadComplaints();

        } catch (err) {
            console.error('Failed to update status:', err);
            const message = err.data?.detail || 'Failed to update status. Please try again.';
            alert(message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Update';
        }
    });

    // ---- 7. Logout ----
    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

    // ---- 8. Initial load ----
    loadComplaints();

});