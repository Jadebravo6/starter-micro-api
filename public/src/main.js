/*
	Fonctionnalités principales de l'application
 */

// Arriere plan
const bgList = [
	'assets/images/Gifs/308B92E8-0CB6-41C5-97FF-BA83A79B848D.GIF',
	'assets/images/Gifs/B6FC4FAF-6433-476A-BB00-0417D5020B6E.GIF',
	'assets/images/Gifs/B45250A6-037C-4B90-A8A6-B07261CB887B.GIF'
];

const form = document.getElementById('forms');
const chatApp = document.getElementById('chat-app');
let i = 0;

const changeBG = () => {
	form.style = `
		background: url(${bgList[i]});
		background-size: cover;
		background-position: 0%;
	`;

	chatApp.style = `
		background: url(${bgList[i]});
		background-size: cover;
		background-position: 0%;
	`;

	if (i < bgList.length) i++;
	if (i >= bgList.length) i = 0;

	setTimeout(changeBG, 90*1000);
}

// changeBG();

form.style = `
	background: url(${bgList[0]});
	background-size: cover;
	background-position: 0%;
	background-attachment: fixed;
`;
	
chatApp.style = `
	background: url(${bgList[2]});
	background-size: cover;
	background-position: 0%;
	background-attachment: fixed;
`;


// ===================  Navigation  ===================
const myInfos = document.getElementById('my-infos');
const aboutHelp = document.getElementById('by_lupita');
const otherUserInfo = document.querySelector('.other-user-infos');

// Profile page
// ------------
document.getElementById('my-infos').onclick = () => {
	if(!myInfos.classList.contains('active')) {
		myInfos.classList.add('active');
		$('#chat-app #main-bloc .left .home')
			  .transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .profile')
			.transition('scale')
			// .hidden = false
		;
	}
}
document.getElementById('profile-button-return').onclick = () => {
	if(myInfos.classList.contains('active')) {
		myInfos.classList.remove('active');
		$('#chat-app #main-bloc .left .profile')
			.transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .home')
			.transition('scale')
			// .hidden = false
		;
	}
}

// Other Profile page
// ------------------
document.querySelector('.other-user-infos').onclick = () => {
	if(!otherUserInfo.classList.contains('active') && !myInfos.classList.contains('active') && !aboutHelp.classList.contains('active')) {
        otherUserInfo.classList.add('active');
		if(window.innerWidth <= 844) {
			const room = document.querySelector('#chat-app #main-bloc .right');
			const leftSide = document.querySelector('#chat-app #main-bloc .left');
			room.style.display = 'none';
			leftSide.style.display = 'block';
		}
		$('#chat-app #main-bloc .left .home')
			.transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .other-profile')
			.transition('scale')
			// .hidden = false
		;
	}
}
document.getElementById('ot_profile-button-return').onclick = () => {
	if(otherUserInfo.classList.contains('active')) {
        otherUserInfo.classList.remove('active');
		$('#chat-app #main-bloc .left .other-profile')
			.transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .home')
			.transition('scale')
			// .hidden = false
		;

		if(window.innerWidth <= 844) {
			const room = document.querySelector('#chat-app #main-bloc .right');
			const leftSide = document.querySelector('#chat-app #main-bloc .left');
			room.style.display = 'flex';
			leftSide.style.display = 'none';
		}
	}
}

// About page
// ----------
document.getElementById('by_lupita').onclick = () => {
	if(!aboutHelp.classList.contains('active')) {
		aboutHelp.classList.add('active');
		$('#chat-app #main-bloc .left .home')
			.transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .about-help')
			.transition('scale')
			// .hidden = false
		;
	}
}
document.getElementById('about_back_button').onclick = () => {
	if(aboutHelp.classList.contains('active')) {
		aboutHelp.classList.remove('active');
		$('#chat-app #main-bloc .left .about-help')
			.transition('scale')
			// .hidden = true
		;
		$('#chat-app #main-bloc .left .home')
			.transition('scale')
			// .hidden = false
		;
	}
}