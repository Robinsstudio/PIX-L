import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdminView from './AdminView';
import StudentView from './StudentView';
import Modals from './Modals';

class App extends Component {
	render() {
		return (
			<Fragment>
				<Router>
					<Switch>
						<Route path={process.env.PUBLIC_URL + '/jeu/:url'} component={StudentView}/>
						<Route path={process.env.PUBLIC_URL} component={AdminView}/>
					</Switch>
				</Router>
				{Modals.get()}
			</Fragment>
		);
	}
}

export default App;