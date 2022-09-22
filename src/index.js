const express = require('express')
const morgan = require('morgan')
const path = require('path')
const flash = require('connect-flash')
const session = require('express-session')
const mysqlStore = require('express-mysql-session')
const { database, secretDb } = require('./keys')
const passport = require('passport')
//initialization
const app = express()
require('./lib/passport')
//routes imports
const messageRoutes = require('./routes/messages')
const basicRoutes = require('./routes/routes')
const authRoutes = require('./routes/authentication')
//settings
app.set('port', process.env.PORT || 5000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//middlewares
app.use(
	session({
		secret: secretDb,
		resave: false,
		saveUninitialized: false,
		store: new mysqlStore(database),
	})
)
app.use(flash())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
//static
app.use(express.static(path.join(__dirname, 'public')))

//global variables
app.use((req, res, next) => {
	app.locals.success = req.flash('success')
	app.locals.message = req.flash('message')
	app.locals.user = req.user
	next()
})

//routes
app.use('/messages', messageRoutes)
app.use('/', basicRoutes)
app.use('/', authRoutes)

//default route
app.use((req, res) => {
	res.status(404).redirect('/messages/')
})

//start
app.listen(app.get('port'), () =>
	console.log(`Server running on port ${app.get('port')}`)
)
