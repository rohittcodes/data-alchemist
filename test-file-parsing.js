// Simple test to debug the upload API issue
const fs = require('fs');
const path = require('path');

// Mock File class for Node.js testing
class MockFile {
  constructor(buffer, name, type = 'text/csv') {
    this.buffer = buffer;
    this.name = name;
    this.type = type;
    this.size = buffer.length;
  }
  
  // Mock the File interface methods
  stream() {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(this.buffer);
        controller.close();
      }
    });
  }
  
  arrayBuffer() {
    return Promise.resolve(this.buffer.buffer);
  }
  
  text() {
    return Promise.resolve(this.buffer.toString());
  }
}

async function testFileParsing() {
  try {
    console.log('Testing file parsing...');
    
    // Read the sample CSV file
    const csvPath = path.join(__dirname, 'sample-data', 'clients.csv');
    const csvBuffer = fs.readFileSync(csvPath);
    
    console.log('CSV content length:', csvBuffer.length);
    console.log('CSV content preview:', csvBuffer.toString().substring(0, 200));
    
    // Create a mock File object
    const mockFile = new MockFile(csvBuffer, 'clients.csv', 'text/csv');
    
    console.log('Mock file created:', {
      name: mockFile.name,
      size: mockFile.size,
      type: mockFile.type
    });
    
    // Try to parse it using Papa Parse
    const Papa = require('papaparse');
    
    Papa.parse(csvBuffer.toString(), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Papa parse results:');
        console.log('Headers:', results.meta.fields);
        console.log('Data rows:', results.data.length);
        console.log('First row:', results.data[0]);
        console.log('Errors:', results.errors);
      },
      error: (error) => {
        console.error('Papa parse error:', error);
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testFileParsing();
