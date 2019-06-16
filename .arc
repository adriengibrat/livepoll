@app
livepoll

@aws
region eu-west-3
profile default
runtime nodejs8.10

@ws

@http
get /
get /admin
get /api/polls
get /api/polls/:pollId
put /api/polls/:pollId
delete /api/polls/:pollId

@tables
polls
  pollId *String

connections
  connectionId *String
  pollId **String
