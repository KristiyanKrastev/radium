/* eslint-disable react/prop-types */

import Radium, {PrintStyleSheet} from 'index.js';
import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const getRenderOutput = function(element) {
  const renderer = TestUtils.createRenderer();
  renderer.render(element);
  return renderer.getRenderOutput();
};

const getElement = function(output, tagName) {
  return ReactDOM.findDOMNode(
    TestUtils.findRenderedDOMComponentWithTag(output, tagName)
  );
};

describe('Radium blackbox tests', () => {
  beforeEach(() => {
    Radium.__clearStateForTests();
  });

  it('merges styles', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={[
            {color: 'blue'},
            {background: 'red'}
          ]} />
        );
      }
    }

    const output = getRenderOutput(<TestComponent />);

    expect(output.props.style).to.deep.equal(
      {color: 'blue', background: 'red'}
    );
  });

  it('merges nested styles', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={[
            [{color: 'blue'}, [{height: '2px', padding: '9px'}]],
            {background: 'red'}
          ]} />
        );
      }
    }

    const output = getRenderOutput(<TestComponent />);

    expect(output.props.style).to.deep.equal(
      {color: 'blue', background: 'red', height: '2px', padding: '9px'}
    );
  });

  it('resolves styles on props', () => {
    class InnerComponent extends Component {}

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <InnerComponent header={
            <div style={[{color: 'blue'}, {background: 'red'} ]}/>
          } />
        );
      }
    }

    const output = getRenderOutput(<TestComponent />);

    expect(output.props.header.props.style).to.deep.equal(
      {color: 'blue', background: 'red'}
    );
  });

  it('resolves styles on props', () => {
    class InnerComponent extends Component {
      render() {
        return this.props.stuff;
      }
    }

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <InnerComponent stuff={
            <div style={[
              {color: 'blue'},
              {background: 'red', ':active': {color: 'green'}}
            ]} />
          } />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');

    TestUtils.Simulate.mouseDown(div);

    expect(div.style.color).to.equal('green');
  });

  it('resolves styles on functions', () => {
    class InnerComponent extends Component {
      render() {
        return this.props.children('arg');
      }
    }

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <InnerComponent>{arg =>
            <div style={[
              {color: 'blue'},
              {background: 'red', ':active': {color: 'green'}}
            ]}>
              {arg}
            </div>
          }</InnerComponent>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');
    expect(div.textContent).to.equal('arg');

    TestUtils.Simulate.mouseDown(div);

    expect(div.style.color).to.equal('green');
  });

  it('adds hover styles', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            background: 'red',
            color: 'blue',
            ':hover': {color: 'green'}
          }} />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');

    TestUtils.SimulateNative.mouseOver(div);

    expect(div.style.color).to.equal('green');
  });

  it('adds active styles', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            background: 'red',
            color: 'blue',
            ':active': {color: 'green'}
          }} />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');

    TestUtils.Simulate.mouseDown(div);

    expect(div.style.color).to.equal('green');
  });

  it('resolves styles on multiple elements nested far down, Issue #307', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <section>
            <section>
              <section>
                <header key="header" style={{
                  color: 'yellow',
                  ':hover': { color: 'blue' }
                }} />
                <footer key="footer" style={{
                  color: 'green',
                  ':hover': { color: 'red' }
                }} />
              </section>
            </section>
          </section>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const header = getElement(output, 'header');
    expect(header.style.color).to.equal('yellow');

    const footer = getElement(output, 'footer');
    expect(footer.style.color).to.equal('green');

    TestUtils.SimulateNative.mouseOver(header);
    TestUtils.SimulateNative.mouseOver(footer);

    expect(header.style.color).to.equal('blue');
    expect(footer.style.color).to.equal('red');
  });

  it('applies print styles through the PrintStyle component', () => {
    Radium(React.createClass({
      displayName: 'TestComponent',

      statics: {
        printStyles: {
          foo: {color: 'blue'},
          bar: {background: 'red'}
        }
      },

      render() {
        return (
          <div />
        );
      }
    }));

    class TestComponent2 extends Component {
      render() {
        return <div />;
      }
    }

    TestComponent2.displayName = 'TestComponent2';
    TestComponent2.printStyles = {
      main: {color: 'black'}
    };
    Radium(TestComponent2);

    const output = TestUtils.renderIntoDocument(<PrintStyleSheet />);

    const style = getElement(output, 'style');

    expect(style.innerText).to.equal(
      '@media print{' +
      '.Radium-TestComponent-foo{color: blue !important;}' +
      '.Radium-TestComponent-bar{background: red !important;}' +
      '.Radium-TestComponent2-main{color: black !important;}' +
      '}'
    );
  });

  it('resolves styles if an element has element children and spreads props', () => {
    @Radium
    class Inner extends Component {
      propTypes = { children: PropTypes.node }
      render() {
        return (
          <div {...this.props} style={[{color: 'blue'}, {background: 'red'}]}>
            {this.props.children}
          </div>
        );
      }
    }

    @Radium
    class Outer extends Component {
      render() {
        return (
          <Inner>
            <span>We will break you.</span>
          </Inner>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<Outer />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');
  });

  it('calls toString on object values', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            background: {toString: () => 'red'}
          }} />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const div = getElement(output, 'div');

    expect(div.style.background).to.equal('red');
  });

  it('accepts a config', () => {
    const truthyMatchMedia = function() {
      return {
        matches: true,
        addListener: function() {},
        removeListener: function() {}
      };
    };

    @Radium({
      matchMedia: truthyMatchMedia
    })
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            '@media (min-width: 600px)': {color: 'blue'}
          }} />
        );
      }
    }

    const output = getRenderOutput(<TestComponent />);

    expect(output.props.style).to.deep.equal(
      {color: 'blue'}
    );
  });

  it('transforms fallback values', () => {
    @Radium()
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            height: ['100%', '100vh']
          }} />
        );
      }
    }

    const output = getRenderOutput(<TestComponent />);

    expect(output.props.style).to.deep.equal(
      {height: '100%;height:100vh'}
    );
  });

  it('adds active styles on space', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            background: 'red',
            color: 'blue',
            ':active': {color: 'green'}
          }} />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);

    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.style.background).to.equal('red');

    TestUtils.SimulateNative.keyDown(div, {key: ' '});

    expect(div.style.color).to.equal('green');

    TestUtils.SimulateNative.keyUp(div, {key: ' '});

    expect(div.style.color).to.equal('blue');
  });

  it('works with children as keyed object ala React Router', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div>
            {this.props.children.nav}
            {this.props.children.main}
          </div>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(
      <TestComponent>
        {{
          nav: <nav>nav</nav>,
          main: <main>main</main>
        }}
      </TestComponent>
    );

    const nav = getElement(output, 'nav');
    expect(nav.innerText).to.equal('nav');

    const main = getElement(output, 'main');
    expect(main.innerText).to.equal('main');
  });

  it('preserves array children as arrays', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        expect(Array.isArray(this.props.children)).to.equal(true);
        return (
          <div>
            {this.props.children}
          </div>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(
      <TestComponent>
        {[
          <nav key="nav">nav</nav>,
          <main key="main">main</main>
        ]}
      </TestComponent>
    );

    const nav = getElement(output, 'nav');
    expect(nav.innerText).to.equal('nav');

    const main = getElement(output, 'main');
    expect(main.innerText).to.equal('main');
  });

  it('calls existing onMouseEnter handler', () => {
    const handleMouseEnter = sinon.spy();

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div
            onMouseEnter={handleMouseEnter}
            style={{':hover': {color: 'red'}}}
          />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const div = getElement(output, 'div');
    TestUtils.SimulateNative.mouseOver(div);

    expect(handleMouseEnter).to.have.been.called;
  });

  it('calls existing onMouseLeave handler', () => {
    const handleMouseLeave = sinon.spy();

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div
            onMouseLeave={handleMouseLeave}
            style={{':hover': {color: 'red'}}}
          />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const div = getElement(output, 'div');
    TestUtils.SimulateNative.mouseOut(div);

    expect(handleMouseLeave).to.have.been.called;
  });

  it('calls existing onMouseDown handler', () => {
    const handleMouseDown = sinon.spy();

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div
            onMouseDown={handleMouseDown}
            style={{':active': {color: 'red'}}}
          />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const div = getElement(output, 'div');
    TestUtils.SimulateNative.mouseDown(div);

    expect(handleMouseDown).to.have.been.called;
  });

  it('calls existing onFocus handler', () => {
    const handleFocus = sinon.spy();

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <input
            onFocus={handleFocus}
            style={{':focus': {color: 'red'}}}
          />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const input = getElement(output, 'input');
    TestUtils.SimulateNative.focus(input);

    expect(handleFocus).to.have.been.called;
  });

  it('calls existing onBlur handler', () => {
    const handleBlur = sinon.spy();

    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <input
            onBlur={handleBlur}
            style={{':focus': {color: 'red'}}}
          />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const input = getElement(output, 'input');
    TestUtils.SimulateNative.blur(input);

    expect(handleBlur).to.have.been.called;
  });

  it('ignores callback refs', () => {
    @Radium
    class TestComponent extends Component {
      render() {
        return (
          <div>
            <span key="a" ref={() => {}} style={{':hover': {color: 'red'}}} />
            <nav key="b" ref={() => {}} style={{':hover': {color: 'red'}}} />
          </div>
        );
      }
    }

    const output = TestUtils.renderIntoDocument(<TestComponent />);
    const span = getElement(output, 'span');
    const nav = getElement(output, 'nav');

    TestUtils.SimulateNative.mouseOver(span);
    expect(span.style.color).to.equal('red');
    expect(nav.style.color).to.equal('');

    TestUtils.SimulateNative.mouseOver(nav);
    expect(nav.style.color).to.equal('red');
  });

  describe('plugins', () => {
    it('runs a custom plugin', () => {
      const makeItRedPlugin = () => ({style: {color: 'red'}});

      @Radium
      class TestComponent extends Component {
        render() {
          return <div style={{}} />;
        }
      }

      const output = TestUtils.renderIntoDocument(
        <TestComponent radiumConfig={{plugins: [makeItRedPlugin]}} />
      );
      const div = getElement(output, 'div');

      expect(div.style.color).to.equal('red');
    });
  });

  /* eslint-disable no-console */
  it('doesn\'t try to setState if not mounted', () => {
    sinon.stub(console, 'error');
    sinon.stub(console, 'warn');

    const addListener = sinon.spy();
    const mockMatchMedia = function() {
      return {
        matches: true,
        addListener: addListener,
        removeListener() {}
      };
    };

    @Radium({matchMedia: mockMatchMedia})
    class TestComponent extends Component {
      render() {
        return (
          <div style={{
            '@media (min-width: 600px)': {color: 'blue'}
          }} />
        );
      }
    }

    const output = TestUtils.renderIntoDocument(
      <TestComponent/>
    );

    expect(addListener).to.have.been.called;

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(output).parentNode);

    const listener = addListener.lastCall.args[0];
    listener(mockMatchMedia);

    expect(console.error).not.to.have.been.called;
    expect(console.warn).not.to.have.been.called;

    console.error.restore();
    console.warn.restore();
  });
  /* eslint-enable no-console */

  it('works with stateless components', () => {
    let MyStatelessComponent = props => (
      <div style={{color: 'blue', ':hover': {color: 'red'}}}>
        {props.children}
      </div>
    );
    MyStatelessComponent = Radium(MyStatelessComponent);

    const output = TestUtils.renderIntoDocument(
      <MyStatelessComponent>hello world</MyStatelessComponent>
    );
    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.innerText).to.equal('hello world');

    TestUtils.SimulateNative.mouseOver(div);

    expect(div.style.color).to.equal('red');
  });

  it('works with stateless components with context', () => {
    let MyStatelessComponent = (props, context) => (
      <div style={{color: 'blue', ':hover': {color: context.hoverColor}}}>
        {props.children}
      </div>
    );
    MyStatelessComponent.contextTypes = {
      hoverColor: PropTypes.string
    };
    MyStatelessComponent = Radium(MyStatelessComponent);

    class ContextGivingWrapper extends Component {
      getChildContext() {
        return {
          hoverColor: 'green'
        };
      }
      render() {
        return this.props.children;
      }
    }
    ContextGivingWrapper.childContextTypes = {
      hoverColor: PropTypes.string
    };

    const output = TestUtils.renderIntoDocument(
      <ContextGivingWrapper>
        <MyStatelessComponent>hello world</MyStatelessComponent>
      </ContextGivingWrapper>
    );
    const div = getElement(output, 'div');

    expect(div.style.color).to.equal('blue');
    expect(div.innerText).to.equal('hello world');

    TestUtils.SimulateNative.mouseOver(div);

    expect(div.style.color).to.equal('green');
  });

  it('transfers defaultProps for stateless components', () => {
    const defaultProps = {foo: PropTypes.string};

    let MyStatelessComponent = () => <div />;
    MyStatelessComponent.defaultProps = defaultProps;
    MyStatelessComponent = Radium(MyStatelessComponent);

    expect(MyStatelessComponent.defaultProps).to.equal(defaultProps);
  });

  /* eslint-disable no-console */
  it('replaces style propType with array or object', () => {
    sinon.stub(console, 'error');
    sinon.stub(console, 'warn');

    class TestComponent extends Component {
      render() {
        return <div {...this.props} />;
      }
    }
    TestComponent.propTypes = {style: PropTypes.object};
    TestComponent = Radium(TestComponent);

    TestUtils.renderIntoDocument(
      <TestComponent style={[]} />
    );

    expect(console.error).not.to.have.been.called;
    expect(console.warn).not.to.have.been.called;

    console.error.restore();
    console.warn.restore();
  });
  /* eslint-enable no-console */

  describe('config', () => {
    it('receives config from radiumConfig prop', () => {
      const plugin = sinon.spy();

      @Radium
      class TestComponent extends Component {
        render() {
          return <div style={{}} />;
        }
      }

      TestUtils.renderIntoDocument(
        <TestComponent radiumConfig={{plugins: [plugin]}} />
      );

      expect(plugin).to.have.been.called;
    });

    it('receives config from context', () => {
      const plugin = sinon.spy();

      @Radium
      class ParentComponent extends Component {
        render() {
          return <div style={{}}><ChildComponent /></div>;
        }
      }

      @Radium
      class ChildComponent extends Component {
        render() {
          return <div style={{}} />;
        }
      }

      TestUtils.renderIntoDocument(
        <ParentComponent radiumConfig={{plugins: [plugin]}} />
      );

      expect(plugin).to.have.callCount(2);
    });
  });
});
