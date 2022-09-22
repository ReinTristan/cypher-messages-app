module.exports = {
	isLogedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next()
		} else {
			res.redirect('/login')
		}
	},
	isNotLogedIn(req, res, next) {
		if (!req.isAuthenticated()) {
			return next()
		} else {
			res.redirect('/messages/')
		}
	},
}
