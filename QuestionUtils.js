/**
 * Returns the specified question with only the three following fields:
 *
 * - id
 * - theme
 * - points
 *
 * @param {Object} question - the question to filter
 */
function getQuestion(question) {
	return {
		_id: question._id,
		theme: question.theme,
		points: question.points,
	};
}

/**
 * Returns the specified question without the answer fields.
 *
 * @param {Object} question - the question to filter
 */
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

/**
 * Checks the specified multiple choice question against the original question to ensure it is not malformed.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function checkMultipleChoiceQuestion(studentQuestion, originalQuestion) {
	return studentQuestion
			&& Array.isArray(studentQuestion.answers)
			&& studentQuestion.answers.length === originalQuestion.answers.length
			&& studentQuestion.answers.filter(e => e).length === studentQuestion.answers.length;
}


/**
 * Checks the specified open-ended question to ensure it is not malformed.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 */
function checkOpenEndedQuestion(studentQuestion) {
	return studentQuestion && typeof studentQuestion.openEndedAnswer === 'string';
}

/**
 * Checks the specified matching question against the original question to ensure it is not malformed.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
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

/**
 * Checks the answer to the specified multiple choice question against the original question.
 * Returns true if the answer is correct, false otherwise.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function correctMultipleChoiceQuestion(studentQuestion, originalQuestion) {
	return checkMultipleChoiceQuestion(studentQuestion, originalQuestion)
			&& originalQuestion.answers.every(({correct}, i) => correct === !!studentQuestion.answers[i].correct);
}

/**
 * Checks the answer to the specified open-ended question against the original question.
 * Returns true if the answer is correct, false otherwise.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function correctOpenEndedQuestion(studentQuestion, originalQuestion) {
	const match = originalQuestion.exactMatch ? equals : includes;
	return checkOpenEndedQuestion(studentQuestion)
			&& originalQuestion.words.some(word => match(studentQuestion.openEndedAnswer.toLowerCase(), word.toLowerCase()));
}

/**
 * Checks the answer to the specified matching question against the original question.
 * Returns true if the answer is correct, false otherwise.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function correctMatchingQuestion(studentQuestion, originalQuestion) {
	return checkMatchingQuestion(studentQuestion, originalQuestion)
			&& originalQuestion.matchingFields.every((field, i) => {
				return field.answers.every(({correct}, j) => correct === !!studentQuestion.matchingFields[i].answers[j].correct);
			});
}

/**
 * Checks the answer to the specified question against the original question.
 * Returns true if the answer is correct, false otherwise.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function correctQuestion(studentQuestion, originalQuestion) {
	return correctByQuestionType[originalQuestion.questionType](studentQuestion, originalQuestion);
}

/**
 * Builds the feedback to respond to the team of students.
 * The answer to the specified multiple choice question is first checked, and the feedback is built accordingly.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
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

/**
 * Builds the feedback to respond to the team of students.
 * The answer to the specified open-ended question is first checked, and the feedback is built accordingly.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
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

/**
 * Builds the feedback to respond to the team of students.
 * The answer to the specified matching question is first checked, and the feedback is built accordingly.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function getMatchingFeedback(studentQuestion, originalQuestion) {
	let feedback = {};

	if (checkMatchingQuestion(studentQuestion, originalQuestion)) {
		feedback.general = originalQuestion.feedback;
	}

	return feedback;
}

/**
 * Builds the feedback to respond to the team of students.
 * The answer to the specified question is first checked, and the feedback is built accordingly.
 *
 * @param {Object} studentQuestion - the question returned by the team of students
 * @param {Object} originalQuestion - the original question
 */
function getFeedback(studentQuestion, originalQuestion) {
	return feedbackByQuestionType[originalQuestion.questionType](studentQuestion, originalQuestion);
}

module.exports = { getQuestion, getActiveQuestion, correctQuestion, getFeedback };