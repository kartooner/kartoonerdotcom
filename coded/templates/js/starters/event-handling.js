// Click event
document.querySelector('.btn').addEventListener('click', (e) => {
  console.log('Button clicked!');
  e.target.textContent = 'Clicked!';
});

// Form submission
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  console.log('Form data:', data);
});

// Input changes
document.querySelector('input').addEventListener('input', (e) => {
  console.log('Current value:', e.target.value);
});

// Keyboard events
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    console.log('Enter pressed!');
  }
});