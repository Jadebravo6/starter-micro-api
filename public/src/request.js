const socket = io();
const searchInput = document.getElementById('search_input');
const searchOutput = document.getElementById('my-users-list');
const userTemplate = document.getElementById('user_template');
const connectedUser = localStorage.getItem('user_session');
const messagesContainer = document.getElementById('messages_container');

const formatMessageText = (messageToFormat) => {
    const emojis_all = `😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵🥴😠😡🤬😷🤒🤕🤢🤮🤧😇🥳🥺🤠🤡🤥🤫🤭🧐🤓😈👿👹👺💀☠👻👽👾🤖💩😺😸😹😻😼😽🙀😿😾🐱‍👤🐱‍🏍🐱‍💻🐱‍🐉🐱‍👓🐱‍🚀🙈🙉🙊🐵🐶🐺🐱🦁🐯🦒🦊🦝🐮🐷🐗🐭🐹🐰🐻🐨🐼🐸🦓🐴🦄🐔🐲🐽🐾🐒🦍🦧🦮🐕‍🦺🐩🐕🐈🐅🐆🐎🦌🦏🦛🐂🐃🐄🐖🐏🐑🐐🐪🐫🦙🦘🦥🦨🦡🐘🐁🐀🦔🐇🐿🦎🐊🐢🐍🐉🦕🦖🦦🦈🐬🐳🐋🐟🐠🐡🦐🦑🐙🦞🦀🐚🦆🐓🦃🦅🕊🦢🦜🦩🦚🦉🐦🐧🐥🐤🐣🦇🦋🐌🐛🦟🦗🐜🐝🐞🦂🕷🕸❤🧡💛💚💙💜🤎🖤🤍💔❣💕💞💓💗💖💘💝💟💌🦠🗣👤👥👁👀🦴🦷👅👄🧠🦾🦿👣`;
    let messageText = '';
    let cont = false;

    for(char of messageToFormat) {
        if(char == '\n') {
            messageText += '<br>';
            continue;
        }

        for(emo of emojis_all) {
            if(char == emo) {
                messageText += '<i class="emoji">' + char + '</i>';
                cont = true;
                break;
            }
        }
        
        if(cont) {
            cont = false;
            continue;
        } else 
            messageText += char;
    }

    return messageText;
}

function formatDate(date) {
    return ((date.getHours()<10)?`0${date.getHours()}`:date.getHours()) + ':' + ((date.getMinutes()<10)?`0${date.getMinutes()}`:date.getMinutes());
}

function formatDateWithText(date) {
    const maintenant = new Date();
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);

    if(date.toDateString() === maintenant.toDateString())
        return `Aujourd'hui`;
    else if(date.toDateString() === hier.toDateString())
        return `Hier`;

    const diffJours = Math.floor((maintenant - date) / (1000 * 60 * 60 * 24));

    if(diffJours <= 7)
        return `Il y a ${diffJours} jour${diffJours !== 1 ? 's' : ''}`;

    let t_date = date.toDateString().split(' '), tmp = t_date[1];
    t_date[1] = t_date[2];
    t_date[2] = tmp;

    return t_date.join(' ')
        .replace('Feb', 'Fév')
        .replace('Mar', 'Mars')
        .replace('Apr', 'Avr')
        .replace('May', 'Mai')
        .replace('Jun', 'Juin')
        .replace('Jul', 'Juillet')
        .replace('Aug', 'Août')

        .replace('Mon', 'Lun')
        .replace('Tue', 'Mar')
        .replace('Wed', 'Mer')
        .replace('Thu', 'Jeu')
        .replace('Fri', 'Ven')
        .replace('Sat', 'Sam')
        .replace('Sun', 'Dim')
    ;
}


searchInput.addEventListener('input', () => {
    socket.emit('search_users_req', searchInput.value, 'all', connectedUser);
})

// Afficher tous les utilisateurs
if(connectedUser)
    socket.emit('search_users_req', '', 'contacts', connectedUser);

