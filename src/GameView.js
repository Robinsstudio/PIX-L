import React, { Component, Fragment } from 'react';
import { InputGroup, InputGroupAddon, InputGroupText, Input, Button } from 'reactstrap';
import ReactMarkdown from 'react-markdown';
import CodeRenderer from './CodeRenderer';

class GameView extends Component {
	constructor(props) {
		super(props);

		this.goBack = this.goBack.bind(this);
		this.goNext = this.goNext.bind(this);
	}

	setChecked(index) {
		const { questions, current, editable } = this.props;

		if (editable) {
			const updatedQuestions = questions.slice();

			updatedQuestions[current].answers.forEach((answer, i) => {
				if (i === index) {
					answer.checked = !answer.checked;
				}
			});

			this.fireOnAnswersChanged(updatedQuestions);
		}
	}

	goBack() {
		const previous = this.props.current - 1;

		if (previous >= 0) {
			this.fireOnCurrentQuestionChanged(previous);
		}
	}

	goNext() {
		const { questions, current } = this.props;
		const next = current + 1;

		if (next < questions.length) {
			this.fireOnCurrentQuestionChanged(next);
		} else {
			this.fireOnDone();
		}
	}

	buildTextNextButton() {
		const { questions, current } = this.props;

		if (current < questions.length - 1) {
			return (
				<Fragment>
					Suivant
					<i className="fas fa-arrow-right ml-3"/>
				</Fragment>
			);
		}

		return (
			<Fragment>
				Terminé
				<i className="fas fa-check ml-3"/>
			</Fragment>
		);
	}

	buildCurrentQuestion() {
		const { questions, current, onDone } = this.props;

		if (questions.length) {
			const question = questions[current];
			return (
				<Fragment>
					<ReactMarkdown source={question.label} renderers={{ code: CodeRenderer }}/>
					{ question.answers.map((answer, index) => {

						const { checked, correct, label } = answer;
						const className = correct ? 'correct' : correct === false && checked ? 'incorrect' : '';

						return (
							<InputGroup className="mb-3">
								<InputGroupAddon addonType="prepend">
									<InputGroupText onClick={() => this.setChecked(index)}>
										<Input addon type="checkbox" checked={answer.checked = !!checked} readOnly/>
									</InputGroupText>
								</InputGroupAddon>
								<div className={`${className} answer form-control mr-3`} spellCheck="false">{label}</div>
							</InputGroup>
						);
					}) }
					<div className="row justify-content-around">
						<Button color="primary" className="mt-3 mb-3" onClick={this.goBack}>
							<i className="fas fa-arrow-left mr-3"/>
							Précédent
						</Button>

						{(onDone || current < questions.length - 1) &&
						<Button color="primary" className="mt-3 mb-3" onClick={this.goNext}>
							{ this.buildTextNextButton() }
						</Button>}
					</div>
				</Fragment>
			);
		}

		return null;
	}

	fireOnAnswersChanged(questions) {
		const { onAnswersChanged } = this.props;
		if (typeof onAnswersChanged === 'function') {
			onAnswersChanged(questions);
		}
	}

	fireOnCurrentQuestionChanged(current) {
		const { onCurrentQuestionChanged } = this.props;
		if (typeof onCurrentQuestionChanged === 'function') {
			onCurrentQuestionChanged(current);
		}
	}

	fireOnDone() {
		const { onDone } = this.props;
		if (typeof onDone === 'function') {
			onDone();
		}
	}

	render() {
		return this.buildCurrentQuestion();
	}
}

export default GameView;