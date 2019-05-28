/** @jsx h */
import { h, app } from 'https://unpkg.com/hyperapp@2.0.0-beta.13/src/index.js?module'

// HTTP utilities for API request
const http = async (method, url, { body } = {}) =>
	await fetch(url, Object.assign(
		{ method, headers: { Accept: 'application/json' } },
		body && { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
	))
		.then(async (response) => {
			if (!response.ok) throw await response.text()
			return response.status !== 204 ? await response.json() : null
		})

http.get = http.bind(null, 'GET')
http.put = http.bind(null, 'PUT')
http.delete = http.bind(null, 'DELETE')

// Lens allows object deep property update, see https://gist.github.com/zaceno/0d7c62be81a845857e755c1378b7dbff
const lens = (path, map)  => {
	const [ key, ...rest ] = Array.isArray(path) ? path : path.split('.').reverse()
	if (rest.length) map = lens(rest, map)
	const F = f => x => Object.assign(Array.isArray(x) ? [] : {}, x, { [key]: f(x[key]) })
	return map ? x => map(F(x)) : F
}

// Actions & utilities
const update = (state, newState) => ({ ...state, ...newState })
const _updatePoll = (polls, poll) => {
	const index = polls.findIndex(({ pollId }) => pollId === poll.pollId)
	return Object.assign(polls, { [index === -1 ? polls.length : index]: poll })
}
const save = (state, poll) => [ { polls: _updatePoll(state.polls, poll), syncing: true }, [
	dispatch => http.put(`/api/polls/${poll.pollId}`, { body: poll })
			.then(() => dispatch(update, { syncing: false }))
			.catch(() => dispatch(state))
] ]
const del = (state, poll) => !confirm('delete?') ?  state : [ { polls: state.polls.filter(({ pollId }) => pollId !== poll.pollId), syncing: true }, [
	dispatch => http.delete(`/api/polls/${poll.pollId}`)
			.then(() => dispatch(update, { syncing: false }))
			.catch(() => dispatch(state))
] ]

// Form input value sync helper
const _constant = x => () => x
const _identity =  x => x
const _append = map => value => (x = []) => x.concat(map(value))
const _value = map => event => map(event.target.value)

const withValue = _value(_constant)
const appendValue = _value(_append(_identity))
const appendMapedValue = map => _value(_append(map))

// https://codepen.io/retrofuturistic/pen/tlbHE

// Components
const PollForm = ({ poll = {} }) => {
	const { pollId, title, styleUrl, questions } = poll
	const submit = (_state, event) => {
		event.preventDefault()
		const data = new FormData(event.target.form || event.target)
		return [ save, { pollId: data.get('pollId'), title: data.get('title'), styleUrl: data.get('styleUrl'), questions } ]
	}
	const sync = (path) => (_state, setter) => [ save, lens(path)(setter)(poll) ]
	return <form onsubmit={ submit }>
		{ pollId ? <div><h2>{ pollId }</h2><a class="delete" onclick={ [ del, poll ] }>delete</a></div> : '' }
		<input type={ pollId ? 'hidden' : 'text' } required name="pollId" pattern="[\w\d-]+" placeholder="Id (ex: project-1) used in URL" value={ pollId } />
		<textarea required name="title" placeholder="Title" onchange={ pollId && [ sync('title'), withValue ] }>{ title }</textarea>
		<input type="text" name="styleUrl" pattern="(https:)?//" placeholder="optional css URL" value={ styleUrl } onchange={ pollId && submit } />
		{ pollId ? <Questions pollId={ pollId } questions={ questions } sync={ sync } /> : <button type="submit">Create new poll</button> }
	</form>
}

const Questions = ({ sync, pollId, questions = [] }) => {
	const _delete = index => event => {
		event.preventDefault()
		return confirm('delete?') ? x => (x.splice(index, 1), x) : _identity
	}
	const _activate = index => questions => questions.map((q, i) => ({ ...q, active: index === i }))
	return <ol class="questions" start="-1">
		<li type="none">
			<input type="text" placeholder="New question" value="" onchange={ [ sync('questions'), appendMapedValue(text => ({ text, options: [] })) ] } />
		</li>
		<label class="deactivate">
			<li type="none">
				<input hidden type="radio" name={ pollId } onchange={ [ sync('questions'), () => _activate(-1) ] } />
				no active question
			</li>
		</label>
		{ questions.map(({ text, options, active }, questionIndex) =>
		<label>
			<input hidden type="radio" name={ pollId } checked={ active } onchange={ [ sync('questions'), () => _activate(questionIndex) ] } />
			<li type="1" class={ active ? 'active' : '' } >
				<input type="text" required placeholder="Question" value={ text } onchange={ [ sync(`questions.${questionIndex}.text`), withValue ] } />
				<a class="delete" onclick={ [ sync(`questions`), _delete(questionIndex) ] } >delete</a>
				<ol class="options" start="0">
					<li type="none">
						<input type="text" placeholder="New option" value="" onchange={ [ sync(`questions.${questionIndex}.options`), appendValue ] } />
					</li>{
					options.map((option, optionIndex) =>
					<li type="a">
						<input type="text" required placeholder="Option" value={ option } onchange={ [ sync(`questions.${questionIndex}.options.${optionIndex}`), withValue ] } />
						<a class="delete" onclick={ [ sync(`questions.${questionIndex}.options`), _delete(optionIndex) ] } >delete</a>
						<br/><progress value="1" max="2" />0/0
					</li>) }
				</ol>
			</li>
		</label>
		) }
	</ol>
}

// Application bootstrap
app({
	init: () => [
		{ polls: [], syncing: true },
		[ dispatch =>
			http.get('/api/polls')
				.then(polls => dispatch(update, { polls, syncing: false }))
		],
	],
	view: ({ polls, syncing }) =>
		<main class={ syncing ? 'syncing' : '' }>
			<PollForm />
			<hr/>
			{ polls.map(poll => <PollForm poll={ poll } /> ) }
		</main>
	,
	node: document.getElementById('app')
})
