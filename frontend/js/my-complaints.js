document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page ----
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const tableBody = document.getElementById('complaintsTableBody');

    // ---- 2. Fetch real complaints from the backend ----
    let complaints = [];
    try {
        complaints = await apiRequest('/complaints/my', {
            method: 'GET'
        });
    } catch (err) {
        console.error('Failed to load complaints:', err);
        if (err.status === 401) {
            logout();
            return;
        }
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">Failed to load complaints. Please try again.</td></tr>';
        return;
    }

    // ---- 3. If no complaints, leave the "empty" message ----
    if (complaints.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-message">No complaints submitted yet.</td></tr>';
        return;
    }

    // ---- 4. Build table rows dynamically ----

    function getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s/g, '');
    }

    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    tableBody.innerHTML = '';

    complaints.forEach(function (complaint) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${complaint.complaint_code}</td>
            <td>${complaint.category}</td>
            <td>${complaint.location}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${formatDate(complaint.created_at)}</td>
            <td><a href="complaint-details.html?id=${complaint.id}" class="btn-secondary">View</a></td>
        `;

        tableBody.appendChild(row);
    });

});