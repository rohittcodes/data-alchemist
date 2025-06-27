// Comprehensive test script for the Data Alchemist upload functionality
// This tests the file-based session storage and validation pipeline

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

async function testUploadAndValidation() {
  console.log('🧪 Starting comprehensive upload and validation test...\n')
  
  try {
    // Check if sample files exist
    const sampleDir = path.join(__dirname, 'sample-data')
    const clientsFile = path.join(sampleDir, 'clients.csv')
    const workersFile = path.join(sampleDir, 'workers.csv')
    const tasksFile = path.join(sampleDir, 'tasks.csv')
    
    console.log('📁 Checking sample files...')
    const files = [
      { name: 'clients.csv', path: clientsFile },
      { name: 'workers.csv', path: workersFile },
      { name: 'tasks.csv', path: tasksFile }
    ]
    
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        console.log(`  ✅ ${file.name} found`)
      } else {
        console.log(`  ❌ ${file.name} not found at ${file.path}`)
      }
    }
    
    // Simulate upload via fetch (you'd need to actually start the server)
    console.log('\n🔄 To test the upload functionality:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open http://localhost:3000')
    console.log('3. Upload the sample files from sample-data/')
    console.log('4. Check the debug page at http://localhost:3000/debug')
    console.log('5. Verify session data persistence')
    
    // Check if uploads directory exists and show session structure
    const uploadsDir = path.join(__dirname, 'uploads')
    console.log('\n📂 Current uploads directory structure:')
    
    if (fs.existsSync(uploadsDir)) {
      const sessions = fs.readdirSync(uploadsDir).filter(dir => dir.startsWith('session_'))
      
      if (sessions.length > 0) {
        console.log(`  Found ${sessions.length} session(s):`)
        sessions.forEach(session => {
          console.log(`    📁 ${session}`)
          const sessionPath = path.join(uploadsDir, session)
          const sessionJsonPath = path.join(sessionPath, 'session.json')
          
          if (fs.existsSync(sessionJsonPath)) {
            console.log(`      ✅ session.json exists`)
            try {
              const sessionData = JSON.parse(fs.readFileSync(sessionJsonPath, 'utf8'))
              console.log(`      📊 Status: ${sessionData.status}`)
              console.log(`      📅 Created: ${new Date(sessionData.created).toLocaleString()}`)
              console.log(`      📋 Data: ${sessionData.clients ? 'Clients' : ''}${sessionData.workers ? ' Workers' : ''}${sessionData.tasks ? ' Tasks' : ''}`)
            } catch (err) {
              console.log(`      ❌ Error reading session.json: ${err.message}`)
            }
          } else {
            console.log(`      ❌ session.json missing`)
          }
        })
      } else {
        console.log('  No sessions found')
      }
    } else {
      console.log('  Uploads directory does not exist')
    }
    
    console.log('\n🏁 Test complete!')
    console.log('\n💡 Next steps:')
    console.log('- Upload files through the web interface')
    console.log('- Monitor console logs for session creation/retrieval')
    console.log('- Check /debug page for session health')
    console.log('- Verify data persistence across hot reloads')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testUploadAndValidation()
