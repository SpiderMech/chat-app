const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Get height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = ($messages.scrollTop + visibleHeight) * 2

    if (containerHeight - newMessageHeight < scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

// message event listener
socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// location message event listener
socket.on('locationMessage', (msg) => {
    console.log(msg)
    const html = Mustache.render(locationMessageTemplate, {
        username: msg.username, 
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

// form submission event listener
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    // Disabled the form button
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value

    socket.emit('sendMessage', msg, (error) => {
        // Re-enable form button
        $messageFormButton.removeAttribute('disabled')
        // Clear message box
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {return console.log(error)}
    })
})

// send location event listener
$sendLocationButton.addEventListener('click', () => {
    // Disable send location button
    $sendLocationButton.setAttribute('disabled', 'disabled')

    // If this doesn't exist in client side browser then we show an alert
    if (!navigator.geolocation) return alert('Geolocation unavailable')

    // Although this operation is asynchronous it doesn't currently support Promises.
    // We instead provide a call back function rather than using async await.
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude, 
            lon: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Your location has been shared')
        })
    })
})

// User joins a room
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})