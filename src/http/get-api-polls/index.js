const { json, query } = require('@architect/shared')

exports.handler = async () =>
  json((await query('polls')).Items)
