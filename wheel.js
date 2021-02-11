
import React, {Component} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    slotWrapper: {
        backgroundColor: 'gray',
        marginLeft: 5,
    },
    slotInner: {
        backgroundColor: 'black',
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    text: {
        fontSize: 50,
        top: -2,
        fontWeight: 'bold',
        color: '#b5b7ba',
    },
    innerBorder: {
        position: 'absolute',
        top: 1,
        right: 1,
        left: 1,
        bottom: 1,
        borderColor: 'black',
        borderWidth: 1,
        zIndex: 1,
    },
    outerBorder: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        borderColor: '#989898',
        borderWidth: 1,
        zIndex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        backgroundColor: '#ffffff77'
    }
});

export default class SlotMachine extends Component {

    static get defaultProps() {
        return {
            text: 0,
            width: 37,
            height: 50,
            padding: 4,
            duration: 2000,
            delay: 0,
            slotInterval: 500,
            defaultChar: '0',
            range: '9876543210',
            initialAnimation: true,
            styles: {},
            renderTextContent: (currentChar) => currentChar,
            useNativeDriver: false,
        };
    }

    constructor(props) {
        super(props);
        this.renderSlot = this.renderSlot.bind(this);
        this.startInitialAnimation = this.startInitialAnimation.bind(this);
        this.renderContent = this.renderContent.bind(this);

        this.text = props.text;
        let values;
        if (props.initialAnimation) {
            values = this.getInitialSlotsValues(props);
        } else {
            values = this.getAlignedValues(props).map(val => new Animated.Value(val));
        }
        this.state = {values, initialAnimation: false};
    }

    componentDidMount() {
        const {delay, initialAnimation} = this.props;
        if (!initialAnimation) {
            return;
        }
        setTimeout(this.startInitialAnimation, delay);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.text === this.text) {
            return;
        }
        this.text = newProps.text;
        const {range, duration, useNativeDriver} = newProps;
        const easing = Easing.inOut(Easing.ease);
        const paddedStr = this.getPaddedString(newProps);
        const newValues = this.getAdjustedAnimationValues(newProps);