socket.on('search_users_res', (public_data, myContactsJSON)=>{
    searchOutput.innerHTML = '';

    for(user of public_data) {
        const cloneUserTemplate = document.importNode(userTemplate.content, true);

        cloneUserTemplate.querySelector('.user').setAttribute('id', user.uid);
        cloneUserTemplate.querySelector('.text .name').textContent = user.public.name;
        cloneUserTemplate.querySelector('.photo').style = `
        background: url(data/profile_photo/${user.public.photo});
        background-size: cover;
        background-repeat: no-repeat;
        background-position: 0%;
        `;

        if(user.public.online)
            cloneUserTemplate.querySelector('.photo .status').classList.add('online');
        else
            cloneUserTemplate.querySelector('.photo .status').classList.remove('online');

        let notifs = 0;
        let lastMessage = {
            sid: null,
            data: {
                text: "Aucun message...",
                image: null
            },
        };
        if(myContactsJSON.length > 0) {
            for(contact of myContactsJSON) {
                if(contact.uid == user.uid) {
                    notifs = contact.notifications;
                    lastMessage = contact.lastMessage;
                    break;
                }
            }
            if(notifs > 0) {
                cloneUserTemplate.querySelector('.notif').style.display = 'flex';
                cloneUserTemplate.querySelector('.notif').textContent = `${notifs}`;
            }
            else
                cloneUserTemplate.querySelector('.notif').style.display = 'none';
        }
        else
            cloneUserTemplate.querySelector('.notif').style.display = 'none';

        if(lastMessage.sid == connectedUser)    lastMessage.final_value = "vous: ";
        else                                    lastMessage.final_value = "";
        if(lastMessage.data.text)               lastMessage.final_value += lastMessage.data.text.substring(0, ((lastMessage.data.text.length > 34) ? 34 : undefined)) + ((lastMessage.data.text.length > 34) ? " ..." : "");
        if(lastMessage.data.image)              lastMessage.final_value += ` <i class="image icon"></i>`;

        cloneUserTemplate.querySelector('.text .last-message').innerHTML = lastMessage.final_value;

        searchOutput.appendChild(cloneUserTemplate);
    }

    const contacts = document.querySelectorAll('#my-users-list .user');
    const leftSide = document.querySelector('#chat-app #main-bloc .left');
    const room = document.querySelector('#chat-app #main-bloc .right');
    
    // ===================  Hide Chat Room [on Mobile]  ===================
    if(window.innerWidth <= 844) {
        document.querySelector('#chat-app #main-bloc .right .top .return-button').addEventListener('click', () => {
            room.style.display = 'none';
            leftSide.style.display = 'block';
        });
    }

    contacts.forEach((user)=>{
        user.addEventListener('click', () => {
            // console.log('clic sur ', user.getAttribute('id'));

            socket.emit('update: notification', user.getAttribute('id'), connectedUser);

            if(document.getElementById('emojis_container').classList.contains('active'))
                document.getElementById('emojis_container').classList.remove('active');

            document.querySelector('.message-input').value = '';
            
            // searchInput.value = '';
            // if(connectedUser)
            //     socket.emit('search_users_req', '', 'contacts', connectedUser);

            user.classList.add('active');
            contacts.forEach((u)=>{
                if(u !== user)
                    u.classList.remove('active');
            })
            socket.emit('discussion: search_user_req', user.getAttribute('id'), connectedUser);
            document.querySelector('#main-bloc .right').style.display = 'flex';

            // ===================  Show Chat Room [on Mobile]  ===================
            if(window.innerWidth <= 844) {
                room.style.display = 'flex';
                leftSide.style.display = 'none';
            }
        })
    })
    // console.log(users)
})


