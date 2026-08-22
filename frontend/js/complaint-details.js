document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page ----
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // ---- 2. Read the complaint ID from the URL ----
    // Example URL: complaint-details.html?id=1
    const urlParams = new URLSearchParams(window.location.search);
    const complaintId = urlParams.get('id');

    if (!complaintId) {
        document.querySelector('.details-card').innerHTML = '<p>No complaint ID provided.</p>';
        return;
    }

    // ---- 3. Fetch this complaint from the backend ----
    let complaint;
    try {
        complaint = await apiRequest(`/complaints/${complaintId}`, {
            method: 'GET'
        });
    } catch (err) {
        console.error('Failed to load complaint:', err);
        if (err.status === 401) {
            logout();
            return;
        }
        const message = err.status === 404 ? 'Complaint not found.' : 'Failed to load complaint details.';
        document.querySelector('.details-card').innerHTML = `<p>${message}</p>`;
        return;
    }

    // ---- Helper: convert status to CSS class ----
    function getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s/g, '');
    }

    // ---- Helper: format ISO date nicely ----
    function formatDate(isoString) {
        if (!isoString) return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // ---- 4. Fill in the detail fields ----
    document.getElementById('complaintId').textContent = 'Complaint ID: ' + complaint.complaint_code;

    const statusBadge = document.getElementById('complaintStatus');
    statusBadge.textContent = complaint.status;
    statusBadge.className = 'status-badge ' + getStatusClass(complaint.status);

    document.getElementById('complaintCategory').textContent = complaint.category;
    document.getElementById('complaintLocation').textContent = complaint.location;
    document.getElementById('complaintDate').textContent = formatDate(complaint.created_at);
    document.getElementById('complaintUpdated').textContent = formatDate(complaint.updated_at);
    document.getElementById('complaintDescription').textContent = complaint.description;

    // ---- 5. Show image if one was uploaded ----
    if (complaint.image_path) {
        const imageSection = document.getElementById('imageSection');
        const imageEl = document.getElementById('complaintImage');
        imageEl.src = complaint.image_path;
        imageSection.style.display = 'block';
    }

    // ---- 6. Build a simple status timeline ----
    const timeline = document.getElementById('statusTimeline');
    timeline.innerHTML = `<li>Submitted on ${formatDate(complaint.created_at)}</li>`;

    if (complaint.status !== 'Pending') {
        timeline.innerHTML += `<li>Current status: "${complaint.status}" (updated ${formatDate(complaint.updated_at)})</li>`;
    }

});