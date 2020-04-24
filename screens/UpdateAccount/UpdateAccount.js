// @flow
import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { ORANGE, WHITE, LIGHTEST_GRAY } from '../../styles/colors';
import { Button, CustomDatePicker, Selector} from '../../components/atoms';
import { Auth } from "aws-amplify";
import { SCREEN_DETAILS, SIGN_UP_SCREEN } from "../../constants/appConstants";
import { InputComponent, CustomModal } from '../../components/molecules';
import { padding } from '../../styles/mixins';
import { regex, getAge } from '../../utils';

const AGE_LIMIT = 15;
const GENDER_OPTIONS = [
    {label:"Male", value: "male"}, 
    {label:"Female", value:"female"}
];
const { ERRORS } = SIGN_UP_SCREEN;
const {
  EMPTY_EMAIL_ERROR, 
  INVALID_EMAIL_ERROR, 
  EMPTY_MOBILE_NUMBER_ERROR, 
  INVALID_MOBILE_NUMBER_ERROR,
} = ERRORS;
const { LOGIN, VERIFICATION, MY_ACCOUNT } = SCREEN_DETAILS;

const UpdateAccount = ({ navigation, route }) => {
    const { params } = route;
    const { user } = params;
    const { attributes } = user;
    const { email, phone_number: phoneNumber, gender, birthdate } = attributes;
    const phoneNumberWithoutCountryCode = phoneNumber.replace("+91", "");

    const [ emailForUpdate, setEmail ] = useState(email);
    const [ phoneNumberForUpdate, setPhoneNumber ] = useState(phoneNumberWithoutCountryCode);
    const [ birthdateForUpdate, setBirthdate ] = useState(birthdate);
    const [ genderForUpdate, setGender ] = useState(gender);
    const [ emailErr, setEmailErr ] = useState('');
    const [ mobileNumberErr, setMobileNumberErr ] = useState('');
    const [ loading, setLoading] = useState(false);

    const isValid = () => {
        let valid = false;
        
        if (email.length === 0) {
          setEmailErr(EMPTY_EMAIL_ERROR );
        } else if (!emailForUpdate.match(regex.email)) {
          setEmailErr(INVALID_EMAIL_ERROR )
        } else if (phoneNumberForUpdate.length === 0) {
          setMobileNumberErr(EMPTY_MOBILE_NUMBER_ERROR)
        } else if (!phoneNumberForUpdate.match(regex.phoneNo)) {
          setMobileNumberErr(INVALID_MOBILE_NUMBER_ERROR);
        } else if(birthdateForUpdate.length === 0) {
          Alert.alert("Date of birth can't be empty");
        } else if(getAge(birthdateForUpdate) < AGE_LIMIT) {
          Alert.alert("You should me more than "+ AGE_LIMIT + " years");
        } else {
          valid = true;
        }
        
        return valid;
      };

      const verify = async (otp) => {
        return await Auth.verifyCurrentUserAttributeSubmit('phone_number', otp);
      }
    
      const redirectTo = async (otp) => {
        await Auth.signOut();
        navigation.navigate(LOGIN.screenName);
      }
    
      const resend = async () => {
        return await Auth.verifyCurrentUserAttribute('phone_number')
      }
    
    const handleUpdate = async () => {
        if(isValid()) {
            const phoneNumberWithCountryCode = `+91${phoneNumberForUpdate}`;
            try {
              setLoading(true);
              const user = await Auth.currentAuthenticatedUser();
              await Auth.updateUserAttributes(user, { 
                "email" : emailForUpdate,
                "phone_number": phoneNumberWithCountryCode,
                "birthdate" : birthdateForUpdate,
                "gender": genderForUpdate 
              });
              setLoading(false);
              if(phoneNumberForUpdate !== phoneNumberWithoutCountryCode){
                const paramsForVerificationScreen = { verify, redirectTo, resend, message: `Enter OTP sent to xxxxxxxx${phoneNumberForUpdate.substr(8)}`};
                navigation.navigate(VERIFICATION.screenName, paramsForVerificationScreen);
              } else {
                await Auth.signOut();
                navigation.navigate(LOGIN.screenName);
              }
            } catch (error) {
              setLoading(false);
              console.log(error); 
            }
        }
    }

    const handleCancel = () => {
        navigation.navigate(MY_ACCOUNT.screenName);
    }

    if(loading) return <CustomModal variant="loading" desc="Please wait" />

    return (
        <ScrollView style={{ backgroundColor: WHITE }} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, margin: 20 }}>
                <View style={{flex: 1}}>
                    <InputComponent 
                        label="Email" 
                        updateParentState={setEmail} 
                        errMsg={emailErr} 
                        value={emailForUpdate} 
                        defaultValue={email}
                    />
                </View>
                <View style={{flex: 1}}>
                    <InputComponent 
                        label="Mobile Number" 
                        updateParentState={setPhoneNumber} 
                        errMsg={mobileNumberErr} 
                        value={phoneNumberForUpdate}
                        defaultValue={phoneNumberWithoutCountryCode}
                    />
                </View>
                <View style={{flex: 1}}>
                    <CustomDatePicker dob={birthdate} updateParentState={setBirthdate} label="Date of Birth" date={birthdate} />
                </View>
                <View style={{flex: 1}}>
                    <Selector options={GENDER_OPTIONS} label="Gender" onValueChange={setGender} defaultValue={gender} />
                </View>  
            </View>
            <View style={{felx: 1, flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: LIGHTEST_GRAY }}>
                    <Button onPress={handleCancel} bgColor={LIGHTEST_GRAY}>Cancel</Button>
                    <View style={{width: 10 }} />    
                    <Button bgColor={ORANGE} textColor={WHITE} onPress={handleUpdate}>Update</Button>
                </View>
        </ScrollView>
    ); 
}

export default UpdateAccount;