socket.on('discussion: user_founded', (user_founded) => {
    // console.log('current chat room (clicked) => '+user_founded.discussion.did);

    // show to right side top
    (function(){
        const user_foundedInfo = document.querySelector('.other-user-infos');
        const username = document.querySelector('.other-user-infos .user-name');
        const userPhoto = document.querySelector('.other-user-infos .user-photo');

        user_foundedInfo.setAttribute('id', user_founded.uid);
        username.textContent = user_founded.public.name;
        userPhoto.style = `
        background: url(data/profile_photo/${user_founded.public.photo});
        background-size: cover;
        background-repeat: no-repeat;
        background-position: 0%;
        `;

        if(user_founded.public.online)
            userPhoto.querySelector('.status').classList.add('online');
        else
            userPhoto.querySelector('.status').classList.remove('online');

        // show his info to left side
        user_foundedInfo.addEventListener('click', ()=>{
            // profile page current infos
            const pr_myPhoto = document.getElementById('ot_photo_content');
            const pr_myName = document.getElementById('ot_profile-pseudo');
            const pr_myAbout = document.getElementById('ot_profile-description');
    
            if(!user_founded.public.photo)
                user_founded.public.photo = 'default/default.png'
    
            pr_myPhoto.style = `
            background: url(data/profile_photo/${user_founded.public.photo});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: 0%;
            `;
            
            pr_myName.placeholder = user_founded.public.name;
            pr_myAbout.placeholder = user_founded.public.about;
        })
    })()
    

    // check discussion and contacts list
    let messageHTML = '';
    messagesContainer.innerHTML = '<p class="empty-chat prevent-select">Cette discussion est vide</p>';
    messagesContainer.setAttribute('id', user_founded.discussion.did);

    let i = 0;
    let preMsgTime = '';
    if(user_founded.discussion.messages.length > 0)
        preMsgTime = formatDateWithText(new Date(user_founded.discussion.messages[0].datetime));

    for(message of user_founded.discussion.messages) {
        if(messagesContainer.innerHTML == '<p class="empty-chat prevent-select">Cette discussion est vide</p>')
            messagesContainer.innerHTML = '';

        if(i == 0) {
            messagesContainer.innerHTML += `<p class="group-msg-date prevent-select">${formatDateWithText(new Date(message.datetime))}</p>`
            i = 1;
        }
        else if(preMsgTime !== formatDateWithText(new Date(message.datetime)) || user_founded.discussion.messages.length <= 0) {
            messageHTML = `<p class="group-msg-date prevent-select">${formatDateWithText(new Date(message.datetime))}</p>` + messagesContainer.innerHTML;
            messagesContainer.innerHTML = messageHTML;
        }

        preMsgTime = formatDateWithText(new Date(message.datetime));

        if(message.sid == connectedUser) {
            messageHTML = `
            <div class="message message-div" id="${message.mid}">
                <div class="content">
                    <span class="sender prevent-select"><span class="text">Vous</span><i class="icon delete" id="${message.mid}"></i></span>
                    <div class="msg" readonly>${formatMessageText(message.content.text)}</div>
                    ${((message.content.image) ? '<img src="/data/uploads/'+message.content.image+'" alt="">' : "")}
                </div>
                <span class="datetime prevent-select">${formatDate(new Date(message.datetime))}</span>
            </div>
            `
            +
            messagesContainer.innerHTML;
            messagesContainer.innerHTML = messageHTML;
        } else {
            messageHTML = `
            <div class="message-invite message-div" id="${message.mid}">
                <div class="mi-left">
                    <div class="sender-photo"></div>
                    <span class="datetime prevent-select">${formatDate(new Date(message.datetime))}</span>
                </div>
                
                <div class="content">
                    <span class="sender prevent-select"><span class="text">${user_founded.public.name}</span><i class="icon delete" id="${message.mid}"></i></span>
                    <div class="msg" readonly>${formatMessageText(message.content.text)}</div>
                    ${((message.content.image) ? '<img src="/data/uploads/'+message.content.image+'" alt="">' : "")}
                </div>
            </div>
            `
            +
            messagesContainer.innerHTML;
            messagesContainer.innerHTML = messageHTML;
            document.getElementById(message.mid).querySelector('.sender-photo').style = `
            background: url(data/profile_photo/${user_founded.public.photo});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: 0%;
            `
        }
    }

    // envoi d'un message
    const toggle_emojis = document.getElementById('toggle_emojis');
    const emojis_container = document.getElementById('emojis_container');
    const sendButton = document.querySelector('.send-message-button');
    const messageInput = document.querySelector('.message-input');

    toggle_emojis.onclick = ()=>{
        emojis_container.classList.toggle('active');
    }

    emojis_container.querySelectorAll('.item').forEach((item)=>{
        item.onclick = ()=>{
            messageInput.value += item.textContent;
        }
    })

    sendButton.onclick = (e)=>{
        if(document.getElementById('add_image').files[0] == null) e.preventDefault();

        if(emojis_container.classList.contains('active'))
            emojis_container.classList.remove('active');
    
        let data = {
            text: messageInput.value,
            image: null
        }
        
        if(document.getElementById('add_image').files[0] != null) {
            let ext = document.getElementById('add_image').files[0].name.split('.');
            data.image = connectedUser.split('-')[0] + '_' + Date.now().toString() + '.' + ext[ext.length-1];
        }

        if(data.text || data.image !== null) {
            socket.emit('discussion: send message', data, user_founded.discussion, connectedUser);
            socket.emit('update: up to date', user_founded.discussion.participants.filter((user) => user !== connectedUser));
            messageInput.value = '';
            socket.removeAllListeners('discussion: send message');
            socket.removeAllListeners('update: up to date');
        }
    }

    // supprimer un message
    const delButton = document.querySelectorAll('.icon.delete');
    const allMessages = document.querySelectorAll('.message-div');
    let messageToDel = '';

    delButton.forEach((but) => {
        but.addEventListener('click', ()=>{
            for(msg of allMessages) {
                if(msg.getAttribute('id') == but.getAttribute('id')) {
                    messageToDel = msg;
                    break;
                }
            }
            socket.emit('discussion: delete message', user_founded.discussion.did, messageToDel.getAttribute('id'));
        })
    })
})

