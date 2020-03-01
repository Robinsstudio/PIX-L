import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdminView from './AdminView';
import StudentView from './StudentView';
import AccountView from './AccountView';
import Modals from './Modals';
import ProtectedRoute from './ProtectedRoute';

import request from './request';
import HomeView from './HomeView';

/**
 * This App component is the root component of the project.
 * It handles client-sided routing with React-Router.
 */
class App extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		this.setAuthenticated = this.setAuthenticated.bind(this);
	}

	componentDidMount() {
		request('isAuthenticated').then(resp => resp.json()).then(({authenticated}) => this.setState({ authenticated }));
	}

	/**
	 * Sets the user authenticated as the result of a call to the API in componentDidMount()
	 *
	 * @param {boolean} authenticated - true if the user has successfully authenticated
	 */
	setAuthenticated(authenticated) {
		this.setState({ authenticated });
	}

	render() {
		const { authenticated } = this.state;
		return (
			<Fragment>
				<Router>
					<Switch>
						<Route
							path={process.env.PUBLIC_URL + '/jeu/:url'}
							render={props => <StudentView {...props} authenticated={authenticated}/>}
						/>

						<ProtectedRoute
							path={process.env.PUBLIC_URL + '/compte'}
							component={AccountView}
							authenticated={authenticated}
							setAuthenticated={this.setAuthenticated}
						/>

						<ProtectedRoute
							path={process.env.PUBLIC_URL + '/admin'}
							component={AdminView}
							authenticated={authenticated}
							setAuthenticated={this.setAuthenticated}
						/>

						<Route
							path={process.env.PUBLIC_URL}
							component={HomeView}
						/>
					</Switch>
				</Router>
				{Modals.get()}
			</Fragment>
		);
	}
}

export default App;