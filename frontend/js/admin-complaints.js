document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page ----
    if (!isLoggedIn() || getUserRole() !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const tableBody = document.getElementById('allComplaintsBody');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const assignDept = document.getElementById('assignDept');
    const updateStatus = document.getElementById('updateStatus');
    const adminRemarks = document.getElementById('adminRemarks');
    const modal = document.getElementById('assignModal');

    let allComplaints = [];
    let departments = [];
    let currentEditId = null;

    function getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s/g, '');
    }

    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getDepartmentName(departmentId) {
        if (!departmentId) return '-';
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.name : '-';
    }

    // ---- 2. Fetch complaints + departments from backend ----
    async function loadData() {
        try {
            [allComplaints, departments] = await Promise.all([
                apiRequest('/complaints/', { method: 'GET' }),
                apiRequest('/departments/', { method: 'GET' })
            ]);
        } catch (err) {
            console.error('Failed to load data:', err);
            if (err.status === 401) {
                logout();
                return;
            }
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">Failed to load complaints.</td></tr>';
            return;
        }

        populateDepartmentDropdown();
        renderTable();
    }

    function populateDepartmentDropdown() {
        assignDept.innerHTML = '<option value="">-- Select Department --</option>';
        departments.forEach(function (dept) {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            assignDept.appendChild(option);
        });
    }

    // ---- 3. Render table based on current filters ----
    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryValue = filterCategory.value;
        const statusValue = filterStatus.value;

        const filtered = allComplaints.filter(function (c) {
            const matchesSearch =
                c.complaint_code.toLowerCase().includes(searchTerm) ||
                c.location.toLowerCase().includes(searchTerm);

            const matchesCategory = categoryValue === '' || c.category === categoryValue;
            const matchesStatus = statusValue === '' || c.status === statusValue;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">No complaints found.</td></tr>';
            return;
        }

        filtered.forEach(function (c) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.complaint_code}</td>
                <td>Student #${c.student_id}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td><span class="status-badge ${getStatusClass(c.status)}">${c.status}</span></td>
                <td>${getDepartmentName(c.assigned_department_id)}</td>
                <td>${formatDate(c.created_at)}</td>
                <td><button class="btn-secondary update-btn" data-id="${c.id}">Update</button></td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.update-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openModal(Number(btn.getAttribute('data-id')));
            });
        });
    }

    // ---- 4. Live filtering ----
    searchInput.addEventListener('input', renderTable);
    filterCategory.addEventListener('change', renderTable);
    filterStatus.addEventListener('change', renderTable);

    // ---- 5. Modal logic ----
    function openModal(complaintId) {
        const complaint = allComplaints.find(c => c.id === complaintId);
        if (!complaint) return;

        currentEditId = complaintId;
        assignDept.value = complaint.assigned_department_id || '';
        updateStatus.value = complaint.status;
        adminRemarks.value = '';

        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        currentEditId = null;
    }

    document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

    document.getElementById('saveModalBtn').addEventListener('click', async function () {
        if (!currentEditId) return;

        const saveBtn = document.getElementById('saveModalBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const body = {};
        if (assignDept.value) body.department_id = Number(assignDept.value);
        if (updateStatus.value) body.status = updateStatus.value;

        try {
            await apiRequest(`/complaints/${currentEditId}/assign`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            closeModal();
            await loadData();

        } catch (err) {
            console.error('Failed to update complaint:', err);
            const message = err.data?.detail || 'Failed to update complaint. Please try again.';
            alert(message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });

    // ---- 6. Logout ----
    document.getElementById('logoutBtn').addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

    // ---- Initial load ----
    loadData();

});