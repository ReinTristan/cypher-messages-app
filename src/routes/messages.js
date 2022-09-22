const { Router } = require('express')
const router = Router()
const {
	timeAgo,
	cipherMessage,
	decipherMessage,
	generateKeys,
} = require('../lib/helpers')
const { isLogedIn } = require('../lib/auth')
const pool = require('../db')

router.get('/', isLogedIn, async (req, res) => {
	const { id } = req.user
	const messages = await getAllMessagesPerUser(id)
	messages.forEach((message) => (message.date = timeAgo(message.date)))

	res.render('./messages/all', {
		messages,
		active: 'all',
	})
})
router.get('/message/:id', isLogedIn, async (req, res) => {
	const { id } = req.params
	const userId = req.user.id
	const [message] = await getMessage(id, userId)
	if (message === undefined) {
		res.redirect('/messages/')
		return
	}
	const [keys] = await getMessageKeys(id)
	message.message = decipherMessage(message.message, keys.sender_key)
	if (message.status == 'unread') await updateStatus(id)
	res.render('./messages/message', {
		message,
		active: 'none',
	})
})
router.get('/unread', isLogedIn, async (req, res) => {
	const { id } = req.user
	const messages = await getUnreadMessagesPerUser(id)
	messages.forEach((message) => (message.date = timeAgo(message.date)))
	res.render('./messages/unread', {
		messages,
		active: 'unread',
	})
})
router.get('/new/:userId', isLogedIn, async (req, res) => {
	const receiverId = parseInt(req.params.userId)
	if (receiverId == req.user.id) {
		res.redirect('/messages/')
		return
	}
	const [user] = await getUser(receiverId)
	res.render('./messages/new', {
		active: 'none',
		receiverId,
		receiverName: user.username,
	})
})
router.post('/new/:userId', async (req, res) => {
	const { title, message, receiver } = req.body
	const [receiverUser] = await getUser(receiver)
	const keys = generateKeys(req.user.prime, receiverUser.prime)
	const cipherVersion = cipherMessage(message, keys.senderKey)
	const newMessage = {
		title,
		message: cipherVersion,
		status: 'unread',
		sender: req.user.id,
		receiver,
	}
	try {
		const query = await insertMessage(newMessage)
		const newKeys = {
			message: query.insertId,
			sender_key: keys.senderKey,
			receiver_key: keys.receiverKey,
		}
		const queryKeys = await insertKeys(newKeys)
		req.flash('success', 'Message Sent')
		res.redirect('/messages/')
	} catch (e) {
		console.error(e)
		req.flash('message', 'Error sending the message')
		res.redirect('/messages/')
	}
})

async function getAllMessagesPerUser(id) {
	const rows = await pool.query(
		`SELECT messages.*, users.username, users.id AS receiverId
		FROM messages 
		LEFT JOIN users ON sender = users.id WHERE receiver = ? AND NOT status = ?`,
		[id, 'unread']
	)
	return rows
}

async function getUnreadMessagesPerUser(id) {
	const rows = await pool.query(
		`SELECT messages.*, users.username
		FROM messages 
		LEFT JOIN users ON sender = users.id WHERE receiver = ? AND status = ?`,
		[id, 'unread']
	)
	return rows
}

async function getMessage(id, userId) {
	const message = await pool.query(
		` SELECT messages.*, users.username AS username FROM messages LEFT JOIN users ON messages.sender = users.id WHERE messages.id = ? and messages.receiver = ?`,
		[id, userId]
	)
	return message
}
async function getMessageKeys(id) {
	const keys = await pool.query(
		`SELECT * FROM message_keys WHERE message = ?`,
		[id]
	)
	return keys
}
async function getUser(id) {
	const user = pool.query('SELECT username, prime FROM users WHERE id = ?', [
		id,
	])
	return user
}

async function insertMessage(message) {
	const query = pool.query('INSERT INTO messages SET ?, date = NOW() ', [
		message,
	])
	return query
}
async function insertKeys(keys) {
	const query = pool.query('INSERT INTO message_keys SET ?', [keys])
	return query
}

async function updateStatus(id) {
	const status = 'read'
	const query = pool.query('UPDATE messages SET status = ? WHERE id = ?', [
		status,
		id,
	])
	return query
}

module.exports = router
