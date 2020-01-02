import React, { Component, Fragment } from 'react';
import { InputGroup, Button } from 'reactstrap';
import TextEditor from './TextEditor';
import MatchingField from './MatchingField';
import './style/answer_field.css';

class MatchingQuestionView extends Component {
	render() {
		const {
			data,
			updateQuestion,
			addMatchingField,
			removeMatchingField,
			updateMatchingField
		} = this.props;
		return (
			<Fragment>
				<TextEditor onChange={updateQuestion} initialValue={data.label} placeholder="Saisissez votre question ici" className="mb-3"/>
				{data.matchingFields.map((field, index) => {
					return (
						<MatchingField
							field={field}
							index={index}
							removeMatchingField={removeMatchingField}
							updateMatchingField={updateMatchingField}
						/>
					);
				})}

				<InputGroup className="justify-content-center">
					<Button onClick={addMatchingField} color="success" className="mt-5 mb-5">
						<i className="fas fa-plus"/>
					</Button>
				</InputGroup>
			</Fragment>
		);
	}
}

export default MatchingQuestionView;