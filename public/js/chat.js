const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormBtn = $messageForm.querySelector('button');
const $sendLocationBtn = document.querySelector('#sendLocationBtn');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username , room} = Qs.parse(location.search , {ignoreQueryPrefix : true});

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild;

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newNessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newNessageMargin;

    //Visible height
    const visibleHeight = $messages.offsetHeight;
    
    //Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message' , (msg)=> {
    console.log(msg)
    const html = Mustache.render(messageTemplate , {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend' , html);
    autoScroll();
});

socket.on('locationMessage' , (message)=> {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate , {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend' , html);
    autoScroll();
})

socket.on('roomData' , ({room , users})=> {
    const html = Mustache.render(sidebarTemplate , {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit' , (e)=>{
    e.preventDefault();

    $messageFormBtn.setAttribute('disabled' , 'disabled');

    const textToSend = e.target.msgInput.value;

    socket.emit('sendMessage' , textToSend , (error)=> { 
        $messageFormBtn.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error){
            return console.log(error);
        }
        console.log("The message was delivered ");
    });
});

$sendLocationBtn.addEventListener('click' , ()=>{
    if(!navigator.geolocation){
        return alert('Geo location is not supported by your browser');
    }

    $sendLocationBtn.setAttribute('disabled' , 'disabled');

    navigator.geolocation.getCurrentPosition( (position) => {

        socket.emit('sendLocation' , {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        } , ()=> {
            $sendLocationBtn.removeAttribute('disabled');
            console.log("Location shared");
        });
    });
});

socket.emit('join' , {username , room} , (error)=> { 

    if(error){
        alert(error);
        location.href = '/';
    }
});