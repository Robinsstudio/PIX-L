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