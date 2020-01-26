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

const correctByQuestionType = {
	multipleChoice: correctMultipleChoiceQuestion,
	openEnded: correctOpenEndedQuestion,
	matching: correctMatchingQuestion
};

function checkMultipleChoiceQuestion(studentQuestion, originalQuestion) {
	return studentQuestion
			&& Array.isArray(studentQuestion.answers)
			&& studentQuestion.answers.length === originalQuestion.answers.length
			&& studentQuestion.answers.filter(e => e).length === studentQuestion.answers.length;
}

function checkOpenEndedQuestion(studentQuestion) {
	return studentQuestion && typeof studentQuestion.openEndedAnswer === 'string';
}

function checkMatchingQuestion(studentQuestion, originalQuestion) {
	return studentQuestion
			&& Array.isArray(studentQuestion.matchingFields)
			&& studentQuestion.matchingFields.length === originalQuestion.matchingFields.length
			&& studentQuestion.matchingFields.every((field, i) => {
				return field
						&& Array.isArray(field.answers)
						&& field.answers.length === originalQuestion.matchingFields[i].answers.length
						&& field.answers.filter(e => e).length == field.answers.length;
			});
}

function correctMultipleChoiceQuestion(studentQuestion, originalQuestion) {
	return checkMultipleChoiceQuestion(studentQuestion, originalQuestion)
			&& originalQuestion.answers.every(({correct}, i) => correct === !!studentQuestion.answers[i].correct);
}

function correctOpenEndedQuestion(studentQuestion, originalQuestion) {
	return checkOpenEndedQuestion(studentQuestion)
			&& originalQuestion.words.some(word => studentQuestion.openEndedAnswer.toLowerCase().includes(word.toLowerCase()));
}

function correctMatchingQuestion(studentQuestion, originalQuestion) {
	return checkMatchingQuestion(studentQuestion, originalQuestion)
			&& originalQuestion.matchingFields.every((field, i) => {
				return field.answers.every(({correct}, j) => correct === !!studentQuestion.matchingFields[i].answers[j].correct);
			});
}

function correctQuestion(studentQuestion, originalQuestion) {
	return correctByQuestionType[originalQuestion.questionType](studentQuestion, originalQuestion);
}

module.exports = { getQuestion, getActiveQuestion, correctQuestion };