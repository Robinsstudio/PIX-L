import React, { Component, Fragment } from 'react';
import { Col, InputGroup, Input } from 'reactstrap';
import TextEditor from './TextEditor';
import AutoCompleteInput from './AutoCompleteInput';
import request from './request';

/**
 * Builds the lower part of the question editor.
 * It contains fields common to all types of questions:
 *
 * - The theme
 * - The linked question
 * - The time (as minutes and seconds)
 * - The number of points
 */
class QuestionFooterView extends Component {
	constructor(props) {
		super(props);

		this.handleLinkedQuestionBlur = this.handleLinkedQuestionBlur.bind(this);
	}

	/**
	 * Fetches the name of the linked question (if there is one) and updates it.
	 */
	componentDidMount() {
		const { data: { linkedQuestion }, updateLinkedQuestion } = this.props;

		if (linkedQuestion) {
			request('GetQuestionNameById', { _id: linkedQuestion._id }).then(res => res.json())
			.then(question => {
				updateLinkedQuestion(question);
			});
		}
	}

	/**
	 * Fetches all question names which start with the specified string.
	 *
	 * @param {string} start - the beginning string
	 */
	loadQuestionNames(start) {
		return request('GetQuestionNamesStartingWith', { start }).then(res => res.json());
	}

	/**
	 * Fetches all themes which start with the specified string.
	 *
	 * @param {string} start - the beginning string
	 */
	loadThemes(start) {
		return request('GetThemesStartingWith', { start }).then(res => res.json());
	}

	/**
	 * Processes a blur event.
	 * It triggers the update of the linked question if necessary.
	 */
	handleLinkedQuestionBlur() {
		const { data: { linkedQuestion }, updateLinkedQuestion } = this.props;
		if (typeof linkedQuestion === 'string') {
			updateLinkedQuestion(null);
		}
	}

	/**
	 * Renders the QuestionFooterView.
	 */
	render() {
		const {
			data,
			updateFeedback,
			updateLinkedQuestion,
			updateTheme,
			updateMinutes,
			updateSeconds,
			updatePoints
		} = this.props;

		return (
			<Fragment>
				<TextEditor onChange={updateFeedback} initialValue={data.feedback} placeholder="Saisissez le feedback de votre question ici" className="mt-3"/>

				<AutoCompleteInput
					loadHints={this.loadThemes}
					value={data.theme || ''}
					onChange={updateTheme}
					component={Input}
					collapseOnEnter
					placeholder="Saisissez le thème de votre question ici"
					className="mt-3"
				/>

				<AutoCompleteInput
					loadHints={this.loadQuestionNames}
					value={data.linkedQuestion || ''}
					onChange={updateLinkedQuestion}
					onBlur={this.handleLinkedQuestionBlur}
					toString={question => question.name}
					component={Input}
					collapseOnEnter
					placeholder="Saisissez les premières lettres du nom de votre question liée ici"
					className="mt-3"
				/>

				<InputGroup className="justify-content-start align-items-center mt-3">
					<Col xs="2" className="pl-0">
						<Input type="number" min="0" value={(data.time - data.time % 60) / 60} onChange={updateMinutes}/>
					</Col>
					minutes
					<Col xs="2">
						<Input type="number" min="0" value={data.time % 60} onChange={updateSeconds}/>
					</Col>
					secondes
				</InputGroup>

				<InputGroup className="justify-content-start align-items-center mt-3">
					<Col xs="2" className="pl-0">
						<Input type="number" min="0" max="3" step="0.1" value={data.points} onChange={updatePoints}/>
					</Col>
					points
				</InputGroup>
			</Fragment>
		);
	}
}

export default QuestionFooterView;