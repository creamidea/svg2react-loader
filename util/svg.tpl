var React = require('react');

class SVG<%= displayName %> extends React.Component {
  static defaultProps = <%= JSON.stringify(defaultProps) %>;

  constructor (props) {
    super(props);
    this.displayName = <%= JSON.stringify(displayName) %>;
  }

  render () {
    const props = this.props;

    return <svg {...props}>
      <%= innerXml %>
    </svg>;
  }
}

module.exports = SVG<%= displayName %>
