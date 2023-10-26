main();

function main () {
    const express = require("express");
    const path = require("path");
    const fs = require('fs');
    const {v4: uuidv4} = require('uuid');
    const multer = require('multer');
    
    const app = express();
    const server = require("http").createServer(app);
    const io = require("socket.io")(server);


    app.use('/', express.static(path.join(__dirname + '/public')));
    
    // Global variables
    const port = 3000;
    let photo = null;
    let sended_image = null;

    // functions
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
    
        return date.toDateString();
    }

    const updateUserDataToUsersList = (uid)=>{
        const users = require('./data/users.json');
        let user = {
            uid: uid,
            public: {}
        };
        let usersContactsData = [];

        for(u of users)
            if(u.uid == uid) {
                user = {
                    uid: u.uid,
                    public: u.public
                };
                break;
            }
        users.forEach((u)=>{
            usersContactsData.push({
                uid: u.uid,
                contacts: u.public.contacts
            });
        })

        io.emit('update: user data change', user, usersContactsData);
    }
    
    
    io.on("connection", (socket) => {
        //  Requete du client pour la connexion
        socket.on('login: client request', (formData) => {
            fs.readFile(__dirname + '/data/users.json', 'utf-8', (err, data) => {
                if(err) { console.error(err); }

                let usersData = []
                let response = {};

                if(data) {
                    usersData = JSON.parse(data)
                }
                else {
                    response = {
                        msg: 'zero_match',
                        uid: undefined
                    };
                    console.log(response);
                }

                for(user of usersData) {
                    if(user.private.mail == formData.mail && user.private.password == formData.password) {
                        response = {
                            msg: 'success',
                            uid: user.uid
                        };

                        break
                    }
                    else if(user.private.mail == formData.mail && user.private.password != formData.password) {
                        response = {
                            msg: 'password_not_match',
                            uid: null
                        };

                        break
                    }
                    else
                        response = {
                            msg: 'zero_match',
                            uid: undefined
                        };
                }

                // repond au client
                socket.emit('login: server response', response);
            })
        })

        // Quand le user est se connecter correctement
        socket.on('login: client success', (uid)=>{
            console.log('{+} new login ['+ Date().split(' ')[4] +'] =>', uid);

            fs.readFile(__dirname + '/data/users.json', 'utf-8', (err, data) => {
                if(err) { console.error(err); }

                let usersData = []
                let response = {
                    msg: '',
                    data: []
                }

                if(data) {
                    usersData = JSON.parse(data)
                }
                else {
                    response = { msg: 'user: zero_match', data: [] };
                    console.log(response);
                }

                for(user of usersData) {
                    if(user.uid == uid) {
                        response = {
                            msg: 'user: data found',
                            data: user.public
                        }

                        user.public.online = true;
                        break;
                    }
                }

                // mise a jour du json
                fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(usersData, null, 2));

                // repond au client
                socket.emit('login: server success', response);

                updateUserDataToUsersList(uid);
            })
        })

        // Lors de l'inscription
        socket.on('signin: client request', (newUser) => {
            let newUserData = {
                uid: uuidv4(),
                public: {
                    name: "username",
                    about: "Salut, j'utilise Ocean Chat !",
                    photo: "../../assets/images/avatar.jpg",
                    contacts: [],
                    online: false
                },
                private: {
                    mail: newUser.mail,
                    password: newUser.password_1
                }
            };

            const data = fs.readFileSync(__dirname + '/data/users.json', 'utf-8');
            let usersData = []
            let res = {
                msg: "",
                uid: null
            };

            if(data) {
                usersData = JSON.parse(data);
            }

            if(usersData.find((user) => user.private.mail === newUser.mail)) {
                res = {
                    msg: "mail_taken",
                    uid: null
                }
            } else {
                usersData.push(newUserData);
                fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(usersData, null, 2));

                res = {
                    msg: "success",
                    uid: newUserData.uid
                }
            }

            socket.emit('signin: server response', res);
            console.log('{+} signin_response ['+ Date().split(' ')[4] +'] => ' + JSON.stringify(res))
        })

        // Lors de l'edition du profile
        socket.on('profile: client send new data', (newData, user_session) => {
            const data = fs.readFileSync(__dirname + '/data/users.json', 'utf-8');
            let usersData = []
            let user;
            let res = {
                msg: "",
                uid: null
            };              

            if(data) {
                usersData = JSON.parse(data);
                user = usersData.find((user) => user.uid === user_session);
    
                if(user) {
                    if(newData.name) user.public.name = newData.name;
                    if(!user.public.name) user.public.name = "Username" 
                    if(newData.about) user.public.about = newData.about;
                    if(! user.public.about) user.public.about = "Salut, j'utilise Ocean Chat !";

                    if(newData.extPhoto) {
                        photo = 'photo_' + user_session + '.' + newData.extPhoto;
                    }  
                    else if(!user.public.photo)
                        photo = "../../assets/images/avatar.jpg";
                    else
                        photo = user.public.photo;

                    user.public.photo = photo;

                    fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(usersData, null, 2));
                    
                    res = {
                        msg: "success",
                        uid: user.uid
                    }
                } else {
                    res = {
                        msg: "user_not_found",
                        uid: null
                    }
                }
            } else {
                res = {
                    msg: "user_not_found",
                    uid: null
                }
            }

            console.log('{*} edit_response [' + Date().split(' ')[4] + '] => ' + JSON.stringify(res));
        })

        // Recherche des utilisateurs
        socket.on('search_users_req', (searchValue, portee, connectedUser) => {
            const usersData = require("./data/users.json");
            const publicUsersData = [];
            let displayedData = [];
            let all = [];
            let myContacts = [];
            let myContactsJSON = [];

            // recupere uniquement les informations publiques des utilisateurs depuis le users.json
            for(user of usersData) {
                publicUsersData.push({uid: user.uid, public: user.public});

                if(user.uid == connectedUser)
                    myContactsJSON = user.public.contacts;
            }

            // resultat de la recherche par occurences
            all = publicUsersData.filter((user) =>
                user.public.name.toLowerCase().includes(searchValue.toLowerCase()) && user.uid !== connectedUser
            );

            // affiche uniquement les contacts de l'utilisateur connecté
            if(portee === 'contacts' || searchValue == '') {
                // recupere la liste de contact de l'utilisateur connecté
                myContacts = publicUsersData.filter((user) =>
                    user.uid == connectedUser
                )[0].public.contacts;
            
                for(user of all) {
                    for(c of myContacts) {
                        if(user.uid == c.uid)
                            displayedData.push(user)
                    }
                }
            }
            else {
                // affiche uniquement les resultats de la recherche
                displayedData = all;
            }

            // retourne les donnees des utilisateurs a afficher
            socket.emit('search_users_res', displayedData, myContactsJSON);
            // console.log('{!} Public Users data sended:', JSON.stringify(myContactsJSON));
        })

        // Recupere un seul utilisateur
        socket.on('discussion: search_user_req', (uid, connectedUser) => {
            const usersData = require("./data/users.json");
            let userPublicData = null;
            let myPublicData = null;
            let found = false;

            for(user of usersData) {
                if(user.uid === uid) {
                    userPublicData = {uid: user.uid, public: user.public, discussion: null};
                }

                if(user.uid == connectedUser) {
                    myPublicData = {uid: user.uid, public: user.public};
                }

                if(userPublicData !== null && myPublicData !== null) {
                    break;
                }
            }

            const createContact = ()=>{
                let _did = uuidv4();
                let discussionCreated = false;
                let pushed = 0;

                for(user of usersData) {
                    if(user.uid == connectedUser || user.uid == uid) {
                        user.public.contacts.push(
                            {
                                uid: (user.uid == connectedUser) ? uid : connectedUser,
                                did: _did,
                                notifications: null,
                                lastMessage: {
                                    sid: null,
                                    data: {
                                        text: "Aucun message...",
                                        image: null
                                    }
                                }
                            }
                        )

                        // mise a jour du json
                        fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(usersData, null, 2));
                        pushed+=1;
                        console.log('{+} contact pushed ('+ pushed +') ['+ Date().split(' ')[4] +'] => ' + user.uid);

                        // creation du json de la discussion
                        if(!discussionCreated) {
                            let discussion = {
                                did: _did,
                                participants: [
                                    connectedUser,
                                    uid
                                ],
                                messages: []
                            }
                            fs.writeFileSync(__dirname + `/data/chats/${discussion.did}.json`, JSON.stringify(discussion, null, 2));
                            userPublicData.discussion = require(`./data/chats/${discussion.did}.json`);

                            discussionCreated = true;
                        }

                        if(pushed == 2) {
                            console.log('{+} contact pushed ['+ Date().split(' ')[4] +'] => break with '+ pushed +' pushed');
                            break;
                        }
                    }
                }
            }

            if(myPublicData.public.contacts) {
                for(contact of myPublicData.public.contacts) {
                    if(contact.uid == uid) {
                        // contact trouvee
                        found = contact;
                        break;
                    }
                }

                if(found) {
                    // on charge la discussion grace son id
                    userPublicData.discussion = require(`./data/chats/${found.did}.json`);
                }
                else if(!found) {
                    createContact();
                }
            }
            else {
                createContact();
            }

            socket.emit('discussion: user_founded', userPublicData);
            // console.log('{!} Public User data sended:', JSON.stringify(publicUsersData));
        })

        // envoi de message
        socket.on('discussion: send message', (data, discussion, sid)=>{
            const discussionData = require('./data/chats/'+discussion.did+'.json');
            const usersData = require('./data/users.json');
            let sender = {};
            let preMsgTime = '';
            if(discussionData.messages.length > 0)
                preMsgTime = formatDateWithText(new Date(discussionData.messages[discussionData.messages.length-1].datetime));
            let showDateTitle = false;

            for(user of usersData) {
                if(user.uid === sid)
                    sender = user.public;

                if(user.public.contacts) {
                    for(contact of user.public.contacts) {
                        if(contact.did == discussion.did) {
                            if(contact.uid == sid) {
                                if(contact.notifications == null)
                                    contact.notifications = 1;
                                else
                                    contact.notifications++;
                            }
                            contact.lastMessage = {
                                sid: sid,
                                data: data
                            };
                            break;
                        }
                    }
                }
            }

            const message = {
                mid: uuidv4(),
                sid: sid,
                content: {
                    text: data.text,
                    image: data.image,
                    file: null
                },
                datetime: new Date()
            }
            sended_image = data.image;

            if(preMsgTime !== formatDateWithText(new Date(message.datetime)) || discussionData.messages.length <= 0) {
                showDateTitle = true;
            }

            discussionData.messages.push(message);

            fs.writeFileSync(__dirname + `/data/users.json`, JSON.stringify(usersData, null, 2));
            fs.writeFileSync(__dirname + `/data/chats/${discussion.did}.json`, JSON.stringify(discussionData, null, 2));
            io.emit('discussion: receive message', message, showDateTitle, sender, discussion.did);

            updateUserDataToUsersList(sid);
        })

        // supprimer un message
        socket.on('discussion: delete message', (did, mid)=>{
            const currentDiscussion = require(`./data/chats/${did}.json`);
            let newDiscussion = [];

            for(message of currentDiscussion.messages) {
                if(message.mid !== mid)
                    newDiscussion.push(message);
                if(message.mid === mid) {
                    if(message.content.image)
                        fs.rmSync(__dirname+'/public/data/uploads/'+message.content.image);
                }
            }

            currentDiscussion.messages = newDiscussion;

            // console.log(JSON.stringify(newDiscussion, null, 2))

            fs.writeFileSync(__dirname + `/data/chats/${did}.json`, JSON.stringify(currentDiscussion, null, 2));
            io.emit('discussion: message deleted', did, mid);
        })

        // mise a jour des notification
        socket.on('update: notification', (uid, connectedUser) => {
            const users = require('./data/users.json');

            for(u of users) {
                if(u.uid == connectedUser) {
                    for(c of u.public.contacts) {
                        if(c.uid == uid) {
                            c.notifications = null;
                            break;
                        }
                    }
                    break;
                }
            }

            // mise a jour du json
            fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(users, null, 2));

            updateUserDataToUsersList(uid);
        })

        socket.on('update: up to date', (uid) => updateUserDataToUsersList(uid));

        socket.on('logout: client request', (user_session) => {
            console.log('{-} logout ['+ Date().split(' ')[4] +'] => ' + user_session);

            const usersData = require("./data/users.json");
            
            for(user of usersData) {
                if(user.uid == user_session) {
                    user.public.online = false;
                    break;
                }
            }

            // mise a jour du json
            fs.writeFileSync(__dirname + '/data/users.json', JSON.stringify(usersData, null, 2));

            updateUserDataToUsersList(user_session);
            // socket.disconnect();
        })

        socket.on('disconnecting', () => {
            console.log('{-} deconnection ['+ Date().split(' ')[4] +'] => ' + socket.id);
        })
    })


    // ----- deplacer fields.photo dans le repertoire data/profile_photo dans public -----
    const storage_photoProfile = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/data/profile_photo/');
        },
        filename: (req, file, cb) => {
            cb(null, photo)
            // console.log('multer photo name:', photo)
        }
    });

    const photo_profile = multer({storage: storage_photoProfile});

    app.post('/upload', photo_profile.single('profile_photo'), (req, res) => {
        res.redirect('/');
    });
    // ----------------------------- Fin Upload de image -----------------------------------


    // ----- deplacer fields.photo dans le repertoire data/profile_photo dans public -----
    setTimeout(()=>{
        const storage_uploads = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, 'public/data/uploads/');
            },
            filename: (req, file, cb) => {
                cb(null, sended_image)
                // console.log('multer photo name:', photo)
            }
        });

        const uploads = multer({storage: storage_uploads});

        app.post('/send_image', uploads.single('add_image'), (req, res) => {
            res.redirect('/');
            // console.log('image sended');
        });
    }, 500)
   
    // ----------------------------- Fin Upload de image -----------------------------------

    server.listen(port, () => {
        console.log('Serveur lancé au port: ' + port);
    });
}
