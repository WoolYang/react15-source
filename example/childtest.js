import React, { Children } from 'React';

export default class Childtest extends React.Component {

    render() {
        const children = this.props.children;
        return (
            <div>
                {
                    Children.map(children, (item =>  <div>{item}</div> ))
                }
            </div>
        )
    }
}