// reception d'un message
socket.on('discussion: receive message', (message, showDateTitle, otherUser, did)=>{
    // console.log('current=>'+messagesContainer.getAttribute('id'))
    // console.log('target=>'+did)
    if(messagesContainer.innerHTML == '<p class="empty-chat prevent-select">Cette discussion est vide</p>')
        messagesContainer.innerHTML = '';

    if(showDateTitle) {
        messageHTML = `<p class="group-msg-date prevent-select">${formatDateWithText(new Date(message.datetime))}</p>` + messagesContainer.innerHTML;
        messagesContainer.innerHTML = messageHTML;
    }

    if(messagesContainer.getAttribute('id') == did) {
        if(message.sid == connectedUser) {
            messageHTML = `
            <div class="message message-div" id="${message.mid}">
                <div class="content">
                    <span class="sender prevent-select"><span class="text">Vous</span><i class="icon delete" id="${message.mid}"></i></span>
                    <div class="msg" readonly>${formatMessageText(message.content.text)}</div>
                    ${((message.content.image) ? '<img src="/data/uploads/'+message.content.image+'" alt="">' : "")}
                </div>
                <span class="datetime prevent-select">${formatDate(new Date(message.datetime))}</span>
            </div>
            `
            +
            messagesContainer.innerHTML;
            messagesContainer.innerHTML = messageHTML;
        } else {
            messageHTML = `
            <div class="message-invite message-div" id="${message.mid}">
                <div class="mi-left">
                    <div class="sender-photo"></div>
                    <span class="datetime prevent-select">${formatDate(new Date(message.datetime))}</span>
                </div>
                
                <div class="content">
                    <span class="sender prevent-select"><span class="text">${otherUser.name}</span><i class="icon delete" id="${message.mid}"></i></span>
                    <div class="msg" readonly>${formatMessageText(message.content.text)}</div>
                    ${((message.content.image) ? '<img src="/data/uploads/'+message.content.image+'" alt="">' : "")}
                </div>
            </div>
            `
            +
            messagesContainer.innerHTML;
            messagesContainer.innerHTML = messageHTML;
            document.getElementById(message.mid).querySelector('.sender-photo').style = `
            background: url(data/profile_photo/${otherUser.photo});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: 0%;
            `
        }
    }

    // supprimer un message
    const delButton = document.querySelectorAll('.icon.delete');
    const allMessages = document.querySelectorAll('.message-div');
    let messageToDel = '';

    delButton.forEach((but) => {
        but.addEventListener('click', ()=>{
            for(msg of allMessages) {
                if(msg.getAttribute('id') == but.getAttribute('id')) {
                    messageToDel = msg;
                    break;
                }
            }
            socket.emit('discussion: delete message', did, messageToDel.getAttribute('id'));
        })
    })
})

socket.on('discussion: message deleted', (did, mid)=>{
    if(messagesContainer.getAttribute('id') == did) {
        let messageToDel = document.querySelectorAll('.message-div');
        for(msg of messageToDel) {
            if(msg.getAttribute('id') == mid) {
                messageToDel = msg;
                break;
            }
        }
    
        messageToDel.querySelector('.content').innerHTML = `Ce message a été supprimé.`;
    }
})


