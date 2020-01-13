import React, { Component, Fragment } from 'react';
import { InputGroup, Button } from 'reactstrap';
import TextEditor from './TextEditor';
import AnswerField from './AnswerField';

class MultipleChoiceQuestionView extends Component {
	render() {
		const {
			data,
			updateQuestion,
			updateAnswer,
			removeAnswer,
			toggleAnswerCorrect,
			setAnswerFocused,
			addAnswer,
		} = this.props;
		return (
			<Fragment>
				<TextEditor onChange={updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici"/>
					{data.answers.map((answer, index, array) => {
						return (
							<AnswerField
								updateAnswer={updateAnswer}
								removeAnswer={removeAnswer}
								toggleAnswerCorrect={toggleAnswerCorrect}
								setAnswerFocused={setAnswerFocused}
								answer={answer}
								index={index}
								array={array}
								key={answer.key || answer._id}
							/>
						);
					})}

				<InputGroup className="justify-content-center">
					<Button onClick={addAnswer} color="success" className="mt-3">
						<i className="fas fa-plus"/>
					</Button>
				</InputGroup>
			</Fragment>
		);
	}
}

export default MultipleChoiceQuestionView;