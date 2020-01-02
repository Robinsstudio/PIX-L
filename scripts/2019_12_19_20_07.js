const query = db.questions.find();
const themes = {};

while (query.hasNext()) {
	const question = query.next();

	if (question.name.includes('_')) {
		const theme = question.name.replace(/.+_(.+)/, '$1').replace('- Copie', '').trim();
		question.theme = theme;
		print(question._id, question.name);
		themes[theme] = themes[theme] + 1 || 1;
	}

	db.questions.save(question);
}

print(Object.entries(themes).map(entry => entry.join(': ')).join('\n'));