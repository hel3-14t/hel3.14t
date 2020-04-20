// @flow
import React from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { BoxButton, Heading } from '../atoms';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { FONT_BOLD } from '../../styles/typography';
import { ORANGE, BLACK, GREEN, LIGHT_GREEN, RED, LIGHT_RED, LIGHTEST_GRAY } from '../../styles/colors';
import { margin } from '../../styles/mixins';
import Icon from "react-native-vector-icons/FontAwesome";

type RequesterProps = {
  uidOfRequester: string, 
  keyOfHelpRequest: string,
  usersAccepted: Array<Object>, 
  noPeopleRequired: number, 
  xp: number, 
  name: string, 
  stars: number,
  mobileNo: String
}

const Requester = (props: RequesterProps) => {
  const { uidOfRequester, keyOfHelpRequest, usersAccepted, noPeopleRequired, xp, name, mobileNo, stars } = props;

  const QUERY = gql`
    mutation UpdateHelp($key:String!, $value:Any, $operation:String!){
      updateHelp(id:"${keyOfHelpRequest}", key:$key, value:$value, type:"array", operation:$operation){
        _id
      }
    }
  `;

  const [updateHelpForAccept, { loading: loadingForAccept }] = useMutation(QUERY);
  const [updateHelpForReject, { loading: loadingForReject }] = useMutation(QUERY);

  const handleAccept = async () => {
    if (noPeopleRequired === usersAccepted.length) {
      Alert.alert("Users filled....")
    } else if (usersAccepted.indexOf(uidOfRequester) > -1) {
      Alert.alert("You are already helping....");
    } else {
      updateHelpForAccept({ variables: { key: "usersAccepted", value: { uid: uidOfRequester, name, mobileNo }, operation: "push" } });
    }
  };

  const handleReject = async () => {
    updateHelpForReject({ variables: { key: "usersRejected", value: { uid: uidOfRequester }, operation: "push", type: "array" } });
  };

  const { container, content, details, buttons } = styles;

  return (
    <View style={container}>
      <View style={content}>
        <View style={details}>
          <Heading color={ORANGE}>{name}</Heading>
          <Text><Text style={{...FONT_BOLD , color:BLACK }}>{xp}</Text> Earned XP</Text>
          <Text><Text style={{...FONT_BOLD , color:BLACK }}>{stars}</Text> Average rating</Text>
        </View>
      </View>
      <View style={buttons}>
        <BoxButton 
          title="Accept" 
          titleColor={GREEN} 
          bgColor={LIGHT_GREEN} 
          onPress={handleAccept} 
          loading={loadingForAccept} 
          iconName="check"
        />
        <BoxButton 
          title="Reject" 
          titleColor={RED} 
          bgColor={LIGHT_RED} 
          onPress={handleReject} 
          loading={loadingForReject} 
          iconName="remove"  
        />
      </View>
    </View>
   );
};

export default Requester;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: LIGHTEST_GRAY,
    justifyContent: 'space-between',
    ...margin(5,0,5,0)
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    padding: 5
  },
  details: {
    flexDirection: 'column',
  },
  buttons: {
    flexDirection: 'row',
  },
});