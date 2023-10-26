/*
    Connexion
    Inscription
    Page de Profile (Edition)
 */


(function(){
    const forms = document.getElementById('forms');
    const chatApp = document.getElementById('chat-app');
    const editButton = document.getElementById('profile-button-edit');
    const saveButton = document.getElementById('profile-button-save');
	const socket = io();
    const user_session = localStorage.getItem('user_session');

    // -- [Afficher/Masquer la page login ou singin]
    const loginForm = document.querySelector('.login');
    const signinForm = document.querySelector('.signin');
    const loginButton = document.querySelector('.signin p .login-button')
    const signinButton = document.querySelector('.login p .signin-button')

    signinButton.addEventListener('click', () => {
    	signinForm.classList.add('active')
    	loginForm.classList.remove('active')
    });

    loginButton.addEventListener('click', () => {
    	loginForm.classList.add('active')
    	signinForm.classList.remove('active')
    });

    // -- [Regles pour les formulaire login & signin]
	$('.ui.form.login')
        .form({
            fields: {
                mail: {
                    identifier: 'mail',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Veuillez entrez votre adresse mail'
                        },
                        {
                            type: 'email',
                            prompt: 'Verifiez que votre adresse mail est correct'
                        }
                    ]
                },
                password: {
                    identifier: 'password',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Veuillez specifiez votre mot de passe'
                        },
                        {
                            type: 'minLength[6]',
                            prompt: 'Le mot de passe doit contenir au moins {ruleValue} caracteres'
                        }
                    ]
                }
            },
            onSuccess: function(event, fields) {
                event.preventDefault();
                socket.emit('login: client request', fields);

                socket.on('login: server response', (response) => {
                    if(response.msg == 'success') {	
                        socket.emit('login: client success', response.uid);
                        localStorage.setItem('user_session', response.uid);

                        document.getElementById('login_success_message').innerHTML = '<span><i class=\'check icon\'></i>Utilisateur connecté avec succes</span>';
                        document.getElementById('login_success_message').style.display = 'flex'
                        document.getElementById('login_error_message').style.display = 'none'
                        setTimeout(()=>{
                            forms.classList.remove('active');
                            chatApp.classList.add('active');
                        }, 2000)
                        location.reload();
                    } else if(response.msg == 'password_not_match') {	
                        document.getElementById('login_error_message').innerHTML = '<span><i class=\'close icon\'></i>Mot de passe incorrect</span>';
                        document.getElementById('login_error_message').style.display = 'flex'
                    } else {
                        document.getElementById('login_error_message').innerHTML = '<span><i class=\'close icon\'></i>Email ou Mot de passe incorrect</span>';
                        document.getElementById('login_error_message').style.display = 'flex'
                    }
                })
            }
        })


    $('.ui.form.signin')
        .form({
            fields: {
                mail: {
                    identifier: 'mail',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Veuillez entrez votre adresse mail'
                        },
                        {
                            type: 'email',
                            prompt: 'Verifiez que votre adresse mail est correct'
                        }
                    ]
                },
                
                password_1: {
                    identifier: 'password_1',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Veuillez specifiez votre mot de passe'
                        },
                        {
                            type: 'minLength[6]',
                            prompt: 'Le mot de passe doit contenir au moins {ruleValue} caracteres'
                        }
                    ]
                },
                password_2: {
                    identifier: 'password_2',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Veuillez specifiez votre mot de passe'
                        },
                        {
                            type: 'match[password_1]',
                            prompt: 'Les mots de passe ne corespondent pas'
                        }
                    ]
                }
            },
            onSuccess: function(event, fields){
                event.preventDefault();
                socket.emit('signin: client request', fields);

                socket.on('signin: server response', (response)=>{
                    if(response.msg == 'success') {	
                        localStorage.setItem('user_session', response.uid);

                        document.getElementById('signin_success_message').innerHTML = '<span><i class=\'check icon\'></i>Inscription réussi</span>';
                        document.getElementById('signin_success_message').style.display = 'flex'
                        document.getElementById('signin_warning_message').style.display = 'none'
                        document.getElementById('signin_error_message').style.display = 'none'
                        setTimeout(()=>{
                            forms.classList.remove('active');
                            chatApp.classList.add('active');
                            // Edit Profile Mdde
                            (function(){
                                $('#chat-app #main-bloc .left .home')
                                    .transition('scale')
                                    .hidden = true
                                ;
                                $('#chat-app #main-bloc .left .profile')
                                    .transition('scale')
                                    .hidden = false
                                ;

                                document.getElementById('profile-pseudo').removeAttribute('readonly');
                                document.getElementById('profile-description').removeAttribute('readonly');
                                document.getElementById('get-image').disabled = false;
                                editButton.classList.replace('blue', 'green');

                                saveButton.style.display = 'flex';
                            })()
                        }, 2000)
                    } else if(response.msg == 'mail_taken') {	
                        document.getElementById('signin_warning_message').innerHTML = '<span><i class=\'close icon\'></i>Ce compte existe déjè</span>';
                        document.getElementById('signin_warning_message').style.display = 'flex'
                    }
                })
            }
        })	
    
    
    if(localStorage.getItem('user_session')) {
        socket.emit('login: client success', localStorage.getItem('user_session'));

        forms.classList.remove('active');
        chatApp.classList.add('active');
    }


    // -- [chargement des donnees de l'utilisateur]
    socket.on('login: server success', (response) => {
        // console.log('new login: ' + JSON.stringify(response));

        // Home top infos
        const myPhoto = document.querySelector('#my-infos .user-photo');
        const myName = document.querySelector('#my-infos .user-name');

        // profile page current infos
        const pr_myPhoto = document.getElementById('photo_content');
        const pr_myName = document.getElementById('profile-pseudo');
        const pr_myAbout = document.getElementById('profile-description');

        document.head.querySelector('title').textContent = `Ocean Chat | ${response.data.name}`;

        if(!response.data.photo)
            response.data.photo = '../../assets/images/avatar.jpg'

        pr_myPhoto.style = myPhoto.style = `
        background: url(data/profile_photo/${response.data.photo});
        background-size: cover;
        background-repeat: no-repeat;
        background-position: 0%;
        `;
        
        pr_myName.placeholder = myName.textContent = response.data.name;
        pr_myAbout.placeholder = response.data.about;
    })


    // -- [deconnexion]
    document.getElementById('logout_button').onclick = () => {
        socket.emit('logout: client request', localStorage.getItem('user_session'));

        forms.classList.add('active');
        chatApp.classList.remove('active');
        localStorage.removeItem('user_session');
        location.reload();
    }

    window.addEventListener('focus', () => {
        if(user_session !== null) {
            socket.emit('login: client success', user_session);
        }
    });

    window.addEventListener('blur', () => {
        if(user_session !== null) {
            socket.emit('logout: client request', user_session);
        }
    });
    

    // -- [edition du profile de l'utilisateur connecté]
	editButton.onclick = () => {
		document.getElementById('profile-pseudo').removeAttribute('readonly');
		document.getElementById('profile-description').removeAttribute('readonly');
		document.getElementById('get-image').disabled = false;
		editButton.classList.replace('blue', 'green');

        document.getElementById('profile-pseudo').value = document.getElementById('profile-pseudo').placeholder;
        document.getElementById('profile-description').value = document.getElementById('profile-description').placeholder;

		saveButton.style.display = 'flex';
	}
	
	saveButton.addEventListener('click', ()=>{
		document.getElementById('profile-pseudo').readonly = true;
		document.getElementById('profile-description').readonly = true;
		editButton.classList.replace('green', 'blue');

		const data = {
			extPhoto: null,
			name: document.getElementById('profile-pseudo').value,
			about: document.getElementById('profile-description').value
		}

		if(document.getElementById('get-image').files[0] != null) {
			let ext = document.getElementById('get-image').files[0].name.split('.');
			data.extPhoto = ext[ext.length-1];
		}

		// console.log('edit', JSON.stringify(data));
		socket.emit('profile: client send new data', data, localStorage.getItem('user_session'));
	})

})()