import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenerateOtp, Login } from './api/login';

const OTPVerificationScreen = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);

  const otpInputRefs = useRef([]);
  const emailInputRef = useRef(null);

  // Initialize otpInputRefs with 4 refs
  useEffect(() => {
    otpInputRefs.current = Array(4).fill(0).map((_, i) => otpInputRefs.current[i] || React.createRef());
  }, []);

  // Handle email submission
  const handleEmailSubmit = async () => {
    // Validate email is from iitrpr.ac.in domain
    if (email && email.endsWith('@iitrpr.ac.in')) {
      setIsEmailSubmitted(true);
      console.log('Email submitted:', email);
      // In a real app, you'd call your API here to send the OTP
      let response = await GenerateOtp(email)
      console.log(response);
      // Auto-fill OTP for development purposes
      setOtp(['1', '2', '3', '4']);
    } else {
      Alert.alert('Invalid Email', 'Please use an email with @iitrpr.ac.in domain');
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus to next input if value is entered
      if (value && index < 3) {
        otpInputRefs.current[index + 1].focus();
        setActiveOtpIndex(index + 1);
      }
    }
  };

    // Handle backspace in OTP inputs
    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1].focus();
            setActiveOtpIndex(index - 1);
        }
    };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 4) {
      // Log the email to console
      console.log('Verified email:', email);
      try {
        let response = await Login(email);
        console.log(response);
        await AsyncStorage.setItem('id', response.id);

      }
      catch (e) {

      }
      // Save email to local storage
      saveEmailToStorage(email);
      setIsLoggedIn(true);
      // Navigate to next screen or show success message

    }
  };

  // Function to save email to local storage
  const saveEmailToStorage = async (emailToSave) => {
    try {
      await AsyncStorage.setItem('userEmail', emailToSave);
      console.log('Email saved to local storage successfully');
    } catch (error) {
      console.error('Error saving email to local storage:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>CLOW</Text>

          {!isEmailSubmitted ? (
            // Email input screen
            <View style={styles.formContainer}>
              <Text style={styles.heading}>Enter your email</Text>
              <Text style={styles.subheading}>
                We'll send you a verification code
              </Text>

              <TextInput
                ref={emailInputRef}
                style={styles.emailInput}
                placeholder="your@iitrpr.ac.in"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleEmailSubmit}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  !email || !email.endsWith('@iitrpr.ac.in') ? styles.buttonDisabled : null,
                ]}
                onPress={handleEmailSubmit}
                disabled={!email || !email.endsWith('@iitrpr.ac.in')}
              >
                <Text style={styles.buttonText}>Send Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // OTP verification screen
            <View style={styles.formContainer}>
              <Text style={styles.heading}>Enter verification code</Text>
              <Text style={styles.subheading}>
                We sent a code to {email}
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpInputWrapper,
                      activeOtpIndex === index && styles.activeOtpInputWrapper,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => (otpInputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setActiveOtpIndex(index)}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  otp.join('').length !== 4 ? styles.buttonDisabled : null,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.join('').length !== 4}
              >
                <Text style={styles.buttonText}>Verify</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  // In a real app, you'd resend the OTP here
                  console.log('Resending OTP to:', email);
                }}
              >
                <Text style={styles.resendButtonText}>Resend Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeEmailButton}
                onPress={() => {
                  setIsEmailSubmitted(false);
                  setOtp(['', '', '', '']);
                }}
              >
                <Text style={styles.changeEmailButtonText}>Change Email</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 2,
  },
  formContainer: {
    width: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 32,
  },
  emailInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#6A5ACD', // Purple color for Clow
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#2C2C2C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    width: '22%',
  },
  activeOtpInputWrapper: {
    borderBottomColor: '#6A5ACD', // Purple color when active
  },
  otpInput: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendButtonText: {
    color: '#6A5ACD', // Purple color for Clow
    fontSize: 16,
  },
  changeEmailButton: {
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  changeEmailButtonText: {
    color: '#AAAAAA',
    fontSize: 16,
  },
});

export default OTPVerificationScreen;