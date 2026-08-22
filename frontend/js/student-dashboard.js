document.addEventListener('DOMContentLoaded', async function () {

    // ---- 1. Protect this page: redirect if not logged in ----
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // ---- 2. Show the logged-in student's name ----
    const userName = localStorage.getItem('userName') || 'Student';
    document.getElementById('studentName').textContent = userName;

    // ---- 3. Fetch real complaints and calculate stats ----
    try {
        const complaints = await apiRequest('/complaints/my', {
            method: 'GET'
        });

        const stats = {
            total: complaints.length,
            pending: complaints.filter(c => c.status === 'Pending').length,
            inProgress: complaints.filter(c => c.status === 'In Progress').length,
            resolved: complaints.filter(c => c.status === 'Resolved').length
        };

        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('progressCount').textContent = stats.inProgress;
        document.getElementById('resolvedCount').textContent = stats.resolved;

    } catch (err) {
        console.error('Failed to load complaints:', err);
        if (err.status === 401) {
            logout();
        }
    }

    // ---- 4. Logout button ----
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

});