        this.setState({values: newValues}, () => {
            const newAnimations = paddedStr.split('').map((char, i) => {
                const index = range.indexOf(char);
                const animationValue = -1 * (index) * newProps.height;
                return Animated.timing(this.state.values[i], {toValue: animationValue, duration, easing, useNativeDriver: useNativeDriver});
            });
            Animated.parallel(newAnimations).start();
        });
    }

    getAdjustedAnimationValues(props) {
        const {values} = this.state;
        const paddedStr = this.getPaddedString(props);
        let neededValues = paddedStr.length - values.length;

        if (neededValues <= 0) {
            return values;
        }

        const defaultIndex = props.range.indexOf(props.defaultChar);
        const defaultPosition = this.getPosition(defaultIndex, props);
        const newValues = [...values];

        while (neededValues--) {
            newValues.unshift(new Animated.Value(defaultPosition));
        }

        return newValues;
    }

    getPosition(index, props = this.props) {
        const position = -1 * (index) * props.height;
        return position;
    }

    getAlignedValues(props) {
        const paddedStr = this.getPaddedString();
        const {range} = props;

        const values = paddedStr.split('').map((char) => {
            const index = range.indexOf(char);
            const animationValue = this.getPosition(index, props);
            return animationValue;
        });

        return values;
    }

    getInitialSlotsValues(props) {
        const values = [];
        const strNum = String(this.text);
        const animationValue = this.getPosition(props.range.length - 1, props);

        let slotCount = Math.max(props.padding, strNum.length);
        while (slotCount--) {
            values.push(new Animated.Value(animationValue));
        }

        return values;
    }

    getPaddedString(props = this.props) {
        const {padding, defaultChar} = props;

        let paddedText = String(this.text);
        let neededPadding = Math.max(0, padding - paddedText.length);
        while ((neededPadding--) > 0) {
            paddedText = `${defaultChar}${paddedText}`;
        }

        return paddedText;
    }

    generateSlots() {
        const paddedStr = this.getPaddedString();
        const elements = paddedStr.split('').map(this.renderSlot);
        return elements;
    }

    startInitialAnimation() {
        const {values} = this.state;
        const {duration, slotInterval, useNativeDriver} = this.props;
        const easing = Easing.inOut(Easing.ease);

        const animations = values.map((value, i) => {
            const animationDuration = duration - (values.length - 1 - i) * slotInterval;
            return Animated.timing(value, {toValue: 0, duration: animationDuration, easing, useNativeDriver: useNativeDriver});
        });

        Animated.parallel(animations).start(() => {
            const newValues = this.getAlignedValues(this.props);
            newValues.forEach((value, i) => values[i].setValue(value));
            this.setState({initialAnimation: false});
        });

        this.setState({initialAnimation: true});
    }

    spinTo(value) {
        this.text = value;
        const values = this.getInitialSlotsValues(this.props);
        this.setState({values}, () => this.startInitialAnimation());
    }

    renderContent(currentChar, i, range) {
        const {styles: overrideStyles, renderTextContent} = this.props;        
        const textContent = renderTextContent(currentChar, i, range);
        return (<Text style={[styles.text, overrideStyles.text]}>{textContent}</Text>);
    }

    renderSlot(charToShow, position) {
        const {range, styles: overrideStyles, height, width, renderContent = this.renderContent} = this.props;
        const {initialAnimation, values} = this.state;
        const charToShowIndex = range.indexOf(charToShow);

        const slots = range.split('').map((num, i) => {
            let currentChar = num;
            if (initialAnimation) {
                const currentIndex = (i + charToShowIndex) % range.length;
                currentChar = range[currentIndex];
            }
            
            const content = renderContent(currentChar, i, range);
            return (
                <Animated.View
                    key={i}
                    style={[styles.slotInner, {height}, overrideStyles.slotInner, {transform: [{translateY: values[position]}]} ]}
                >
                    {content}
                </Animated.View>
            );
        });

        return (
            <View key={position} style={[styles.slotWrapper, {height, width}, overrideStyles.slotWrapper]}>
                {slots}
                <View style={[styles.innerBorder, overrideStyles.innerBorder]} />
                <View style={[styles.outerBorder, overrideStyles.outerBorder]} />
                <View style={[styles.overlay, {bottom: height / 1.6}, overrideStyles.overlay]} />
            </View>
        );
    }

    render() {
        const slots = this.generateSlots();
        return (
            <View style={[styles.container, this.props.styles.container]}>
                {slots}
            </View>
        );
    }
}


