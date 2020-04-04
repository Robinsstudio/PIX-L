/**
 * Returns a new multiple choice question.
 *
 * @param {string} idParent - the id of the parent folder
 */
function createMultipleChoiceQuestion(idParent) {
	return {
		questionType: 'multipleChoice',
		label: '',
		answers: [],
		time: 120,
		points: 1,
		idParent
	};
}

/**
 * Returns a new open-ended question.
 *
 * @param {string} idParent - the id of the parent folder
 */
function createOpenEndedQuestion(idParent) {
	return {
		questionType: 'openEnded',
		label: '',
		words: [],
		time: 120,
		points: 1,
		idParent
	};
}

/**
 * Returns a new matching question.
 *
 * @param {string} idParent - the id of the parent folder
 */
function createMatchingQuestion(idParent) {
	return {
		questionType: 'matching',
		matchingFields: [],
		time: 120,
		points: 1,
		idParent
	};
}

export default { createMultipleChoiceQuestion, createOpenEndedQuestion, createMatchingQuestion };