require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

process.on('uncaughtException', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`)
        console.error('Run: netstat -ano | findstr :' + PORT)
        console.error('Then: taskkill /PID <PID> /F')
        process.exit(1)
    } else {
        console.error('Unhandled error:', err)
        process.exit(1)
    }
})
