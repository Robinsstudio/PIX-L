function getQuestion(question) {
	return {
		_id: question._id,
		theme: question.theme,
		points: question.points,
	};
}

function getActiveQuestion(question) {
	return {
		_id: question._id,
		questionType: question.questionType,
		label: question.label,
		answers: question.answers.map(({label}) => { return { label } }),
		matchingFields: question.matchingFields.map(({label, answers}) => { return { label, answers: answers.map(({label}) => { return { label } }) } }),
		theme: question.theme,
		points: question.points,
		time: question.time
	};
}

function correctQuestion(studentQuestion, originalQuestion) {
	return correctOpenEndedQuestion(studentQuestion, originalQuestion);
}

function correctOpenEndedQuestion(studentQuestion, originalQuestion) {
	return studentQuestion && typeof studentQuestion.openEndedAnswer === 'string'
			&& originalQuestion.words.some(word => studentQuestion.openEndedAnswer.toLowerCase().includes(word.toLowerCase()));
}

module.exports = { getQuestion, getActiveQuestion, correctQuestion };