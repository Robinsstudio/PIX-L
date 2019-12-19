const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const query = db.questions.find({ questionType: 'matching' });

while (query.hasNext()) {
	const question = query.next();

	if (question._id.valueOf() != '5df69c6e11f6a6415611957f') {
		question.label = '{"blocks":[{"key":"' + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') + '","text":"' + question.matchingFields[0].label + '","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}';
		question.matchingFields = question.matchingFields.slice(1);
		print(question._id, question.name, question.questionType);
	}

	db.questions.save(question);
}