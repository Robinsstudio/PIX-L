import React, { Component } from 'react';
import { Button, ListGroup, ListGroupItem } from 'reactstrap';
import GameView from './GameView';

class SessionView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			gameView: {
				visible: false,
				questions: [],
				current: 0,
				editable: false
			}
		};

		this.handleCurrentQuestionChanged = this.handleCurrentQuestionChanged.bind(this);
		this.handleDone = this.handleDone.bind(this);
	}

	updateGameView(data) {
		this.setState({
			gameView: {
				...this.state.gameView,
				...data
			}
		});
	}

	handleCurrentQuestionChanged(current) {
		this.updateGameView({ current });
	}

	handleDone() {
		this.updateGameView({ visible: false, current: 0 });
	}

	render() {
		const {
			props: { visible, sessions, updateSessionView },
			state: { gameView }
		} = this;

		return (
			<div id="session" className={`view ${visible ? 'visible' : ''}`}>
				<div id="sessionHeader" className="header">
					<span className="ml-3">Sessions</span>
					<Button color="secondary" className="mr-3" onClick={() => updateSessionView({ visible: false })}>Fermer</Button>
				</div>

				<div className="scrollable">
					<ListGroup className="m-3">
						{ sessions.map(({name, questions}) => {
							return (
								<ListGroupItem
									onClick={() => this.updateGameView({ visible: true, questions })}
									tag="a"
									action
								>{name}</ListGroupItem>
							);
						}) }
					</ListGroup>

					{ gameView.visible &&
						<div className="centerVertically" >
							<div className="container">
								<div className="row justify-content-center mt-3">
									<div className={`col-md-8 col-xs-12`}>
										<GameView
											{ ...gameView }
											onCurrentQuestionChanged={this.handleCurrentQuestionChanged}
											onDone={this.handleDone}
										/>
									</div>
								</div>
							</div>
						</div>
					}
				</div>
			</div>
		);
	}
}

export default SessionView;