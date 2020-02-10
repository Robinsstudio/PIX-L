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

const feedbackByQuestionType = {
	multipleChoice: getMultipleChoiceFeedback,
	openEnded: getOpenEndedFeedback,
	matching: getMatchingFeedback
}

function equals(str1, str2) {
	return str1 === str2;
}

function includes(str1, str2) {
	return str1.includes(str2);
}

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
	const match = originalQuestion.exactMatch ? equals : includes;
	return checkOpenEndedQuestion(studentQuestion)
			&& originalQuestion.words.some(word => match(studentQuestion.openEndedAnswer.toLowerCase(), word.toLowerCase()));
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

function getMultipleChoiceFeedback(studentQuestion, originalQuestion) {
	let feedback = {};

	if (checkMultipleChoiceQuestion(studentQuestion, originalQuestion)) {
		const studentAnswerIndex = studentQuestion.answers.findIndex(answer => answer.correct);
		if (studentAnswerIndex != -1 && originalQuestion.answers[studentAnswerIndex].feedback) {
			feedback.specific = originalQuestion.answers[studentAnswerIndex].feedback;
		}

		feedback.general = originalQuestion.feedback;
	}

	return feedback;
}

function getOpenEndedFeedback(studentQuestion, originalQuestion) {
	let feedback = {};

	if (checkMultipleChoiceQuestion(studentQuestion, originalQuestion)) {
		if (correctOpenEndedQuestion(studentQuestion, originalQuestion)) {
			feedback.specific = originalQuestion.positiveFeedback;
		} else {
			feedback.specific = originalQuestion.negativeFeedback;
		}

		feedback.general = originalQuestion.feedback;
	}

	return feedback;
}

function getMatchingFeedback(studentQuestion, originalQuestion) {
	let feedback = {};

	if (checkMatchingQuestion(studentQuestion, originalQuestion)) {
		feedback.general = originalQuestion.feedback;
	}

	return feedback;
}

function getFeedback(studentQuestion, originalQuestion) {
	return feedbackByQuestionType[originalQuestion.questionType](studentQuestion, originalQuestion);
}

module.exports = { getQuestion, getActiveQuestion, correctQuestion, getFeedback };