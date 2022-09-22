const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const pool = require('../db')
const helpers = require('../lib/helpers')

passport.use(
	'local-login',
	new localStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: 'true',
		},
		async (req, email, password, done) => {
			const rows = await pool.query('SELECT * FROM users WHERE email = ?', [
				email,
			])
			if (rows.length > 0) {
				const user = rows[0]
				const cipherPassLogin = helpers.cipherPassword(password, rows[0].prime)
				if (cipherPassLogin === rows[0].password) {
					done(null, user, req.flash('success', `welcome ${user.username}`))
				} else {
					done(null, false, req.flash('message', 'Incorrect password'))
				}
			} else {
				done(null, false, req.flash('message', 'User not found'))
			}
		}
	)
)

passport.use(
	'local-register',
	new localStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: 'true',
		},
		async (req, email, password, done) => {
			const rows = await pool.query('SELECT * FROM users WHERE email = ?', [
				email,
			])
			if (rows.length > 0) {
				done(null, false, req.flash('message', 'User already exists'))
			} else {
				const { username } = req.body
				const prime = helpers.generatePrime()
				const cipherPassword = helpers.cipherPassword(password, prime)
				const newUser = {
					email,
					username,
					password: cipherPassword,
					prime,
				}
				// newUser.password = await helpers.encryptPassword(password)
				const result = await pool.query('INSERT INTO users SET ?', [newUser])
				newUser.id = result.insertId
				done(null, newUser)
			}
		}
	)
)

passport.serializeUser((user, done) => {
	done(null, user.id)
})
passport.deserializeUser(async (id, done) => {
	const user = await pool.query('SELECT * FROM users WHERE id = ?', [id])
	done(null, user[0])
})
