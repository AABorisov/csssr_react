// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение

import React from "react"
import PropTypes from "prop-types"
import ReactDOM from "react-dom"

const createStore = (reducer, initialState) => {
    let currentState = initialState
    const listeners = []

    const getState = () => currentState
    const dispatch = action => {
        currentState = reducer(currentState, action)
        listeners.forEach(listener => listener())
    }

    const subscribe = listener => listeners.push(listener)

    return { getState, dispatch, subscribe }
}

const connect = (mapStateToProps, mapDispatchToProps) =>
    Component => {
        class WrappedComponent extends React.Component {
            render() {
                return (
                    <Component
                        {...this.props}
                        {...mapStateToProps(this.context.store.getState(), this.props)}
                        {...mapDispatchToProps(this.context.store.dispatch, this.props)}
                    />
                )
            }

            componentDidMount() {
                this.context.store.subscribe(this.handleChange)
            }

            handleChange = () => {
                this.forceUpdate()
            }
        }

        WrappedComponent.contextTypes = {
            store: PropTypes.object,
        }

        return WrappedComponent
    }

class Provider extends React.Component {
    getChildContext() {
        return {
            store: this.props.store,
        }
    }

    render() {
        return React.Children.only(this.props.children)
    }
}

Provider.childContextTypes = {
    store: PropTypes.object,
}

// APP

// actions
const CHANGE_INTERVAL = 'CHANGE_INTERVAL'

// action creators
const changeInterval = value => ({
    type: CHANGE_INTERVAL,
    payload: value,
})


// reducers
const initialState = 1
const reducer = (state = initialState, action) => {
    switch(action.type) {
        case CHANGE_INTERVAL:
            return Math.max(1, state + action.payload)
        default:
            return state
    }
}

// components

class IntervalComponent extends React.Component {
    changeInterval = ( value = 0 ) => {
        this.props.changeInterval && this.props.changeInterval( value )
    }
    onClickMinus = () => {
        this.changeInterval( -1 )
    }
    onClickPlus = () => {
        this.changeInterval( 1 )
    }
    render() {
        const { currentInterval } = this.props
        return (
            <div>
                <span>Интервал обновления секундомера: { currentInterval } сек.</span>
                <span>
          <button onClick={ this.onClickMinus } disabled={ currentInterval <= 1 }>-</button>
          <button onClick={ this.onClickPlus }>+</button>
        </span>
            </div>
        )
    }
}

const Interval = connect(
    state => ({
        currentInterval: state,
    }),
    dispatch => ({
        changeInterval: value => dispatch(changeInterval(value)),
    }))(IntervalComponent)

class TimerComponent extends React.Component {
    state = {
        currentTime: 0,
        timeoutId: null
    }

    render() {
        const { currentTime, timeoutId } = this.state
        return (
            <div>
                <Interval />
                <div>
                    Секундомер: { currentTime } сек.
                </div>
                <div>
                    <button onClick={ this.handleStart } disabled={ timeoutId } >Старт</button>
                    <button onClick={ this.handleStop } disabled={ !timeoutId } >Стоп</button>
                </div>
            </div>
        )
    }

    setNextInterval = () => {
        const currentInterval = this.props.currentInterval
        const timeoutId = setTimeout(() => {
            this.setState(state => {
                return { currentTime: state.currentTime + currentInterval }
            })
            this.setNextInterval()
        }, currentInterval * 1000)
        this.setState( state => {
            return { timeoutId }
        })
    }

    handleStart = () => {
        if ( !this.state.timeoutId ) {
            this.setNextInterval()
        }
    }

    handleStop = () => {
        if ( this.state.timeoutId ) {
            clearTimeout( this.state.timeoutId )
            this.setState({
                currentTime: 0,
                timeoutId: null
            })
        }
    }
}

const Timer = connect(
    state => ({
        currentInterval: state,
    }),
    () => {})(TimerComponent)

// init
const storeInitialState = 1
ReactDOM.render(
    <Provider store={ createStore( reducer, storeInitialState )}>
        <Timer />
    </Provider>,
    document.getElementById('app')
)
