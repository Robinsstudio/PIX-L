import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import request from './request';

import './style/home_view.css';

class HomeView extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidMount() {
		request('GetActiveSessions')
		.then(res => res.json())
		.then(sessions => this.setState({ sessions }));
	}

	render() {
		const { sessions } = this.state;
		return (
			<div id="homepage">
				<div id="homepageHeader" className="background-color-blue">
					<div id="smallTitle">PIX-L</div>
					<Link to={process.env.PUBLIC_URL + '/admin'} id="explorerLink">Espace admin</Link>
				</div>
				<div id="homepageMain">
					<div id="homepageMainTitle" className="color-blue">PIX-L</div>
					<div id="homepageMainSubtitle" className="color-blue">Votre nouvel outil de préparation à la certification PIX !</div>
					{ sessions &&
						<div id="homepageSessions">
							<div id="homepageSessionsTitle" className="color-orange">
								{ sessions.length
									? `Session${sessions.length > 1 ? 's' : ''} en cours`
									: 'Aucune session en cours' }
							</div>
							{sessions.map(({name, url}) => {
								return (
									<Link
										to={`${process.env.PUBLIC_URL}/jeu/${url}`}
										className="homepageSession"
									>{ name }</Link>
								);
							})}
						</div>
					}
				</div>
				<div id="homepageFooter" className="background-color-blue">
					&copy; Tous droits réservés 2020 - Robin DOS ANJOS, Damien DONNADIEU et Baptiste GALLAIS
				</div>
			</div>
		);
	}
}

export default HomeView;