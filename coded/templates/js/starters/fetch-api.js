// GET request
async function getData() {
  try {
    const response = await fetch('https://api.example.com/data');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// POST request
async function postData(payload) {
  try {
    const response = await fetch('https://api.example.com/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
getData();
postData({ name: 'John', age: 30 });