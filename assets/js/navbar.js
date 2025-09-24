fetch('navbar.html')
  .then(response => response.text())
  .then(data => {
    const container = document.getElementById('navbar-container');
    container.innerHTML = data;
    container.classList.add('fade-in'); // Add fade-in animation
  })
  .catch(err => console.error('Failed to load navbar:', err));