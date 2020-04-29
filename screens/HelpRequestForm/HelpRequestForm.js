// @flow
import React, { useState } from "react";
import { Text, Input } from "react-native-elements";
import { View, TouchableOpacity, StyleSheet, Alert, Keyboard, ScrollView, Dimensions } from "react-native";
import { WHITE, ORANGE, BLACK, RED, LIGHT_GRAY } from "../../styles/colors";
import { FONT_FAMILY_REGULAR, FONT_SIZE_20, FONT_SIZE_12 } from "../../styles/typography";
import gql from "graphql-tag";
import { useMutation } from "react-apollo";
import { useLocation, useAuth } from "../../customHooks/";
import { CustomModal } from "../../components/molecules";
import { padding } from "../../styles/mixins";
import { Toast } from "../../components/atoms";

const WORD_LIMIT = 100;
const NO_OF_LINES_FOR_DESC = Math.ceil(Dimensions.get("window").height / 50);
const noOfPeopleSelectBoxOptions = [1, 2, 3, 4, 5, 6];

const HELP_REQUEST = gql`
  mutation CreateHelpRequest($uid:String!,$username: String!, $mobileNo:String!,$lat:Float!,$long:Float!,$desc:String!, $time:Date!, $name:String!, $noPeopleRequired:Int!){
    createHelp(data:{
      creator:$uid,
      creatorName: $username,
      mobileNo:$mobileNo,
      name:$name,
      latitude:$lat,
      longitude:$long,
      timeStamp: $time,
      noPeopleAccepted:0,
      noPeopleRequested:0,
      status:"REQUESTED",
      description:$desc,
      noPeopleRequired:$noPeopleRequired
    }){
      _id
    }
  }
`;

