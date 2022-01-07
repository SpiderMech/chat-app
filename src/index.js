const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

// Create express app
const app = express()
// This is done behind the scenes by express
// This refactoring is required to use socket.io with express
const server = http.createServer(app)
// Socket io expects to be called with a raw http server
// Instead of an express application
const io = socketio(server)

// Set up port and public dir path
const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

// Serve up public directory
app.use(express.static(publicDirPath))

// socket.io event listener
// Listens to client connections
io.on('connection', (socket) => {
    // Welcoming message to clients
    console.log('New web socket connection')

    // Join listener
    socket.on('join', ({username, room}, cb) => {
        const {error, user} = addUser({ id: socket.id, username, room})
        if (error) { return cb(error) }

        socket.join(user.room)

        socket.emit('message', generateMessage('moderator', `Welcome to the ${user.room} room,  ${user.username}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('moderator', `${user.username} has joined the room`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        cb()
    })

    // listener for client message
    socket.on('sendMessage', (msg, cb) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        io.to(user.room).emit('message', generateMessage(user.username, filter.clean(msg)))
        cb()
    })

    // Listener for send location
    socket.on('sendLocation', ({lat, lon}, cb) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${lon}`))
        cb()
    })

    // listener for client disconnection
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('moderator', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
})

// Start server (using server rather than app)
server.listen(port, () => {
    
    console.log('Server is up on port ' + port)
})