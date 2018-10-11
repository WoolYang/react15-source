import React from 'React';
import ReactDOM from 'ReactDOM';

class Test extends React.Component {
    constructor() {
        super();
        this.state = {
            color: 'red'
        }
    }

    componentDidMount() {
       // this.setState({ color: '#ccc' })
    }

    render() {
        const names = ['Alice', 'Emily', 'Kate=:'];

        return (
            <div className='test' style={{ background: this.state.color, height: '100px', width: '100px' }}>
                Hello World!
                 <div>
                    {
                        names.map(item => <div key={item} >{item}</div>)
                    }
                </div>
            </div>
        )
    }
}

ReactDOM.render(
    <Test />,
    document.getElementById('root')
)