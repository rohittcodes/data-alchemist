const fs = require('fs');
const Papa = require('papaparse');

// Read the clients.csv file
const csvContent = fs.readFileSync('./sample-data/clients.csv', 'utf8');
console.log('CSV Content:');
console.log(csvContent);
console.log('\n=================\n');

// Parse it with PapaParse
Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    console.log('Parse Results:');
    console.log('Headers:', results.meta.fields);
    console.log('Data rows:', results.data.length);
    console.log('First row:', results.data[0]);
    console.log('Errors:', results.errors);
  }
});
