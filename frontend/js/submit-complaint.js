document.addEventListener('DOMContentLoaded', function () {

    // ---- 1. Protect this page ----
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const complaintForm = document.getElementById('complaintForm');
    const formMessage = document.getElementById('formMessage');

    complaintForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Read form values
        const block = document.getElementById('block').value;
        const category = document.getElementById('category').value;
        const location = document.getElementById('location').value.trim();
        const description = document.getElementById('description').value.trim();

        // ---- Basic validation ----
        if (block === '' || category === '' || location === '' || description === '') {
            formMessage.textContent = 'Please fill in all required fields.';
            formMessage.style.color = '#e74c3c';
            return;
        }

        const submitBtn = complaintForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        formMessage.textContent = '';

        try {
            await apiRequest('/complaints/', {
                method: 'POST',
                body: JSON.stringify({
                    block: block,
                    category: category,
                    location: location,
                    description: description
                })
            });

            formMessage.textContent = 'Complaint submitted successfully! Redirecting...';
            formMessage.style.color = '#27ae60';

            setTimeout(function () {
                window.location.href = 'my-complaints.html';
            }, 1500);

        } catch (err) {
            console.error('Failed to submit complaint:', err);
            if (err.status === 401) {
                logout();
                return;
            }
            const message = err.data?.detail || 'Failed to submit complaint. Please try again.';
            formMessage.textContent = message;
            formMessage.style.color = '#e74c3c';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Complaint';
        }
    });

});