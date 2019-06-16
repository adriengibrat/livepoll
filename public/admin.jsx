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
const createPoll = (_state, poll) => {
	event.preventDefault()
	return [ save, poll ]
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

// https://codepen.io/retrofuturistic/pen/tlbHE

// Components helpers

const _set = (poll, path) => (state, setter) => (Object.assign(poll, lens(path)(setter)(poll)), state)
const _sync = poll => path => (_state, setter) => [ save, lens(path)(setter)(poll) ]
const _remove = index => event => {
	event.preventDefault()
	return confirm('delete?') ? x => (x.splice(index, 1), x) : _identity
}
const _activate = index => questions => questions.map((q, i) => ({ ...q, active: index === i }))

// Form input value sync helper
const _constant = x => () => x
const _identity =  x => x
const _append = fn => value => (x = []) => x.concat(fn(value))
const _value = fn => event => fn(event.target.value)
const _checked = fn => event => fn(!!event.target.checked)

const withValue = _value(_constant)
const withMapedValue = fn => _value(fn)
const appendMapedValue = fn => _value(_append(fn))
const withChecked = _checked(_constant)

// Components
const PollCreate = (poll = { questions: [] }) =>
	<form onsubmit={ [ createPoll, poll ] }>
		<input type="text" class="short" required pattern="[\w\d-]+" placeholder="Id (ex: project-1) used in URL" onchange={ [ _set(poll, 'pollId'), withValue ] } value="" />
		<textarea required placeholder="Title" onchange={ [ _set(poll, 'title'), withValue ] } value=""></textarea>
		<input type="text" pattern="(https:)?//" placeholder="optional css URL" onchange={ [ _set(poll, 'styleUrl'), withValue ] } value="" />
		<button type="submit">Create new poll</button>
		{ JSON.stringify(poll) }
	</form>

const PollEdit = ({ poll }) => {
	const { pollId, active, title, styleUrl, questions } = poll
	const syncPoll = _sync(poll)
	return <div>
		<input type="checkbox" class="switch" checked={ active } onchange={ [ syncPoll('active'), withChecked ] } id={ pollId } />
		<label for={ pollId }></label>
		<form onsubmit={ (_state, event)=> { event.preventDefault() } }>
			<h2>{ pollId }</h2>
			<a class="delete" onclick={ [ del, poll ] }>delete</a>
			<fieldset disabled={ active }>
				<textarea required name="title" placeholder="Title" onchange={ [ syncPoll('title'), withValue ] }>{ title }</textarea>
				<input type="text" name="styleUrl" pattern="(https:)?//" placeholder="optional css URL" value={ styleUrl } onchange={ [ syncPoll('styleUrl'), withValue ] } />
				<Questions sync={ syncPoll } questions={ questions } />
			</fieldset>
		</form>
	</div>
}
const Questions = ({ sync, questions = [] }) => {
	let total
	return <ol class="questions" start="-1">
		<li type="none">
			<input type="text" placeholder="New question" value="" onchange={ [ sync('questions'), appendMapedValue(text => ({ text, options: [] })) ] } />
		</li>
		<li type="none" class="deactivate" onclick={ [ sync('questions'), () => _activate(-1) ] }>
			no active question
		</li>
		{ questions.map(({ text, options, active }, questionIndex) =>
		<li type="1" class={ active ? 'active' : '' } onclick={ [ sync('questions'), () => _activate(questionIndex) ] }>
			<input type="text" required placeholder="Question" value={ text } onchange={ [ sync(`questions.${questionIndex}.text`), withValue ] } />
			<a class="delete" onclick={ [ sync(`questions`), _remove(questionIndex) ] } >delete</a>
			<ol class="options" start="0">
				<li type="none">
					<input type="text" placeholder="New option" value="" onchange={ [ sync(`questions.${questionIndex}.options`), appendMapedValue(text => ({ text, score: 0 })) ] } />
				</li>{(
				(total = options.reduce((sum, option) => sum + option.score, 0)),
				options.map(({ text, score }, optionIndex) =>
				<li type="a">
					<input type="text" required placeholder="Option" value={ text } onchange={ [ sync(`questions.${questionIndex}.options.${optionIndex}`), withMapedValue(text => ({ text, score })) ] } />
					<a class="delete" onclick={ [ sync(`questions.${questionIndex}.options`), _remove(optionIndex) ] } >delete</a>
					<br/><progress value={ score } max={ total } /> { score } / { total }
				</li>))}
			</ol>
		</li>
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
			<PollCreate />
			<hr/>
			{ polls.map(poll => <PollEdit poll={ poll } /> ) }
		</main>
	,
	node: document.getElementById('app')
})
