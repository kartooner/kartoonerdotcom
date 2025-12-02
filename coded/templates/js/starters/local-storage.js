// Save data
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  console.log(`Saved ${key}:`, value);
}

// Load data
function load(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

// Remove data
function remove(key) {
  localStorage.removeItem(key);
}

// Clear all
function clearAll() {
  localStorage.clear();
}

// Usage
const user = { name: 'John', email: 'john@example.com' };
save('user', user);

const savedUser = load('user');
console.log('Loaded:', savedUser);

// Listen for changes (in other tabs)
window.addEventListener('storage', (e) => {
  console.log(`Storage changed: ${e.key}`);
  console.log('New value:', e.newValue);
});