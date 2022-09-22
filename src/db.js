const mysql = require('mysql')
const { promisify } = require('util')
const { database } = require('./keys')

const pool = mysql.createPool(database)
pool.getConnection((err, conn) => {
	if (err) {
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			console.error('conn closed')
		}
		if (err.code === 'ER_CON_COUNT_ERROR') {
			console.error('too many conns')
		}
		if (err.code === 'ERCONNREFUSED') {
			console.error('conn refused')
		}
	} else {
		if (conn) conn.release()
		console.log('db connected')
		return
	}
})
//promisifing queries
pool.query = promisify(pool.query)
module.exports = pool
