import React, { Component } from 'react';
import io from 'socket.io-client';
import TextRenderer from './TextRenderer';
import PrettyInput from './PrettyInput';
import request from './request';

import './style/student_view.css';

class StudentView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			questions: [],
			openEndedAnswer: ''
		};

		this.handleOpenEndedAnswerChanged = this.handleOpenEndedAnswerChanged.bind(this);
		this.buildMultipleChoiceQuestionBody = this.buildMultipleChoiceQuestionBody.bind(this);
		this.buildOpenEndedQuestionBody = this.buildOpenEndedQuestionBody.bind(this);

		this.buildersByQuestionType = {
			multipleChoice: this.buildMultipleChoiceQuestionBody,
			openEnded: this.buildOpenEndedQuestionBody,
		};

		request('GetGame', { url: this.props.match.params.url })
		.then(res => res.json())
		.then(questions => this.setState({ questions }));
	}

	componentDidMount() {
		const socket = io('/PIX-L');
		socket.on('connect', () => socket.emit('init', { url: this.props.match.params.url }));
		socket.on('cardSelected', ({index, selected}) => this.selectCard(index, selected));
		socket.on('questionSelected', ({index, selected}) => this.selectQuestion(index, selected));
		this.socket = socket;
	}

	isAuthenticated() {
		return this.props.authenticated;
	}

	selectCard(index, selected) {
		this.setState({
			questions: this.state.questions.map((quest, i) => index === i ? { ...quest, selected } : quest)
		});
	}

	selectQuestion(index, selected) {
		const activeQuestion = selected ? this.state.questions[index] : null;
		this.setState({ activeQuestion });
	}

	handleCardClicked(index) {
		if (this.isAuthenticated()) {
			this.socket.emit('selectCard', index);
		}
	}

	handleOpenEndedAnswerChanged(event) {
		this.setState({ openEndedAnswer: event.target.value });
	}

	buildCards() {
		const { questions } = this.state;

		return (
			questions.map((question, i) => {
				return (
					<div className={`card ${question.selected ? 'selected' : ''}`} key={question._id} onClick={() => this.handleCardClicked(i)}>
						<div className="card-background">
							<div className="number">{i + 1}</div>
						</div>
						<div className="theme">{ question.theme }</div>
						<div className="points">{ `${question.points} pt${question.points > 1 ? 's' : ''}` }</div>
					</div>
				);
			})
		);
	}

	buildMultipleChoiceQuestionBody() {
		const { activeQuestion } = this.state;

		return (
			<div id="cardContainer">
				{activeQuestion.answers.map(answer => {
					return (
						<div className="card card--wide" key={answer._id} onClick={() => this.setState({ activeQuestion: null })}>
							<TextRenderer initialValue={answer.label}/>
						</div>
					);
				})}
			</div>
		);
	}

	buildOpenEndedQuestionBody() {
		const { openEndedAnswer } = this.state;

		return (
			<PrettyInput
				id="openEndedAnswer"
				type="text"
				label="Réponse"
				onChange={this.handleOpenEndedAnswerChanged}
				value={openEndedAnswer}
				large
			/>
		);
	}

	buildActiveQuestionBody() {
		const { buildersByQuestionType, state: { activeQuestion } } = this;
		return buildersByQuestionType[activeQuestion.questionType]();
	}

	buildActiveQuestion() {
		const { activeQuestion } = this.state;

		return (
			<div id="questionSection">
				<div id="questionLabel">
					<TextRenderer initialValue={activeQuestion.label}/>
				</div>
				{ this.buildActiveQuestionBody() }
			</div>
		);
	}

	render() {
		const { activeQuestion } = this.state;

		return (
			<div id="gameWrapper">
				<div id="gameHeader"/>
				<div id="gameContainer">
					<div id="game">
						{ activeQuestion ? this.buildActiveQuestion() : this.buildCards() }
					</div>
					<div id="score">
						<div class="points-container">
							<div class="points-rectangle points-rectangle--1">
								<div class="points-value points-value--1">100</div>
							</div>
							<div class="points-rectangle points-rectangle--2">
								<div class="points-value points-value--2">100</div>
							</div>
							<div class="points-rectangle points-rectangle--3">
								<div class="points-value points-value--3">100</div>
							</div>
							<div class="points-rectangle points-rectangle--4">
								<div class="points-value points-value--4">100</div>
							</div>
							<div class="points-rectangle points-rectangle--5">
								<div class="points-value points-value--5">100</div>
							</div>
						</div>
						<div class="points-label">PTS</div>
					</div>
				</div>
				<div id="gameFooter"/>
			</div>
		);
	}
}

export default StudentView;