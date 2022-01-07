const users = []

// addUser
const addUser = ({ id, username, room}) => {
    // Clean data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate
    if (!username || !room) { return { error: 'Username and room are required' } }

    // Check existing user
    const existingUser = users.find((user) =>  user.room === room && user.username === username)
    if (existingUser) { return { error: "Username is already taken"} }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

// removeUser
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) return users.splice(index, 1)[0]
}

// getUser
const getUser = (id) => {
    return users.find((user) => user.id === id)
}

// getUsersInRoom
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return  users.filter((user) => user.room === room)
}

module.exports = {addUser, removeUser, getUser, getUsersInRoom}