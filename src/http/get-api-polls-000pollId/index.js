const { json, query } = require('@architect/shared')

exports.handler = async ({ params: { pollId } }) =>
	json((await query('polls', { pollId })).Items.pop())
