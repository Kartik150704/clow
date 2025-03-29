import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Assume these API functions are available
import { FetchProfile, UpdateProfile } from './api/profile';
import { handleImageUpload } from '../utils/UploadFile';

const RiderProfileForm = ({ navigation, notify }) => {
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    driving_license_number: '',
    status: 'unverified'
  });

  // Photo states
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [collegeIdPhoto, setCollegeIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  // Photo previews
  const [licensePreview, setLicensePreview] = useState(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentCameraTarget, setCurrentCameraTarget] = useState(null); // 'selfie', 'license', or 'collegeId'
  const [cameraType, setCameraType] = useState('front'); // 'front' or 'back'

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoErrors, setPhotoErrors] = useState({});
  const [profileStatus, setProfileStatus] = useState('unverified');
  const [comment, setComment] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);
  useEffect(() => {
    if (notify && notify.type == "profile") {
      fetchProfile();
    }
  }, [notify])
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      // In a real app, get ID from AsyncStorage
      // const id = await AsyncStorage.getItem('id');

      // Using hardcoded ID as requested
      const id = await AsyncStorage.getItem('id');

      const response = await FetchProfile(id);

      if (response) {
        setForm({
          name: response.name || '',
          phone_number: response.phone_number || '',
          driving_license_number: response.driving_license_number || '',
          status: response.status || 'unverified'
        });

        setProfileStatus(response.status || 'unverified');
        setComment(response.comment || null);

        // Set photo previews if we have URLs in the response
        if (response.driving_license_photo) {
          setLicensePreview(response.driving_license_photo);
        }
        if (response.college_id_photo) {
          setCollegeIdPreview(response.college_id_photo);
        }
        if (response.person_photo) {
          setSelfiePreview(response.person_photo);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const newPhotoErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    const phoneRegex = /^\+?[1-9]\d{9,11}$/;
    if (!form.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!phoneRegex.test(form.phone_number.replace(/\\s+/g, ''))) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    // Optional validation for license
    if (form.driving_license_number && form.driving_license_number.length < 5) {
      newErrors.driving_license_number = 'License number should be at least 5 characters';
    }

    // Photo validations - PHOTOS ARE REQUIRED
    if (!licensePhoto && !licensePreview) {
      newPhotoErrors.license = 'Driving license photo is required';
    }

    if (!collegeIdPhoto && !collegeIdPreview) {
      newPhotoErrors.collegeId = 'College ID photo is required';
    }

    if (!selfiePhoto && !selfiePreview) {
      newPhotoErrors.selfie = 'A selfie photo is required';
    }

    setErrors(newErrors);
    setPhotoErrors(newPhotoErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newPhotoErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Request permissions
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          // Camera permission
          const cameraGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app needs access to your camera to take photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          // Storage permission for accessing photos
          const storageGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Photo Library Permission',
              message: 'This app needs access to your photo library to select photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            // Alert.alert('Permission Required', 'Camera permission is needed to take photos');
          }

          if (storageGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            // Alert.alert('Permission Required', 'Photo library permission is needed to select photos');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestPermissions();
  }, []);

  // Handle image picker
  const handleImagePick = async (type) => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8,
      };

      const result = await launchImageLibrary(options);

      if (!result.didCancel && result.assets && result.assets[0]) {
        const selectedAsset = result.assets[0];

        // Check file size - 5MB max
        if (selectedAsset.fileSize > 5 * 1024 * 1024) {
          setPhotoErrors(prev => ({
            ...prev,
            [type]: 'Image size should not exceed 5MB'
          }));
          return;
        }

        // Clear any previous errors
        setPhotoErrors(prev => ({
          ...prev,
          [type]: ''
        }));

        // Create file representation for upload
        const photoFile = {
          uri: selectedAsset.uri,
          type: selectedAsset.type || 'image/jpeg',
          name: `${type}_photo_${Date.now()}.jpg`,
        };

        // Update state based on type
        if (type === 'license') {
          setLicensePhoto(photoFile);
          setLicensePreview(selectedAsset.uri);
        } else if (type === 'collegeId') {
          setCollegeIdPhoto(photoFile);
          setCollegeIdPreview(selectedAsset.uri);
        } else if (type === 'selfie') {
          setSelfiePhoto(photoFile);
          setSelfiePreview(selectedAsset.uri);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle camera
  const handleOpenCamera = async (type) => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8,
        cameraType: type === 'selfie' ? 'front' : 'back',
        saveToPhotos: true,
      };

      const result = await launchCamera(options);

      if (!result.didCancel && result.assets && result.assets[0]) {
        const selectedAsset = result.assets[0];

        // Clear any previous errors
        setPhotoErrors(prev => ({
          ...prev,
          [type]: ''
        }));

        // Create file representation for upload
        const photoFile = {
          uri: selectedAsset.uri,
          type: selectedAsset.type || 'image/jpeg',
          name: `${type}_photo_${Date.now()}.jpg`,
        };

        // Update state based on type
        if (type === 'license') {
          setLicensePhoto(photoFile);
          setLicensePreview(selectedAsset.uri);
        } else if (type === 'collegeId') {
          setCollegeIdPhoto(photoFile);
          setCollegeIdPreview(selectedAsset.uri);
        } else if (type === 'selfie') {
          setSelfiePhoto(photoFile);
          setSelfiePreview(selectedAsset.uri);
        }
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Remove a photo
  const removePhoto = (type) => {
    if (type === 'license') {
      setLicensePhoto(null);
      setLicensePreview(null);
    } else if (type === 'collegeId') {
      setCollegeIdPhoto(null);
      setCollegeIdPreview(null);
    } else if (type === 'selfie') {
      setSelfiePhoto(null);
      setSelfiePreview(null);
    }
  };

  // View photo in full screen modal
  const viewPhoto = (uri) => {
    setSelectedPhotoUri(uri);
    setPhotoModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);

      // Upload images if they exist
      let licensePhotoUrl = null;
      let collegeIdPhotoUrl = null;
      let selfiePhotoUrl = null;

      if (licensePhoto) {
        const licenseUploadResult = await handleImageUpload(
          `${form.name}_license`,
          licensePhoto
        );
        if (licenseUploadResult.success) {
          licensePhotoUrl = licenseUploadResult.imageUrl;
        } else {
          throw new Error('Failed to upload license photo');
        }
      }

      if (collegeIdPhoto) {
        const collegeIdUploadResult = await handleImageUpload(
          `${form.name}_collegeId`,
          collegeIdPhoto
        );
        if (collegeIdUploadResult.success) {
          collegeIdPhotoUrl = collegeIdUploadResult.imageUrl;
        } else {
          throw new Error('Failed to upload college ID photo');
        }
      }

      if (selfiePhoto) {
        const selfieUploadResult = await handleImageUpload(
          `${form.name}_selfie`,
          selfiePhoto
        );
        if (selfieUploadResult.success) {
          selfiePhotoUrl = selfieUploadResult.imageUrl;
        } else {
          throw new Error('Failed to upload selfie photo');
        }
      }

      // In real app, get email from AsyncStorage
      // const userEmail = await AsyncStorage.getItem('userEmail');

      // Using hardcoded email as requested
      const userEmail = await AsyncStorage.getItem('userEmail');

      const dataToSave = {
        name: form.name,
        phone_number: form.phone_number,
        driving_license_number: form.driving_license_number,
        email: userEmail,
        license_photo_url: licensePhotoUrl || licensePreview,
        college_id_photo_url: collegeIdPhotoUrl || collegeIdPreview,
        selfie_photo_url: selfiePhotoUrl || selfiePreview
      };

      // Using hardcoded ID as requested
      const id = await AsyncStorage.getItem('id');
      const updatedProfile = await UpdateProfile(id, dataToSave);
      setProfileStatus(updatedProfile.status || 'unverified');

      Alert.alert(
        "Success",
        "Profile updated successfully! Your profile is pending verification."
      );
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert(
        "Error",
        "Failed to update profile"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Rider Profile</Text>
          <Text style={styles.subtitle}>Update your personal information</Text>

          {/* Profile Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusAlert,
              profileStatus === 'verified' ? styles.statusVerified : styles.statusPending
            ]}>
              {profileStatus === 'verified' ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusIcon}>✅</Text>
                  <Text style={styles.statusText}>Your profile has been verified</Text>
                </View>
              ) : (
                <View>
                  {!comment ? (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusIcon}>⚠️</Text>
                      <Text style={styles.statusText}>Your profile is pending verification</Text>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.statusRow}>
                        <Text style={styles.statusIcon}>⚠️</Text>
                        <Text style={styles.statusText}>Your profile is pending verification</Text>
                      </View>
                      <Text style={styles.commentText}>Comment: {comment}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name ? styles.inputError : null
                ]}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
                value={form.name}
                onChangeText={(text) => handleChange('name', text)}
              />
            </View>
            {errors.name && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Phone Number Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.phone_number ? styles.inputError : null
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor="#666"
                value={form.phone_number}
                onChangeText={(text) => handleChange('phone_number', text)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone_number && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errors.phone_number}</Text>
              </View>
            )}
          </View>

          {/* Driving License Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Driving License Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.driving_license_number ? styles.inputError : null
                ]}
                placeholder="Enter your license number"
                placeholderTextColor="#666"
                value={form.driving_license_number}
                onChangeText={(text) => handleChange('driving_license_number', text)}
              />
            </View>
            {errors.driving_license_number && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errors.driving_license_number}</Text>
              </View>
            )}
          </View>

          {/* Document Upload Section */}
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Required Documents</Text>

            {/* Driving License Photo */}
            <View style={styles.documentContainer}>
              <Text style={styles.documentLabel}>Driving License Photo</Text>
              {licensePreview ? (
                <View style={styles.previewContainer}>
                  <TouchableOpacity onPress={() => viewPhoto(licensePreview)}>
                    <Image
                      source={{ uri: licensePreview }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('license')}
                  >
                    <Text style={styles.removeButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImagePick('license')}
                  >
                    <Text style={styles.uploadButtonIcon}>📁</Text>
                    <Text style={styles.uploadButtonText}>Select Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleOpenCamera('license')}
                  >
                    <Text style={styles.uploadButtonIcon}>📷</Text>
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {photoErrors.license && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{photoErrors.license}</Text>
                </View>
              )}
            </View>

            {/* College ID Photo */}
            <View style={styles.documentContainer}>
              <Text style={styles.documentLabel}>College ID Photo</Text>
              {collegeIdPreview ? (
                <View style={styles.previewContainer}>
                  <TouchableOpacity onPress={() => viewPhoto(collegeIdPreview)}>
                    <Image
                      source={{ uri: collegeIdPreview }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('collegeId')}
                  >
                    <Text style={styles.removeButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImagePick('collegeId')}
                  >
                    <Text style={styles.uploadButtonIcon}>📁</Text>
                    <Text style={styles.uploadButtonText}>Select Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleOpenCamera('collegeId')}
                  >
                    <Text style={styles.uploadButtonIcon}>📷</Text>
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {photoErrors.collegeId && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{photoErrors.collegeId}</Text>
                </View>
              )}
            </View>

            {/* Selfie Photo */}
            <View style={styles.documentContainer}>
              <Text style={styles.documentLabel}>Selfie Photo</Text>
              {selfiePreview ? (
                <View style={styles.previewContainer}>
                  <TouchableOpacity onPress={() => viewPhoto(selfiePreview)}>
                    <Image
                      source={{ uri: selfiePreview }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('selfie')}
                  >
                    <Text style={styles.removeButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleImagePick('selfie')}
                  >
                    <Text style={styles.uploadButtonIcon}>📁</Text>
                    <Text style={styles.uploadButtonText}>Select Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleOpenCamera('selfie')}
                  >
                    <Text style={styles.uploadButtonIcon}>📷</Text>
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
              {photoErrors.selfie && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{photoErrors.selfie}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <View style={styles.buttonRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Updating Profile...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setPhotoModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>❌</Text>
          </TouchableOpacity>

          <Image
            source={{ uri: selectedPhotoUri }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusAlert: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  statusVerified: {
    backgroundColor: '#133929',
    borderLeftColor: '#10b981',
  },
  statusPending: {
    backgroundColor: '#422006',
    borderLeftColor: '#f97316',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  commentText: {
    color: '#ffa07a',
    marginTop: 4,
    fontSize: 14,
    marginLeft: 28,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    height: 48,
  },
  inputIcon: {
    fontSize: 18,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    paddingVertical: 8,
    paddingRight: 12,
    fontSize: 16,
    height: '100%',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
  documentsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  documentContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  documentLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 0.48,
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
});

export default RiderProfileForm