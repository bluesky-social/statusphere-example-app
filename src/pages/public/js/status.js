  document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('status-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
      console.log('status.js loaded');
    }
  });

async function handleSubmit(event) {
  event.preventDefault();   

  const form = event.target;
  const formData = new FormData(form);

  /* Log the FormData entries
  for (const [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }
  */

  //console.log('form:', form);
  //console.log('Status:', formData.get('status'));

  try {
    const response = await axios.post('/status', {
      status: formData.get('status'),      
    });
    console.log('Form submitted successfully:', response.data);

    // Create a new status element
    const newStatus = document.createElement('div');
    newStatus.className = 'card mt-2';
    newStatus.innerHTML = `
      <div class="card-body">
        ${formData.get('status')}
        <a class="author" href="#">You</a>
        is feeling ${formData.get('status')} today
      </div>
    `;

    // Prepend the new status to the status-feed div
    const statusFeed = document.getElementById('status-feed');
    if (statusFeed) {
      statusFeed.prepend(newStatus);
    }
  } catch (error) {
    console.error('Error submitting form:', error);
  }
}