// update
socket.on('update: user data change', (user_newData, usersContactsData)=>{
    const users = document.querySelectorAll('#my-users-list .user');
    let myContactsJSON = [];

    for(user of usersContactsData)
        if(user.uid == connectedUser) {
            myContactsJSON = user.contacts;
        }

    
    for(userDOM of users) {
        if(userDOM.getAttribute('id') == user_newData.uid) {
            // console.log(myContactsJSON)

            userDOM.querySelector('.text .name').textContent = user_newData.public.name;
            userDOM.querySelector('.photo').style = `
            background: url(data/profile_photo/${user_newData.public.photo});
            background-size: cover;
            background-repeat: no-repeat;
            background-position: 0%;
            `;
    
            if(user_newData.public.online)
                userDOM.querySelector('.photo .status').classList.add('online');
            else
                userDOM.querySelector('.photo .status').classList.remove('online');

            let notifs = 0;
            let lastMessage = "null";
            if(myContactsJSON.length > 0) {
                for(contact of myContactsJSON) {
                    if(contact.uid == user_newData.uid) {
                        if(messagesContainer.getAttribute('id') !== contact.did)
                            notifs = contact.notifications; 
                        lastMessage = contact.lastMessage;
                        break;
                    }
                }
                if(notifs > 0) {
                    userDOM.querySelector('.notif').style.display = 'flex';
                    userDOM.querySelector('.notif').textContent = `${notifs}`;
                }
                else
                    userDOM.querySelector('.notif').style.display = 'none';
            }
            else
                userDOM.querySelector('.notif').style.display = 'none';

            if(lastMessage.sid == connectedUser)    lastMessage.final_value = "vous: ";
            else                                    lastMessage.final_value = "";
            if(lastMessage.data.text)               lastMessage.final_value += lastMessage.data.text.substring(0, ((lastMessage.data.text.length > 34) ? 34 : undefined)) + ((lastMessage.data.text.length > 34) ? " ..." : "");
            if(lastMessage.data.image)              lastMessage.final_value += ` <i class="image icon"></i>`;

            userDOM.querySelector('.text .last-message').innerHTML = lastMessage.final_value;

            // console.log('user data change: ', user_newData.uid);

            // in chat room
            if(userDOM.classList.contains('active')) {
                // const user_foundedInfo = document.querySelector('.other-user-infos');
                const username = document.querySelector('.other-user-infos .user-name');
                const userPhoto = document.querySelector('.other-user-infos .user-photo');
    
                username.textContent = user_newData.public.name;
                userPhoto.style = `
                background: url(data/profile_photo/${user_newData.public.photo});
                background-size: cover;
                background-repeat: no-repeat;
                background-position: 0%;
                `;
    
                if(user_newData.public.online)
                    userPhoto.querySelector('.status').classList.add('online');
                else
                    userPhoto.querySelector('.status').classList.remove('online');
            }

            break;
        }
    }
})