/*import React from 'react';
import {
  StyleSheet,
  View,
  Text as RNText,
  Dimensions,
  Animated
} from 'react-native';
import { GestureHandler, Svg } from 'expo';
import * as d3Shape from 'd3-shape';
import color from 'randomcolor';
import { snap } from '@popmotion/popcorn';
const { PanGestureHandler, State } = GestureHandler;
const { Path, G, Text, TSpan } = Svg;
const { width } = Dimensions.get('screen');

const numberOfSegments = 12;
const wheelSize = width * 0.95;
const fontSize = 26;
const oneTurn = 360;
const angleBySegment = oneTurn / numberOfSegments;
const angleOffset = angleBySegment / 2;
const knobFill = color({ hue: 'purple' });

const makeWheel = () => {
  const data = Array.from({ length: numberOfSegments }).fill(1);
  const arcs = d3Shape.pie()(data);
  const colors = color({
    luminosity: 'dark',
    count: numberOfSegments
  });

  return arcs.map((arc, index) => {
    const instance = d3Shape
      .arc()
      .padAngle(0.01)
      .outerRadius(width / 2)
      .innerRadius(20);

    return {
      path: instance(arc),
      color: colors[index],
      value: Math.round(Math.random() * 10 + 1) * 200, //[200, 2200]
      centroid: instance.centroid(arc)
    };
  });
};

export default class App extends React.Component {
  _wheelPaths = makeWheel();
  _angle = new Animated.Value(0);
  angle = 0;

  state = {
    enabled: true,
    finished: false,
    winner: null
  };

  componentDidMount() {
    this._angle.addListener(event => {
      if (this.state.enabled) {
        this.setState({
          enabled: false,
          finished: false
        });
      }

      this.angle = event.value;
    });
  }

  _getWinnerIndex = () => {
    const deg = Math.abs(Math.round(this.angle % oneTurn));
    // wheel turning counterclockwise
    if(this.angle < 0) {
      return Math.floor(deg / angleBySegment);
    }
    // wheel turning clockwise
    return (numberOfSegments - Math.floor(deg / angleBySegment)) % numberOfSegments;
};

  _onPan = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { velocityY } = nativeEvent;

      Animated.decay(this._angle, {
        velocity: velocityY / 1000,
        deceleration: 0.999,
        useNativeDriver: true
      }).start(() => {
        this._angle.setValue(this.angle % oneTurn);
        const snapTo = snap(oneTurn / numberOfSegments);
        Animated.timing(this._angle, {
          toValue: snapTo(this.angle),
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          const winnerIndex = this._getWinnerIndex();
          this.setState({
            enabled: true,
            finished: true,
            winner: this._wheelPaths[winnerIndex].value
          });
        });
        // do something here;
      });
    }
  };
  render() {
    return (
      <PanGestureHandler
        onHandlerStateChange={this._onPan}
        enabled={this.state.enabled}
      >
        <View style={styles.container}>
          {this._renderSvgWheel()}
          {this.state.finished && this.state.enabled && this._renderWinner()}
        </View>
      </PanGestureHandler>
    );
  }

  _renderKnob = () => {
    const knobSize = 30;
    // [0, numberOfSegments]
    const YOLO = Animated.modulo(
      Animated.divide(
        Animated.modulo(Animated.subtract(this._angle, angleOffset), oneTurn),
        new Animated.Value(angleBySegment)
      ),
      1
    );

    return (
      <Animated.View
        style={{
          width: knobSize,
          height: knobSize * 2,
          justifyContent: 'flex-end',
          zIndex: 1,
          transform: [
            {
              rotate: YOLO.interpolate({
                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                outputRange: ['0deg', '0deg', '35deg', '-35deg', '0deg', '0deg']
              })
            }
          ]
        }}
      >
        <Svg
          width={knobSize}
          height={(knobSize * 100) / 57}
          viewBox={`0 0 57 100`}
          style={{ transform: [{ translateY: 8 }] }}
        >
          <Path
            d="M28.034,0C12.552,0,0,12.552,0,28.034S28.034,100,28.034,100s28.034-56.483,28.034-71.966S43.517,0,28.034,0z   M28.034,40.477c-6.871,0-12.442-5.572-12.442-12.442c0-6.872,5.571-12.442,12.442-12.442c6.872,0,12.442,5.57,12.442,12.442  C40.477,34.905,34.906,40.477,28.034,40.477z"
            fill={knobFill}
          />
        </Svg>
      </Animated.View>
    );
  };

  _renderWinner = () => {
    return (
      <RNText style={styles.winnerText}>Winner is: {this.state.winner}</RNText>
    );
  };

  _renderSvgWheel = () => {
    return (
      <View style={styles.container}>
        {this._renderKnob()}
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              {
                rotate: this._angle.interpolate({
                  inputRange: [-oneTurn, 0, oneTurn],
                  outputRange: [`-${oneTurn}deg`, `0deg`, `${oneTurn}deg`]
                })
              }
            ]
          }}
        >
          <Svg
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${width} ${width}`}
            style={{ transform: [{ rotate: `-${angleOffset}deg` }] }}
          >
            <G y={width / 2} x={width / 2}>
              {this._wheelPaths.map((arc, i) => {
                const [x, y] = arc.centroid;
                const number = arc.value.toString();

                return (
                  <G key={`arc-${i}`}>
                    <Path d={arc.path} fill={arc.color} />
                    <G
                      rotation={(i * oneTurn) / numberOfSegments + angleOffset}
                      origin={`${x}, ${y}`}
                    >
                      <Text
                        x={x}
                        y={y - 70}
                        fill="white"
                        textAnchor="middle"
                        fontSize={fontSize}
                      >
                        {Array.from({ length: number.length }).map((_, j) => {
                          return (
                            <TSpan
                              x={x}
                              dy={fontSize}
                              key={`arc-${i}-slice-${j}`}
                            >
                              {number.charAt(j)}
                            </TSpan>
                          );
                        })}
                      </Text>
                    </G>
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  winnerText: {
    fontSize: 32,
    fontFamily: 'Menlo',
    position: 'absolute',
    bottom: 10
  }
});*/