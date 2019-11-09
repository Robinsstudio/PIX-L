import React, { PureComponent } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

class CodeRenderer extends PureComponent {
	render() {
		const { language, value } = this.props;
		return (
			<SyntaxHighlighter language={language} style={googlecode}>
				{value}
			</SyntaxHighlighter>
		);
	}
}

export default CodeRenderer;