// Emojis
function emojis(){
    const emojis_emoticones = `😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵🥴😠😡🤬😷🤒🤕🤢🤮🤧😇🥳🥺🤠🤡🤥🤫🤭🧐🤓😈👿`;
    const emojis_animaux = "👹👺💀☠👻👽👾🤖💩😺😸😹😻😼😽🙀😿😾🐱‍👤🐱‍🏍🐱‍💻🐱‍🐉🐱‍👓🐱‍🚀🙈🙉🙊🐵🐶🐺🐱🦁🐯🦒🦊🦝🐮🐷🐗🐭🐹🐰🐻🐨🐼🐸🦓🐴🦄🐔🐲🐽🐾🐒🦍🦧🦮🐕‍🦺🐩🐕🐈🐅🐆🐎🦌🦏🦛🐂🐃🐄🐖🐏🐑🐐🐪🐫🦙🦘🦥🦨🦡🐘🐁🐀🦔🐇🐿🦎🐊🐢🐍🐉🦕🦖🦦🦈🐬🐳🐋🐟🐠🐡🦐🦑🐙🦞🦀🐚🦆🐓🦃🦅🕊🦢🦜🦩🦚🦉🐦🐧🐥🐤🐣🦇🦋🐌🐛🦟🦗🐜🐝🐞🦂🕷🕸";
    const emojis_emo_divers = "🤺⛷🤼‍♂️🤼‍♀️👯‍♂️👯‍♀️💑👩‍❤️‍👩👨‍❤️‍👨💏👩‍❤️‍💋‍👩👨‍❤️‍💋‍👨👪👨‍👩‍👦👨‍👩‍👧👨‍👩‍👧‍👦👨‍👩‍👦‍👦👨‍👩‍👧‍👧👨‍👨‍👦👨‍👨‍👧👨‍👨‍👧‍👦👨‍👨‍👦‍👦👨‍👨‍👧‍👧👩‍👩‍👦👩‍👩‍👧👩‍👩‍👧‍👦👩‍👩‍👦‍👦👩‍👩‍👧‍👧👩‍👦👩‍👧👩‍👧‍👦👩‍👦‍👦👩‍👧‍👧👨‍👦👨‍👧👨‍👧‍👦👨‍👦‍👦👨‍👧‍👧👭👩🏻‍🤝‍👩🏻👩🏼‍🤝‍👩🏻👩🏼‍🤝‍👩🏼👩🏽‍🤝‍👩🏻👩🏽‍🤝‍👩🏼👩🏽‍🤝‍👩🏽👩🏾‍🤝‍👩🏻👩🏾‍🤝‍👩🏼👩🏾‍🤝‍👩🏽👩🏾‍🤝‍👩🏾👩🏿‍🤝‍👩🏻👩🏿‍🤝‍👩🏼👩🏿‍🤝‍👩🏽👩🏿‍🤝‍👩🏾👩🏿‍🤝‍👩🏿👫👩🏻‍🤝‍🧑🏻👩🏻‍🤝‍🧑🏼👩🏻‍🤝‍🧑🏽👩🏻‍🤝‍🧑🏾👩🏻‍🤝‍🧑🏿👩🏼‍🤝‍🧑🏻👩🏼‍🤝‍🧑🏼👩🏼‍🤝‍🧑🏽👩🏼‍🤝‍🧑🏾👩🏼‍🤝‍🧑🏿👩🏽‍🤝‍🧑🏻👩🏽‍🤝‍🧑🏼👩🏽‍🤝‍🧑🏽👩🏽‍🤝‍🧑🏾👩🏽‍🤝‍🧑🏿👩🏾‍🤝‍🧑🏻👩🏾‍🤝‍🧑🏼👩🏾‍🤝‍🧑🏽👩🏾‍🤝‍🧑🏾👩🏾‍🤝‍🧑🏿👩🏿‍🤝‍🧑🏻👩🏿‍🤝‍🧑🏼👩🏿‍🤝‍🧑🏽👩🏿‍🤝‍🧑🏾👩🏿‍🤝‍🧑🏿👬👨🏻‍🤝‍👨🏻👨🏼‍🤝‍👨🏻👨🏼‍🤝‍👨🏼👨🏽‍🤝‍👨🏻👨🏽‍🤝‍👨🏼👨🏽‍🤝‍👨🏽👨🏾‍🤝‍👨🏻👨🏾‍🤝‍👨🏼👨🏾‍🤝‍👨🏽👨🏾‍🤝‍👨🏾👨🏿‍🤝‍👨🏻👨🏿‍🤝‍👨🏼👨🏿‍🤝‍👨🏽👨🏿‍🤝‍👨🏾👨🏿‍🤝‍👨🏿";
    const emojis_coeurs = "❤🧡💛💚💙💜🤎🖤🤍💔❣💕💞💓💗💖💘💝💟💌🦠🗣👤👥👁👀🦴🦷👅👄🧠🦾🦿👣";

    for(emo of emojis_emoticones){
        emojis_container.innerHTML += `<span class="item">${emo}</span>`
    }
    for(emo of emojis_animaux){
        emojis_container.innerHTML += `<span class="item">${emo}</span>`
    }
    for(emo of emojis_coeurs){
        emojis_container.innerHTML += `<span class="item">${emo}</span>`
    }
}

emojis();

messagesContainer.onclick = () => {
    if(emojis_container.classList.contains('active'))
        emojis_container.classList.remove('active');
}