const HelpRequestForm = () => {
    const [state, setState] = useState({
        noPeopleRequired: 1,
        description: "",
        latitude: null,
        longitude: null,
        locationProviderAvailable: false,
        locationErrorMessage: "",
    });

    const [createHelp, { loading, data, error }] = useMutation(HELP_REQUEST);
    const { longitude, latitude, locationProviderAvailable, locationErrorMessage } = useLocation();
    const { user: currentUser } = useAuth();
    if(!currentUser) return <CustomModal variant="loading" />
    const { uid, attributes, username } = currentUser;
    const { name, phone_number: phoneNumber } = attributes;
    const { defaultCheckBoxStyle, activeCheckBox, 
        inActiveCheckBox, activeText, inActiveText,
        requestHelpStyle, requestButtonText, container, innerContainer,
        label, descriptionContainerStyle, noPeopleSelector , WordLimitStatusText
    } = styles;

    const handleCheckBox = (val) => {
        setState({ ...state, noPeopleRequired: val, [`checkBox${val}`]: true });
    }

    const getCheckBoxStyle = (val) => [defaultCheckBoxStyle, state.noPeopleRequired === val ? activeCheckBox : inActiveCheckBox];

    const getCheckBoxTextStyle = (val) => state.noPeopleRequired === val ? activeText : inActiveText;

    const requestHelp = () => {
        const { description, noPeopleRequired } = state;
        if (locationProviderAvailable === false && latitude === null && longitude === null) {
            Alert.alert(locationErrorMessage ? locationErrorMessage : "location error");
        } else {
            Keyboard.dismiss();
            createHelp({
                variables: {
                    uid,
                    noPeopleRequired,
                    mobileNo: phoneNumber,
                    lat: latitude,
                    long: longitude,
                    desc: description,
                    time: new Date().getTime(),
                    name,
                    username
                }
            });
        }
    }

    const Option = ({ val }) => (
        <TouchableOpacity onPress={() => handleCheckBox(val)} style={getCheckBoxStyle(val)} key={val}>
            <Text style={getCheckBoxTextStyle(val)}>{val}</Text>
        </TouchableOpacity>
    );

    const RequestButton = () => (
        <TouchableOpacity onPress={requestHelp} style={requestHelpStyle}>
            <Text style={requestButtonText}>Request</Text>
        </TouchableOpacity>
    );

    const getWordsLeft = (description) => {
        return WORD_LIMIT - description.split(/\s/).length + 1;
    }

    const WordLimitStatus = () => {
        const { description } = state;
        const wordsThreshold = getWordsLeft(description);
        const textColor = wordsThreshold <= 0 ? RED : LIGHT_GRAY;
        const text = wordsThreshold <= 0 ? "Limit Reached" : `${wordsThreshold} words left`;
        return <Text style={{...WordLimitStatusText, color: textColor }}>{text}</Text>
    }

    const _onChangeText = (value) => {
        const temp = state.description;
        if(getWordsLeft(value) <= 0 && value[value.length - 1] !== ' ') {
            setState({...state, description: temp});
        } else {
            setState({ ...state, description: value })
        }
    }

    const getToast = () => {
        if(data) return { type: "success", message: "Success, Check activity" }
        else if(error) return { type: "danger", message: "Something went wrong! try again"}
        return  { type: "", message: "" }
    }

    if (loading) {
        return <CustomModal variant="loading" />
    }

    return (
        <ScrollView style={{backgroundColor: WHITE}}>
            <View style={container}>
                {getToast().type ? <Toast type={getToast().type} message={getToast().message} duration={4000} /> : null}
                <View style={innerContainer}>
                    <Text style={{...label, padding:10}}>Request will be created for current location</Text>
                    <Input
                        placeholder="Please describe your help"
                        inputContainerStyle={descriptionContainerStyle}
                        multiline={true}
                        numberOfLines={NO_OF_LINES_FOR_DESC}
                        onChangeText={_onChangeText}
                        inputStyle={{ textAlignVertical: 'top' }}
                        value={state.description}
                    />
                    <WordLimitStatus />
                    <Text style={label}>Please select number of people required for help</Text>
                    <View style={noPeopleSelector}>
                        {noOfPeopleSelectBoxOptions.map((val) => <Option key={val} val={val} />)}
                    </View>
                    <RequestButton />
                </View>
            </View>
        </ScrollView>  
    );
}

export default HelpRequestForm;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: WHITE,
        padding: 20,
    },
    innerContainer: {
        backgroundColor: WHITE, 
        borderRadius: 10, 
        // elevation: 10, 
        borderWidth: 0.1, 
        borderColor: BLACK
    },
    requestHelpStyle: {
        margin: 10,
        ...padding(5,15,5,15),
        backgroundColor: ORANGE,
        borderRadius: 10,
        alignSelf: 'center'
    },
    requestButtonText: {
        textAlign: 'center',
        color: WHITE,
        fontSize: FONT_SIZE_20
    },
    descriptionContainerStyle: {
        backgroundColor: WHITE,
        borderWidth: 1, 
        borderColor: BLACK,
    },
    noPeopleSelector: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    activeCheckBox: {
        backgroundColor: ORANGE,
        borderColor: ORANGE,
    },
    defaultCheckBoxStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 14,
        paddingRight: 14,
        margin: 5,
        borderRadius: 5
    },
    inActiveCheckBox: {
        backgroundColor: WHITE,
        borderColor: ORANGE,
    },
    activeText: {
        color: WHITE,
        fontSize: 20,
        fontFamily: FONT_FAMILY_REGULAR
    },
    inActiveText: {
        color: ORANGE,
        fontSize: 20,
        fontFamily: FONT_FAMILY_REGULAR
    },
    label: {
        color: BLACK,
        fontSize: FONT_SIZE_12,
        textAlign: 'center',
    },
    WordLimitStatusText: {
        color: BLACK,
        fontSize: FONT_SIZE_12,
        textAlign: 'center', 
        textAlign: 'right', 
        right: 10
    }
});