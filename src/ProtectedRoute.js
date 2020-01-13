import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import LoginView from './LoginView';

class ProtectedRoute extends Component {
	render() {
		const { authenticated, setAuthenticated, component: Component, ...props } = this.props;
		return (
			<Route
				{...props}
				render={props => {
					if (authenticated === undefined) {
						return <div/>;
					}
					return authenticated ? <Component {...props}/> : <LoginView setAuthenticated={setAuthenticated}/>;
				}
			}/>
		);
	}
}

export default ProtectedRoute;