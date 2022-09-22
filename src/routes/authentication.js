const { Router } = require('express')
const router = Router()
const passport = require('passport')
const { isLogedIn, isNotLogedIn } = require('../lib/auth')
const pool = require('../db')

router.get('/register', isNotLogedIn, (req, res) => {
	res.render('auth/register')
})
router.post(
	'/register',
	passport.authenticate('local-register', {
		successRedirect: '/profile',
		failureRedirect: '/register',
		failureFlash: true,
	})
)

router.get('/login', isNotLogedIn, (req, res) => {
	res.render('auth/login')
})
router.post('/login', (req, res, next) => {
	passport.authenticate('local-login', {
		successRedirect: '/messages/unread',
		failureRedirect: '/login',
		failureFlash: true,
	})(req, res, next)
})

router.get('/logout', isLogedIn, (req, res) => {
	req.logOut()
	res.redirect('/login')
})

router.get('/profile', isLogedIn, (req, res) => {
	res.render('auth/profile', {
		user: req.user,
		active: 'profile',
	})
})
router.get('/contacts', isLogedIn, async (req, res) => {
	const { id } = req.user
	const contacts = await getContacts(id)
	const totalReceived = await getContactsReceived(id)
	for (let i = 0; i < contacts.length; i++) {
		contacts[i].totalReceived = totalReceived[i].totalReceived
	}
	res.render('messages/contacts', {
		contacts,
		active: 'contacts',
	})
})

async function getContacts(actualUserId) {
	const contactSent = pool.query(
		`SELECT users.id, users.username, COUNT(messages.receiver) AS totalSent FROM users LEFT JOIN messages ON messages.sender = ? AND messages.receiver = users.id WHERE NOT users.id = ? GROUP BY users.id`,
		[actualUserId, actualUserId]
	)

	return contactSent
}

async function getContactsReceived(actualUserId) {
	const contactReceiver = pool.query(
		`SELECT COUNT(messages.receiver) AS totalReceived FROM users LEFT JOIN messages ON messages.sender = users.id AND messages.receiver = ?  WHERE NOT users.id = ? GROUP BY users.id`,
		[actualUserId, actualUserId]
	)
	return contactReceiver
}

module.exports = router
