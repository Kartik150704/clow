import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoadingAnimation = ({setLoading}) => {
    // Animation values
    const rotation = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.9)).current;
    const textPosition = useRef(new Animated.Value(40)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    // Curtain animation values
    const leftCurtain = useRef(new Animated.Value(0)).current;
    const rightCurtain = useRef(new Animated.Value(0)).current;

    // Vertical lines moving horizontally animation values
    const leftVerticalLine = useRef(new Animated.Value(0)).current;
    const rightVerticalLine = useRef(new Animated.Value(0)).current;
    const splitLineOpacity = useRef(new Animated.Value(0)).current;

    // Fade-out animation values for logo and text
    const fadeOutOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Create rotation animation for logo with a custom easing to match the swirl design
        const spinAnimation = Animated.timing(rotation, {
            toValue: 1,
            duration: 1200, // Slightly longer for more fluid motion
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom curve that complements the swirl
            useNativeDriver: true,
        });

        // Start the animation sequence
        Animated.sequence([
            // Step 1: Quickly fade in logo with spin
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 500, // Faster fade-in
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
                spinAnimation, // Spin only during the fade-in
            ]),

            // Step 2: Wait briefly before showing text
            Animated.delay(300),

            // Step 3: Animate text from bottom with bounce effect
            Animated.parallel([
                Animated.spring(textPosition, {
                    toValue: 0,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),

            // Step 4: First fade out the logo and text completely
            Animated.timing(fadeOutOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),

            // Step 5: AFTER fadeout completes, introduce the vertical lines in the middle
            Animated.parallel([
                Animated.timing(splitLineOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),

            // Step 6: Vertical lines move horizontally in opposite directions
            Animated.parallel([
                Animated.timing(leftVerticalLine, {
                    toValue: -width / 2,
                    duration: 800,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(rightVerticalLine, {
                    toValue: width / 2,
                    duration: 800,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),

            // Step 6: Curtain transition immediately after split lines
            Animated.parallel([
                Animated.timing(leftCurtain, {
                    toValue: -width / 2,
                    duration: 800,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(rightCurtain, {
                    toValue: width / 2,
                    duration: 800,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // Call setLoading(true) after the animation sequence completes
            setLoading(false);
        });

        // No need for a cleanup function that stops an animation that's already completed
    }, []);

    // Interpolate the rotation value to actual rotation string
    // Using a more natural rotation pattern that highlights the swirl design
    const spinInterpolation = rotation.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '100deg', '200deg', '300deg', '360deg'],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            {/* Vertical lines moving horizontally - The Uber-like opening container effect */}
            <Animated.View
                style={[
                    styles.verticalLine,
                    styles.leftVerticalLine,
                    {
                        opacity: splitLineOpacity,
                        transform: [{ translateX: leftVerticalLine }]
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.verticalLine,
                    styles.rightVerticalLine,
                    {
                        opacity: splitLineOpacity,
                        transform: [{ translateX: rightVerticalLine }]
                    }
                ]}
            />

            {/* Curtain effect - moved to be on top of z-index stack */}
            <Animated.View
                style={[
                    styles.curtain,
                    styles.leftCurtain,
                    { transform: [{ translateX: leftCurtain }] }
                ]}
            />
            <Animated.View
                style={[
                    styles.curtain,
                    styles.rightCurtain,
                    { transform: [{ translateX: rightCurtain }] }
                ]}
            />

            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: Animated.multiply(logoOpacity, fadeOutOpacity),
                            transform: [
                                { scale: logoScale },
                                { rotate: spinInterpolation },
                                // Adding a slight perspective tilt to enhance the swirl motion
                                { perspective: 1000 },
                                { rotateX: '5deg' },
                            ],
                        },
                    ]}
                >
                    {/* Make sure this image path is correct or use a local require */}
                    <Image
                        source={require('./clow.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity: Animated.multiply(textOpacity, fadeOutOpacity),
                            transform: [{ translateY: textPosition }],
                        },
                    ]}
                >
                    <Text style={styles.text}>CLOW</Text>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        overflow: 'hidden',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        zIndex: 10, // Increased to ensure it's above the curtains initially
    },
    logoContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        // Adding a subtle shadow to enhance the depth
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logo: {
        width: 80,
        height: 80,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 34,
        fontFamily: 'System',
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 6,
        marginTop: 10,
    },
    curtain: {
        position: 'absolute',
        top: 0,
        height: height,
        width: width / 2,
        backgroundColor: '#000000',
        zIndex: 5, // Lower than the content but still above the background
    },
    leftCurtain: {
        left: 0,
    },
    rightCurtain: {
        right: 0,
    },
    // Vertical lines moving horizontally styles
    verticalLine: {
        position: 'absolute',
        width: 6, // Thicker vertical line (was 3)
        height: height, // Full height of screen
        backgroundColor: '#FFFFFF', // White color
        zIndex: 8, // Below content (was 15) - so it won't appear over text/logo
    },
    leftVerticalLine: {
        left: width / 2 - 7, // Slightly adjusted for thicker line
    },
    rightVerticalLine: {
        left: width / 2 + 1, // Slightly adjusted for thicker line
    },
});

export default LoadingAnimation;