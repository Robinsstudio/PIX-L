import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdminView from './AdminView';
import StudentView from './StudentView';
import AccountView from './AccountView';
import Modals from './Modals';
import ProtectedRoute from './ProtectedRoute';

import request from './request';

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {};

		this.setAuthenticated = this.setAuthenticated.bind(this);
	}

	componentDidMount() {
		request('isAuthenticated').then(resp => resp.json()).then(({authenticated}) => this.setState({ authenticated }));
	}

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
							path={process.env.PUBLIC_URL}
							component={AdminView}
							authenticated={authenticated}
							setAuthenticated={this.setAuthenticated}
						/>
					</Switch>
				</Router>
				{Modals.get()}
			</Fragment>
		);
	}
}

export default App;